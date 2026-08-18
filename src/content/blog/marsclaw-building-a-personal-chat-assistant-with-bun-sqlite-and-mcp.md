---
title: "marsClaw — Building a personal chat assistant with Bun, SQLite and MCP"
date: "2026-08-18"
preview: "Hey Guys, for the past few months I have been building a small thing called marsClaw. It is a personal assistant which lives inside a chat app…"
description: "How marsClaw was built: one Bun process gluing Telegram, Slack and WhatsApp to an agent SDK, with SQLite, an outbox, MCP tools and two runtimes."
tags: ["ai", "claude-code", "nodejs"]
---
Hey Guys, for the past few months I have been building a small thing called marsClaw. It is a personal assistant which lives inside a chat app. You send a message in Telegram (or Slack, or WhatsApp), and on the other side there is an LLM agent with tools — it can read your Gmail, check your calendar, download a reel you sent, remember things about you, and reply back. The code is here if you want to follow along, [https://github.com/deBilla/marsClaw](https://github.com/deBilla/marsClaw), and the docs are at [https://deBilla.github.io/marsClaw](https://deBilla.github.io/marsClaw/).

In this tutorial I want to walk through how it is built and, more importantly, why it is built this way. The whole thing is around 11,000 lines of TypeScript, which is much less than people expect when they hear the word "agent".

The tech stack for this project is,

Runtime : Bun

Language : TypeScript

Database : SQLite (bun:sqlite)

Agent : Claude Agent SDK or Gemini CLI core

Tools : MCP (Model Context Protocol)

Channels : Telegram, Slack (Socket Mode), WhatsApp (Baileys)

Now the first and the biggest decision. When you start building an agent, the temptation is to write the agent loop yourself. Call the model, parse the tool calls, execute the tools, feed the results back, loop until done, handle context compaction, handle retries, handle rate limits. I did not write any of that. All of it is delegated to the agent SDK, and what we own is only the chat-side glue — the channel adapters, the database, the MCP tools and about five files of context engineering.

The reason is simple. When Anthropic or Google ships a better model or a better tool-use loop, we get it for free without changing a line. The tradeoff is that we are coupled to two specific SDK shapes, and for a personal project I think that is a very fair trade. If you look at the dependency list there are only nine runtime dependencies, and three of them are just channel clients.

So the message flow is like this. A channel adapter receives a message and calls one function.

```ts
export async function handleMessage(
  db: Database,
  channel: Channel,
  threadId: string,
  userText: string,
): Promise<void> {
```

That is the whole entry point. It appends the message to SQLite, builds a small per-turn context, runs the provider, then trims the reply and sends it back through the channel. The per-turn context is a tiny thing but it matters a lot — it injects the current local time, the timezone and the location into every single turn. Without it the agent has no idea what "tomorrow" or "this evening" means, because a model has no clock. We build it fresh on every message and we do **not** store it in the message history, so the history stays raw and only what goes to the provider is decorated.

Every channel writes thread IDs with its own prefix, like `telegram:123456789` or `whatsapp:94701234567@s.whatsapp.net`, and a router uses that prefix to send the reply back to the correct adapter. This one convention removes a whole table. There is no "which channel does this conversation belong to" lookup anywhere in the codebase — the answer is in the string.

One dispatcher serializes per thread, so two fast messages from the same chat never trigger two agent calls in parallel. This is not a performance thing, it is a correctness thing. If you send "check my calendar" and then immediately "actually make it 5pm", two parallel turns will both read the old state and one of them will win randomly.

Now let's talk about sessions, because this is where the first real engineering problem showed up. The Claude SDK gives you a long-lived `query()` which keeps the conversation context alive, and that is much better than replaying the full history on every message. So we keep one session per thread. But a session holds memory and a subprocess, and a bot that runs for weeks will accumulate them until the box falls over. So sessions live in an LRU map with three limits on top.

```ts
const IDLE_MS = config.idle_ms;                      // 15 min default
const MAX_SESSION_AGE_MS = config.max_session_age_ms; // 4 hours default
const MAX_SESSIONS = config.max_sessions;             // 20 default
```

Idle timeout kills a session that has not been used for fifteen minutes. The max age is a hard ceiling regardless of activity — it exists because a chatty thread that never goes idle will otherwise live forever, and slow leaks in the SDK subprocess or any third-party dependency will never get cleaned up. And the LRU cap evicts the least recently used session when a twenty-first thread arrives. When a session is evicted we don't lose the conversation, because the provider's session id is stored in a `sessions` table and the next message resumes from it.

Then there is provider failover. Claude and Gemini both sit behind the same call in `agent.ts`, and the Claude path throws a typed `ClaudeHardError` for quota and auth failures specifically. So the catch block can tell the difference between "this model is unavailable right now" and "this turn had a bug".

```ts
try {
  response = await runClaude();
} catch (err) {
  if (err instanceof ClaudeHardError && PROVIDERS.gemini.isAuthed()) {
    response = await runGemini(db, threadId, userText, context);
  } else if (err instanceof ClaudeHardError) {
    response = err.friendly;
  } else {
    throw err;
  }
}
```

If Claude is out of quota and Gemini is logged in, the user still gets an answer and never sees an error. If Gemini is not available, they get a plain sentence telling them what happened instead of a stack trace. This is the kind of thing you only care about when the bot is used by an actual human who is not you.

Now here is the part I like the most. The agent's reply is just **whatever it prints to stdout**. That is the entire contract, and it means the persona file can say "whatever you print is sent verbatim to the user" and the agent immediately understands the medium it is in.

But an agent often needs to send more than one message — a quick "on it, give me a sec" before a long task, or a file, or a voice note. For that we cannot use the return value, because the turn hasn't finished yet. So there is a table called `outbox` in SQLite. The agent's tools insert rows into it, and a small drain loop picks up undelivered rows every 250ms and sends them through the router.

The outbox row carries a text, an optional `audio_path`, an optional `file_path` and a `file_name` override, plus `attempts`, `delivered_at`, `failed_at` and `last_error`. Because every asynchronous message in the system goes through this one table, retry counting, permanent-failure marking and delivery logging are written once instead of once per channel. Adding a fourth channel later means implementing a `send()` — nothing else.

How does the agent get these tools? Through MCP. We run our own MCP server exposing the channel tools like `send_message`, `send_file`, `speak`, `download_video`, plus the Google tools for Gmail, Calendar, Drive, Sheets, Docs and Slides. Registering a tool is just adding it to a list.

```ts
export const tools = [
  sendTool,
  sendFileTool,
  speakTool,
  gmailSearchTool,
  calendarListEventsTool,
  youtubeTranscriptTool,
  downloadVideoTool,
];
```

There is a small trick in there worth explaining. An MCP tool like `send_message` has to know **which chat** to send to, but the tool arguments come from the model, and we absolutely do not want the model choosing a destination thread. So the thread id never travels through the model. The SDK spawns one MCP child process per thread with `MARSCLAW_THREAD_ID` in its environment, and the tool reads it from there. The model can ask to send a message; it cannot ask to send it to somebody else.

The persona is not code either. It is a markdown file called `CLAUDE.md` at the project root which tells the agent who it is and how to behave — be brief, chat is a high-cost-of-attention medium, talk about outcomes and not about which tools you ran, don't preface a fast task with "working on it". Then there is a `MEMORY.md` file, which is the agent's own long-term notebook. When you tell it something about yourself it appends it there, and it reads it back before doing anything non-trivial. This sounds too simple to work, but a markdown file that the agent both reads and writes turns out to be a very good memory system for a single user, and you can open it and edit it yourself when it remembers something wrong.

Voice works the same way, through two local sidecars. Incoming WhatsApp voice notes are transcribed by a faster-whisper server on `127.0.0.1:9000`, and outgoing speech is generated by kokoro-onnx. Both run locally, so your voice notes never leave the machine. The `speak` tool has one funny convention attached to it — when the agent speaks, it is told to print an **empty** stdout reply, so the default text path sends nothing and the user gets only the voice note instead of hearing and reading the same sentence.

Let me show one feature end to end, because this is where the real world gets messy. I wanted to send an Instagram reel link and get the video back in the chat. The tool shells out to yt-dlp, gets the file, and hands it to `send_file`. Easy, and it worked — except the video arrived in WhatsApp as a still frame that would not play, with no error at all.

The reason is that chat clients decode H.264 video and AAC audio only, and Instagram was serving VP9 inside a perfectly valid .mp4 file. So we force codec compatibility ahead of bitrate at download time.

```ts
args.push('-S', 'vcodec:h264,acodec:aac');
```

And there was a second trap right after that. The height filter must be written as `height<=?720` and not `height<=720`. That little question mark tells yt-dlp to **keep** formats whose height is unknown, and Instagram reports no resolution on exactly its progressive H.264 renditions. Without the `?` we were dropping every playable format and keeping only the broken ones. Two characters, one afternoon.

Then there is the size problem. Telegram's Bot API refuses uploads over 50MB, so that is the ceiling for an attachment. Instead of refusing a big file, the tool escalates — anything larger is uploaded to your Google Drive and the tool returns a link for the agent to paste into the reply. And because uploading to Drive is a **mutating** call, it goes through the same permission gate as sending an email, so a hijacked turn cannot quietly push your local files into your cloud.

That brings me to security, which is where a personal agent is genuinely different from a normal app. The agent reads text written by other people — emails, web pages, captions — so you have to assume that one day it will read something malicious. You cannot prevent prompt injection, so the goal is to shrink the blast radius.

Every meaningful capability is off by default. No shell, no web fetching, no outbound or mutating Google calls until you explicitly enable them. There is a permission callback on every single tool call which enforces the allowed paths, and a separate sensitive-path guard which blocks `.env`, the config and the provider credential stores regardless of what the allowed paths say. Every decision, allow or deny, is appended to an audit log. On a fresh install the worst a successful injection can do is make the bot say something wrong to you.

There is also a much more boring attack to worry about — the billing one. Every inbound message runs a paid turn, so anyone who knows your bot's handle can empty your account by spamming it. So there is a per-sender token bucket in front of the agent, ten messages per minute and sixty per hour by default, both of which must clear. On the other side, every completed turn records its real cost from the SDK result (`total_cost_usd`, straight from the API — no estimation), so `bun run usage` can tell you what today cost and which thread caused it.

If you want the opposite trade from all these gates, there is a second runtime. Set `runtime: container` and everything to the left of `handleMessage` stays identical — channels, serialization, SQLite, the outbox — but the host becomes a broker that ships each turn over `POST /turn` into an isolated container. Inside the box the agent gets full shell and raw web, because the box is now the boundary instead of the policy. The container never mounts `.env` or the database. The real Anthropic credential lives in a host-side proxy on port 8765 which the container talks to via `ANTHROPIC_BASE_URL`, the MCP server is reached over HTTP on 8766 at a per-thread path with a bearer token, and web egress goes through an SSRF-filtering gateway on 8775 which refuses to connect to loopback, private ranges or the cloud metadata address.

A few smaller things that made life easier. Migrations live in a `migrations/` folder and run on every boot, so there is no "did you run the migration" step ever. The config is a `data/config.json` file with an environment-variable overlay on top, read once at startup. And `bash setup.sh` walks from a fresh clone to a running bot in about two minutes, including the provider login and the WhatsApp QR pairing, because a personal tool that takes an afternoon to install is a personal tool you will not install.

That is the overall picture. The repo is at [https://github.com/deBilla/marsClaw](https://github.com/deBilla/marsClaw) if you want to read the actual code — `src/agent.ts` and `src/mcp/` are the two places I would start.

In the next tutorial I want to go deeper into the evaluation side of this, which is a genuinely hard problem — how do you test an agent when the same input can produce three different replies, when the assertions you care about are "did it call the right tool" rather than "did it return the right value", and when every single test run costs money. Till then, Happy Coding Guys !!! 😎
