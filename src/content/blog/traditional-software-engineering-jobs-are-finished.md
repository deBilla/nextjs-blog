---
title: "Traditional software engineering jobs are FINISHED!!!!"
date: "2026-02-28"
readTime: "4 min"
preview: "For the first time after long resisting letting AI agents do full changes to a codebase, this weekend I did a project using Claude Code and didn't write a single line of code."
mediumUrl: "https://billacode.medium.com/traditional-software-engineering-jobs-are-finished-c646c9641895"
---

For the first time after long resisting letting AI agents do full changes to a codebase, this weekend I did a project using Claude Code and didn't write a single line of code.

A project like this with unit tests, integration tests, proper CI/CD pipelines and everything would have taken me at least 3–4 days. I did it in under 12 hours.

If you want to ship something quickly without exhausting all your tokens, this guide might help.

## The Key: System Design as Your Superpower

At least for now, even the best LLM models need a lot of guidance when it comes to producing a clean, production-grade product. Before starting the project, you should be clear about:

- **High Level System Design (HLD)** — what the application does: stakeholders, core entities, scalability, infrastructure, boundaries.
- **Low Level Design (LLD)** — code-level structure: design patterns, module boundaries, OOP principles, error handling, testing strategy.

## Step 1: High Level Design

**Functional Requirements**
- CRUD for media metadata
- Trigger transcoding (using AWS MediaConvert)
- Update metadata with transcoded resource URLs

**Non-Functional Requirements**
- Eventually consistent, highly available
- Should handle ~1K RPS
- Idempotent operations for job triggering
- Observability (metrics + logs)

**API Design**
```
POST   /media-items
GET    /media-items
GET    /media-items/{id}
PUT    /media-items/{id}
DELETE /media-items/{id}

POST   /transcode-jobs
GET    /transcode-jobs/{jobId}
```

## Step 2: High Level Architecture

Instead of asking the AI to "build the project", I first gave it an architecture blueprint with clear service boundaries: API Service → Message Queue → Worker Service → AWS MediaConvert.

When you define clear service boundaries, AI follows them.

## Step 3: Low Level Design

**Tech Stack**
- Node.js + TypeScript, Express, PostgreSQL, Prisma ORM
- Jest (unit tests), Supertest (integration tests)
- Docker, GitHub Actions CI

**Architectural Pattern**
- Clean Architecture: Controller → Service → Repository
- Dependency injection, DTO validation layer
- Centralized error handling, structured logging

## Step 4: Test-First Prompting

This was a game changer. Instead of "Build media controller", I did:

1. "Write integration tests for media endpoints based on the API contract."
2. "Now implement controller logic to satisfy these tests."
3. "Now implement service layer."
4. "Now implement repository layer."

By forcing AI to satisfy tests, it behaved like a disciplined junior engineer.

## The Brutal Truth

Traditional "code monkey" software engineering is dying. But system design skill is becoming 10x more valuable.

If you know how to design scalable systems, define clear contracts, think in failure scenarios, and write precise technical specs — you're not being replaced. You're being upgraded.

**The new role of a software engineer:**
- System designer
- AI conductor
- Quality gatekeeper
- Architecture decision maker

AI writes syntax. You own thinking.

## Final Thought

Jobs are not finished. Low-skill implementation-only roles are shrinking. High-leverage system thinkers are becoming unstoppable. The future isn't AI replacing engineers — it's engineers who use AI replacing engineers who don't.

The bottleneck is no longer writing code. It's thinking clearly.

---

*[Read the full article on Medium](https://billacode.medium.com/traditional-software-engineering-jobs-are-finished-c646c9641895)*
