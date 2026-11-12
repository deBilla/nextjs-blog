---
title: "AI in simple terms: getting Claude Code and Antigravity to talk to each other"
date: "2026-11-12"
preview: "Hi Guys, I had Claude Code and Antigravity sessions running on the same laptop with no idea the others existed. I started building my own coordination system, then threw it away and went looking for open source. Here's every option I compared, the license surprise that knocked out the most popular one, and what I ended up with…"
description: "Comparing open-source tools that let Claude Code and Antigravity sessions on one laptop message each other and claim files, and why I chose Concord."
tags: ["ai", "llm"]
draft: false
---
Hi Guys, these days I usually have two or three coding agents open at once: a Claude Code session in one terminal and an Antigravity (`agy`) session in another, sometimes on the same repo. They have no idea the others exist. They edit the same files, and when one runs out of budget the other has to start from scratch.

In this post I'll go through how I tried to fix that. First I built my own system, then I went looking for something open source that already does it. I'll show you every option I compared, the license surprise that knocked out the most popular one, and what I finally set up. I'll also be honest about what works and what doesn't.

If you're new to MCP, read [what is an MCP server?](/blogs/ai-in-simple-terms-what-is-an-mcp-server) first. Everything below is MCP servers talking to agents.

## The thing I almost built

My first plan was a project I called **agent-connect**. It was serious: a central hub with a SQLite log, a local connector on each machine acting as the MCP server, and an Ed25519 key that signed every entry so you could prove which agent wrote what. I had the protocol, the core rules and the tool definitions built, with over 150 tests.

Then I asked a simple question: who is this for? The answer was **me, on one laptop**.

On one machine every agent runs as the same user, so every agent can read every key on disk. A signature would only prove that some process on my laptop wrote the entry, and I already knew that. All that crypto bought me nothing. So I decided to make it simple and find an existing tool.

Two ideas from the old design were still worth keeping:

- **Messages from other agents are untrusted input.** An agent can be wrong or prompt-injected, and the next agent reads its handoff and *acts* on it.
- **Claims need a hook, not a polite request.** If you just ask a model to check a lock before editing, it will forget sooner or later.

## What I was looking for

My list was short:

- **Free and open source.** A real open-source license, not just "free to download".
- **Same computer.** No cloud service in the middle.
- **Claude Code and Antigravity.** Both had to work, because that's what I use.
- **Well adopted.** Everything depends on it, so I don't want a project that dies next month.
- **Ideally, file claims that block.** If agent A holds a file, agent B's edit should fail, not just get a warning.

## Round one: the obvious search

The first search turned up a handful of MCP servers built for exactly this. These are the ones I looked at closely:

| Project | Stars | License | File claims |
| --- | --- | --- | --- |
| MCP Agent Mail (Python) | 2,235 | MIT + rider | Advisory, deprecated |
| MCP Agent Mail (Rust) | 248 | MIT + rider | Advisory, pre-commit guard |
| agent-comm | 10 | MIT | Blocks edits via a hook |
| coord / too-many-cooks | 5 | Apache-2.0 / MIT | Advisory |

[MCP Agent Mail](https://github.com/Dicklesworthstone/mcp_agent_mail_rust) was the clear winner on popularity. It gives agents identities, inboxes, threads and file reservations, with a git-backed archive. I picked it and went to install it.

### The license surprise

Before running an installer I always read the license. The badge says MIT. The first line of the file says this:

```text
MIT License (with OpenAI/Anthropic Rider)
```

The rider says "no rights are granted to any Restricted Party". That means OpenAI, Anthropic and "any person or entity acting directly or indirectly on behalf of, for the benefit of, or under the direction of" them. It defines "use" to include "executing, benchmarking, testing" and putting the software into any "pipeline for machine learning or other automated systems". And "any breach of this rider automatically and immediately terminates the permissions".

I'm not a lawyer, but two things are clear. A license that excludes specific users isn't open source by the OSI definition. And I was about to have Claude Code agents install it, run it and test it, which is very close to what the rider is written against. Not worth the risk for a coordination tool.

**Lesson: an MIT badge is not an MIT license.** Open the LICENSE file. GitHub even hinted at it, showing the license as "NOASSERTION" instead of MIT.

### agent-comm: the right design, too small

So I moved to [agent-comm](https://github.com/keshrath/agent-comm). It's plain MIT, a single Node process with SQLite, and it does the thing I care about most: a `PreToolUse` hook that grabs a lock before every Edit or Write and **blocks** the edit if someone else holds it.

I tested it by calling the hook as two fake agents on the same file. Agent A got the lock. Agent B was refused:

```text
BLOCKED: agent-comm file lock on README.md still held by "test-agent-A" after 10s of waiting.
The other agent may be stuck. Try again, coordinate via comm_send, or work on a different file.
```

That's exactly the behaviour I wanted. The problem was the number next to it: **10 stars**, one maintainer. I'd be betting every agent on my laptop on a project that might be abandoned next month.

## Round two: a wider search

So I went wider. The [awesome-agent-orchestrators](https://github.com/andyrewlee/awesome-agent-orchestrators) list turned out to be a great starting point. I pulled star counts for everything that looked relevant, and the results split into two very different groups.

### Group one: tools that connect sessions you start yourself

This is what I actually wanted. You open Claude Code and agy however you like, and the tool connects them.

| Project | Stars | License | Antigravity |
| --- | --- | --- | --- |
| [Concord MCP](https://github.com/Get-Concord-AI/concord-mcp) | 1,093 | MIT | Yes, own guide |
| [hcom](https://github.com/aannoo/hcom) | 656 | MIT | Yes, `hcom agy` |
| [agent-bridge](https://github.com/raysonmeng/agent-bridge) | 430 | MIT | No, Claude ↔ Codex |
| [Cotal](https://github.com/Cotal-AI/Cotal) | 389 | Apache-2.0 | Didn't check |

The two that stood out:

- **Concord** handles messaging *and* file claims, supports Antigravity directly, and stores everything in a local SQLite file with no account.
- **hcom** pushes messages into a session, even an idle one, but has no file locking at all.

### Group two: much bigger, but a different kind of tool

These have far more stars, but they solve a different problem:

| Project | Stars | What it is |
| --- | --- | --- |
| paperclip | 113k | Org chart and ticket board for agents |
| ruflo | 81k | Swarm harness that runs its own agents |
| herdr | 50k | Terminal multiplexer agents live inside |
| beads | 28.7k | Git-backed task memory for agents |
| vibe-kanban | 28.7k | Kanban board, one worktree per agent |
| gastown | 18.8k | Workspace manager with a "Mayor" agent |
| claude-squad | 8.8k | Parallel worktrees, agents don't talk |

Most of these either launch the agents themselves or put one **lead agent** in charge of the rest. I deliberately didn't want that. If one agent directs the others, prompt-injecting that one agent means you control all of them. A flat setup, where each agent decides for itself what to pick up, limits the damage.

Beads is the exception. It's task memory rather than messaging, so it could sit *next to* whatever you pick. I'm keeping it in mind.

## The pick: Concord

I went with **Concord**. It's MIT, it has about 100 times agent-comm's adoption, it supports Antigravity with its own setup guide, it can wake an idle session when a message arrives, and it's local-first. Agents get five tools:

- `start_work` claims a task and the files you expect to touch, and reports overlaps.
- `inspect_work` reads the workspace, a task, or your inbox.
- `update_work` records progress, or sends a live message to another agent.
- `transfer_work` hands work off, accepts it or releases it.
- `finish_work` records what changed and closes the task.

Setting it up wasn't as smooth as the README makes it look, so here's what I hit.

### Gotcha 1: it needs Node 22

The quick start is `npm install -g @concord-ai/concord-mcp` and then `concord setup`. On my default Node 20, `concord setup` printed nothing and exited with code **139**, which is a segfault. The package's `engines` field says `node >=22.12`, and its SQLite dependency needs 22 too. npm installs it anyway without complaint.

The fix is a tiny launcher script that always runs it on Node 22, no matter which Node version your shell has active. I put this in `~/.local/bin/concord-mcp` (and the same thing pointing at `dist/cli/index.js` as `~/.local/bin/concord`):

```sh
#!/bin/sh
# Concord needs Node >= 22.12. Telemetry off. One shared workspace.
export CONCORD_TELEMETRY_DISABLED=1 DO_NOT_TRACK=1 CONCORD_NO_UPDATE_CHECK=1
export CONCORD_REPO_ROOT="$HOME/agent-connect"
exec "$HOME/.nvm/versions/node/v22.22.0/bin/node" \
  "$HOME/.nvm/versions/node/v22.22.0/lib/node_modules/@concord-ai/concord-mcp/dist/index.js" "$@"
```

Point every config at the launcher by its full path. The Antigravity app opened from the Dock doesn't load your shell profile, so a bare `node` or `concord-mcp` might not be found.

### Gotcha 2: telemetry is on by default

Concord sends usage telemetry to its own servers unless you turn it off. The README is upfront about it and says code and message content are never sent, but I still don't want it. That's what the `CONCORD_TELEMETRY_DISABLED=1` line in the launcher is for.

### Gotcha 3: setup configures tools you don't have

`concord setup` writes config for every agent it supports, installed or not: Cursor, Copilot, Qwen, Gemini CLI, Grok, Devin and Codex. It even created a `~/.codex/config.toml` on a machine without Codex. I ran it with `--no-global --claude-hooks --no-auto-adapters`, then deleted the folders I didn't need. If you run setup again, it puts them back.

### Gotcha 4: one workspace per repo

By default Concord keeps one workspace per git repo. Agents only see each other if they're in the same repo. I found this out when my agy session, open in a different project, registered fine but couldn't see my Claude session at all.

That makes sense if all your agents work on one codebase. I wanted any session anywhere on the laptop to be able to message any other. That's what the `CONCORD_REPO_ROOT` line in the launcher does: every session, wherever it starts, joins one shared workspace. Then I registered the server for Claude Code across all projects:

```bash
claude mcp add concord --scope user -- ~/.local/bin/concord-mcp
```

Antigravity reads a global `~/.gemini/config/mcp_config.json`, which the Antigravity adapter in setup had already filled in. The trade-off of one shared workspace is that file claims from different repos end up in the same pool. So I use Concord mainly for messaging and handoffs.

## What actually works

I tested the claim side the same way as agent-comm. A fake agent claimed `README.md` with `start_work`, and `concord check` caught the second claim:

```text
Overlap: files you are about to edit collide with 1 active task(s):
  - TEST-1 (smoke test claim): same file(s): README.md
```

The messaging side works too. Each session gets an ID like `claude-code:486e6718` or `antigravity:921917e8`. You ask your agent in plain English ("send the Antigravity session a message saying I'm working on the auth module"), and it arrives in the other session without anyone checking an inbox.

To watch everything, run `concord dashboard` in a spare terminal. It's a live, read-only terminal view of who's online, their tasks and the activity. It won't start through Claude's `!` shell prefix, because it needs a real terminal. `concord who` and `concord messages` give you plain-text versions.

### What doesn't work (yet)

The hook that should **block** a conflicting edit doesn't, at least in version 0.22.0. Claude Code sends the hook the full file path, like `/Users/me/project/README.md`. Concord's hook only recognises repo-relative paths like `README.md`. With a full path it says nothing and lets the edit through. Even with a relative path, it only blocks if each session sets `CONCORD_TASK` to its own task ID, which isn't realistic in an interactive session.

So today, Concord's file claims are **advisory**. Agents are told to check before editing, and they mostly do, but nothing stops them. agent-comm's hook really did block. Concord's doesn't yet. I'm accepting that in exchange for a project that's 100 times better adopted, and a hook wrapper that turns full paths into relative ones is about ten lines if I need it.

## Which one should you pick?

Here's how I'd decide:

- **Claude Code and Antigravity (or Codex, Cursor and friends) on one laptop, wanting them to talk and hand off work:** Concord. Use the launcher above, turn off telemetry, and treat file claims as advisory.
- **You mostly need messages pushed into idle sessions:** have a look at hcom.
- **Hard edit blocking is non-negotiable:** agent-comm does it today. Just know you're depending on a very small project.
- **You want agents in separate sandboxes rather than talking:** claude-squad or vibe-kanban, using git worktrees.

And whatever you install, read the LICENSE file, not the badge.

Next time I'll put this to work and show two agents splitting a real feature between them through Concord, handoffs and all.

Happy Coding ;)
