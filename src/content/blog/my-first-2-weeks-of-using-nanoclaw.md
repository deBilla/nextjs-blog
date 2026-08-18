---
title: "My first 2 weeks of using Nanoclaw"
date: "2026-05-10"
preview: "Hi guys, this article will talk about my real experience of using Nanoclaw, a lighter alternative to OpenClaw."
description: "Two weeks with Nanoclaw, a lighter alternative to OpenClaw: what it does well, where it falls short, and why the smaller tool won."
tags: ["ai"]
mediumUrl: "https://medium.com/@billacode/my-first-2-weeks-of-using-nanoclaw-198e8c8fbd4e"
---
Hi guys, this article will talk about my real experience of using Nanoclaw, a lighter alternative to OpenClaw.

First things first — why not OpenClaw? The reason is that most of my development work is AI-assisted now, but never remote. I wouldn’t WhatsApp and ask Claude to do dev tasks or anything like that. I have this need of constantly checking the changed code and not trusting 100% of what the AI generates. So Nanoclaw was needed for a different set of requirements:

- Checking emails, calendar, Google Sheets/Slides/Docs
- Planning and actioning the day based on the above
- Having cool features like using WhatsApp voice notes for sending emails or any of the other actions
- Having my own stored information — gym schedule, nutrition goals, career goals, etc. — so every time I use an AI chatbot I don’t need to remind it who I am
- Creating JIRA tasks, reading Confluence pages for summaries, etc.

So the requirements were clear. I wasn’t going to use this to give complete control over my local machine, but as a tool to help with things I don’t usually like doing.

## Setup

The setup was really easy. Just head to the repo:

[GitHub — nanocoai/nanoclaw: A lightweight alternative to OpenClaw that runs in containers](https://github.com/nanocoai/nanoclaw)

The install guide is right there. And the best thing is that since this runs on the Claude Code SDK, you can use your Claude subscription instead of paying separately for API access. For any customization on Nanoclaw, you just ask Claude to do it. Instead of the multiple MD files OpenClaw uses, this uses a single Claude.md file to store most of the knowledge, so a Claude Code agent has good context about what it needs to change.

For the WhatsApp voice notes interaction, I built my own repo so users wouldn’t have to pay for another API. It can be hosted locally in the same setup:

[GitHub — deBilla/nanoclaw-voice: Voice support for NanoClaw — Whisper STT + Kokoro TTS](https://github.com/deBilla/nanoclaw-voice)

For the rest of the changes, I just asked Claude Code to do them based on the README provided by Nanoclaw.

## The user experience is mixed

Two weeks in, here’s the honest verdict.

**What works really well**

The morning routine is the killer feature for me. I send a single voice note on WhatsApp — “what’s my day looking like?” — and within a few seconds I get back a summary of my calendar, the three most important unread emails, and any JIRA tickets assigned to me overnight. That used to be a 15-minute context-switch every morning between four different tabs. Now it happens while I’m still making coffee.

The personal context file is the other big win. I dumped my gym split, macros, current career goals, and a few ongoing projects into the Claude.md, and the difference is night and day compared to a fresh ChatGPT or Claude conversation. When I ask “should I move my workout to tomorrow?”, it actually knows my split and that I have a client demo at 4pm. No more re-explaining myself.

Voice notes for email replies also work better than I expected. Whisper handles my accent fine, and Kokoro TTS reads back the draft so I can confirm before it sends. Roughly 80% of my replies go out without me ever opening Gmail.

**What doesn’t work so well**

The container setup is great for security but adds latency. There’s a noticeable lag between sending a WhatsApp message and getting a reply — usually 3–5 seconds, sometimes more if it needs to hit multiple Google APIs. Not a dealbreaker, but you feel it.

**Cost**

Running on my existing Claude subscription with self-hosted voice means I’m paying nothing extra beyond what I was already spending. That, more than anything else, is why I’ll keep using it.

## Verdict

Nanoclaw isn’t replacing my IDE or my development workflow — and that was never the point. It’s replacing the 30–40 minutes a day I used to spend on calendar Tetris, inbox triage, and admin work I resent. For that specific job, two weeks in, it’s earning its keep.

If you have similar needs — read access to your work tools, a personal context store, optional voice — and you’re already paying for Claude, it’s worth a weekend to set up. If you’re looking for full agentic coding or remote machine control, stick with OpenClaw.

I’ll write a follow-up after a couple more months to see whether the rough edges smooth out or whether I quietly stop using it. So far, signs point to the former.
