---
title: "Why MCP, Not REST APIs?"
date: "2026-08-03"
readTime: "10 min"
preview: "The question comes up the moment you try to make an agent use your existing API. The answer isn't that REST is wrong — it's that REST was designed for a client who reads the docs at build time, and an LLM isn't that client."
description: "REST assumes a client that read the docs at build time. An LLM isn't that client — why MCP fits agents better, and what it changes about tool design."
---

The question showed up for me in a very specific way. We had a REST API that worked fine — versioned, documented, an OpenAPI spec that generated typed clients. Then someone asked whether an agent could use it, and the obvious move was to hand the model an HTTP tool and the spec and let it figure things out.

It sort of worked. It also burned tokens on payloads nobody read, called the wrong endpoint when two had similar names, and silently paginated forever.

So: why MCP instead of just exposing the REST API? The honest answer is that they aren't competing at the same layer, and the interesting part is *why* they aren't.

---

## The real difference is binding time

A REST client binds to the contract at **build time**. A developer reads the docs, generates or writes a client, handles the auth flow, decides which endpoints to call in which order, and ships that decision as code. By the time the program runs, every question about the API has already been answered by a human.

An MCP client binds at **runtime**. The model connects to a server, asks what it can do, and gets back a list of tools — each with a name, a description, and a JSON Schema for its inputs. Then it decides. Nobody wrote the call sequence in advance.

That one shift explains almost everything else. Add a capability to a REST API and clients gain nothing until someone updates and redeploys them. Add a tool to an MCP server and every connected agent can use it on the next request, because discovery happens on every conversation rather than once at compile time.

It also explains the failure modes. When your client is a program, an ambiguous field name is a documentation bug. When your client is a probabilistic dispatcher choosing between forty tools, an ambiguous name is a production incident.

---

## Descriptions stop being documentation and become code

Here's a tool definition:

```json
{
  "name": "get_customer_summary",
  "description": "Get a customer's plan, billing status, and open support tickets. Call this when the user asks about a specific customer's account state, before making any changes to their subscription.",
  "input_schema": {
    "type": "object",
    "properties": {
      "customer_id": { "type": "string", "description": "Internal customer ID, e.g. cus_01H8X" }
    },
    "required": ["customer_id"],
    "additionalProperties": false
  }
}
```

In a REST world, that description string is a comment. It affects nothing at runtime. Here it's the dispatch logic — it's the thing that determines whether this tool gets called at all, and it lives in the model's context window on every single request.

The practical consequence is that the description has to be **prescriptive about when to call**, not just descriptive of what it does. "Get customer summary" states the what. "Call this when the user asks about a specific customer's account state" states the trigger. In my experience — and this matches what Anthropic documents for recent models, which reach for tools more conservatively than their predecessors — the trigger sentence is what moves the should-call rate.

This is genuinely a new engineering discipline. You are writing prose that is load-bearing. It gets reviewed, it gets versioned, and it can regress.

---

## Don't mirror your endpoints

The most common mistake I see — and the first thing I did — is auto-generating one MCP tool per REST endpoint. It's mechanical, it's fast, and it produces a bad server.

REST resources are shaped for composition by client code. `GET /customers/:id`, then `GET /customers/:id/subscriptions`, then `GET /customers/:id/tickets?status=open`, then join the three in memory. That's a fine design when the composition happens in a program: three cheap calls, and the fields you don't need cost nothing to discard.

An agent doing the same thing pays for every intermediate payload in tokens, in latency, and in context that has to survive the rest of the conversation. Three round trips also means three chances to pick the wrong next step.

So MCP tools should be **task-shaped, not resource-shaped**. One `get_customer_summary` that fans out to those three REST calls server-side and returns a trimmed, joined result beats three faithful endpoint wrappers. The unit of design is "a thing the agent is trying to accomplish," not "a row in my database."

The corollary is that a good MCP server is a real piece of software with its own opinions, not a generated shim. If your MCP server is a thin passthrough over your OpenAPI spec, you've done the easy 20% and left the part that matters.

---

## Everything costs context, including the tool list

Two budgets, and both are easy to blow.

**Response payloads.** A REST endpoint returning 200 records with 40 fields each is unremarkable for a web app — the client renders eight of those fields and throws the rest away for free. The same response handed to a model is tens of thousands of tokens it has to read and then carry. Platforms defend against this: on Anthropic's managed agent runtime, tool output over roughly 100,000 characters gets offloaded to a file in the sandbox and the model receives a truncated preview plus a path. That's a guardrail, not a design. Return the eight fields.

**The tool definitions themselves.** Every tool schema sits in the prompt on every request. Wrap 200 endpoints as 200 tools and you've added a large fixed cost to each call *and* handed the model a selection problem it will occasionally lose.

There are real mechanisms for this. Tool search lets you mark most tools `defer_loading: true` and let the model search for what it needs:

```json
{
  "tools": [
    { "type": "tool_search_tool_bm25_20251119", "name": "tool_search_tool_bm25" },
    { "name": "get_customer_summary", "description": "...", "input_schema": {}, "defer_loading": true },
    { "name": "refund_order", "description": "...", "input_schema": {}, "defer_loading": true }
  ]
}
```

Discovered schemas get *appended* to the context rather than swapped in, which matters more than it sounds like: tool definitions render at the very front of the prompt, so naively changing the tool set invalidates the entire prompt cache for that conversation. Appending preserves it. (One gotcha: the search tool itself can't be deferred, and at least one tool has to be non-deferred, or the request is rejected.)

None of this has a REST analogue. Nobody has ever had to think about the cost of *having* an endpoint available. It's the least intuitive part of the shift.

---

## "Why not just give the model an HTTP tool?"

This is the strongest objection, and it deserves a straight answer, because it does work for simple cases.

Give the model one generic `http_request` tool and your OpenAPI spec, and you've moved the entire integration into the prompt. The model now has to know your base URL, your auth scheme, your pagination convention, your error semantics, and which of your 200 paths is relevant — from context, probabilistically, every time. You get no schema validation on inputs, no per-capability permissioning (it's one tool, so a gate on it is a gate on everything), and no discovery. Rate limits and retries become the model's problem.

There's also the multiplication argument, which is the actual reason a protocol exists rather than a convention. Without one, every agent framework times every service is a bespoke integration. With one, it's one server per service, consumable by any MCP client — the same trade that made LSP worth having for editors. That's a much better reason to adopt MCP than any claim about it being a nicer API style.

---

## Auth is where this gets uncomfortable

REST auth is a settled problem. Bearer tokens, OAuth, mTLS, per-route scopes, all boring and well understood.

MCP auth is where most production integrations get awkward, and it's worth being blunt about why: **anything in the model's context is exfiltratable.** Prompt injection is not hypothetical, and a token pasted into a system prompt is a token that can be talked out of the model. So the credential has to live somewhere the model genuinely cannot read.

The pattern that actually works is injection outside the model's reach. Anthropic's managed agent runtime does this with vaults: you store the MCP credential server-side, and it's attached to the outbound request by a proxy *after* the request leaves the sandbox. Code the agent writes cannot read the token, even under injection. If you're building your own harness, the equivalent is keeping the credential in your orchestrator and letting the model call a tool whose implementation you own — the model requests the action, your process performs it with its own credentials.

Two things I've watched people lose time to:

- **MCP credentials are usually not your API keys.** Hosted MCP servers typically want OAuth bearer tokens. A Notion `ntn_` integration token authenticates fine against Notion's REST API and will not work as an MCP credential — different auth systems that happen to front the same product.
- **Least privilege matters more than it does for REST.** The agent can do anything the key allows, and the caller is non-deterministic. A broadly-scoped key is a much larger blast radius when the thing holding it is improvising.

Related: if a capability is hard to reverse — sending a message, deleting data, moving money — make it its own tool rather than a branch inside a general one. A dedicated tool is something your harness can gate, log, and put behind a confirmation. Broad tools can't be gated meaningfully, because the gate can't tell the harmless call from the destructive one.

---

## When REST is still the right answer

MCP is not a general-purpose API style, and treating it as one is its own mistake. Keep REST for:

- **Deterministic pipelines.** If the call sequence is known, a program should make it. Putting a model in the middle adds cost, latency, and variance in exchange for flexibility you aren't using.
- **Latency and throughput paths.** Checkout, auth, anything on a hot path. Runtime discovery and a reasoning step are the wrong overhead.
- **Browser and mobile clients.** Still REST or GraphQL. Nothing about MCP changes this.
- **Public developer platforms.** External developers want a stable versioned contract, caching semantics, ETags, CDN behaviour. Ship both if you want agent support — the MCP server is a second consumer, not a migration.
- **Anything that must be auditable as a fixed contract.** Regulated flows want "these exact calls in this exact order," which is the opposite of what runtime binding gives you.

---

## The honest conclusion

The title's framing is wrong, and I'd rather say so than defend it.

It isn't MCP *instead of* REST. In every production setup I've built or seen, MCP sits **on top of** REST. The REST API stays the system of record — versioned, cached, serving your web and mobile clients. The MCP server is an agent-facing façade in front of it that composes calls into task-shaped tools, trims payloads down to what's actually needed, encodes when-to-use guidance in descriptions, and keeps credentials somewhere the model can't reach.

Framing it as a replacement leads to the two failure modes I've hit most: generating a tool per endpoint and calling it an MCP server, or trying to serve a web frontend through MCP because it's the new thing.

If you're building one, this is roughly the checklist I'd use:

- **Tools are tasks, not resources.** If a tool's name matches an endpoint path, look again.
- **Descriptions say when, not just what.** The trigger condition is the dispatch logic.
- **Return the minimum useful payload.** Every field is billed and remembered.
- **Budget the tool list.** Past a few dozen tools, defer loading and let the model search.
- **Credentials never enter context.** Inject at egress, or keep the call on your side.
- **Destructive actions get their own tools.** That's what makes them gateable.
- **Keep the REST API.** It has clients that aren't agents, and they're the majority.

The mental model that finally made this click for me: REST is an API for someone who read the manual. MCP is an API for someone who has to figure it out from the labels, every time, under a token budget. Same underlying system, very different design constraints.
