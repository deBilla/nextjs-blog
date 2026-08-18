---
title: "What If Your LLM Could Remember You? Building a Neurotransmitter-Inspired Memory System for Local Language Models"
date: "2026-03-19"
preview: "How I drew on neuroscience to give a locally-running Llama 3.1 persistent memory, a personal knowledge graph, and the ability to learn from its own conversations."
description: "Giving a locally-run Llama 3.1 persistent memory using a neurotransmitter-inspired model: five signals, memory tiers, and a personal knowledge graph."
mediumUrl: "https://medium.com/@billacode/what-if-your-llm-could-remember-you-be948127800a"
---

_How I drew on neuroscience to give a locally-running Llama 3.1 persistent memory, a personal knowledge graph, and the ability to learn from its own conversations — with Claude Opus 4.6 as my coding collaborator._

Every time you close ChatGPT, it forgets you. Your name, your preferences, the fact that you told it three times you’re allergic to shellfish — gone. The conversation is just a context window, and when it ends, so does everything the model “knew” about you.

I wanted to build something different: a locally-running language model that genuinely remembers. Not through a simple database lookup, but through a system inspired by how the human brain actually forms, strengthens, and suppresses memories.

This is the story of **Living LLM** and the library that powers it — **limbiq**. I built it with **Claude Opus 4.6** as my collaborator — not just for code generation, but as an architectural thinking partner throughout the design process. Nothing fancy just focusing on first principles designed this.

## The Problem with “Just Add a Database”

The naive approach to LLM memory is straightforward: store every conversation in a vector database, retrieve relevant chunks before each response, inject them into the context window. It works. Sort of.

But it doesn’t feel like memory. It feels like reading notes someone else wrote. The model doesn’t distinguish between a casual remark and a deeply personal disclosure. It doesn’t know that when you said “actually, my name is Alex, not Alexander” three messages ago, the old information should be _suppressed_, not just co-exist alongside the correction. It doesn’t notice that you’ve asked about machine learning in twelve consecutive sessions and should probably start clustering that domain knowledge.

I needed something more principled. So I looked at how the brain does it.

## Five Signals: A Neurotransmitter Model for Memory

In the human brain, memory isn’t a filing cabinet — it’s a dynamic system where neurochemical signals determine what gets stored, what gets strengthened, what gets suppressed, and what fades entirely. I modeled five of these signals in software.

**Dopamine — “This matters, remember it.”** In neuroscience, dopamine signals reward and salience. In limbiq, it fires when the user shares personal information, provides a correction, or gives positive feedback. A dopamine-tagged memory becomes _priority_ — it’s always included in the model’s context, regardless of embedding similarity scores. When a user says “My wife’s name is Sarah,” that’s not just another fact. It’s a signal that this person is investing trust, and the system should never forget it.

**GABA — “Suppress this, let it fade.”** GABA is the brain’s primary inhibitory neurotransmitter. In limbiq, it fires on contradictions, denials, and stale information. When a user corrects a fact — “I actually left that job last year” — GABA suppresses the old memory while dopamine tags the new one. The suppression is soft and reversible; the old memory isn’t deleted, just excluded from retrieval. This mirrors how human memories aren’t truly “erased” — they become harder to access.

**Serotonin — “This is a behavioral pattern.”** Serotonin modulates mood, social behavior, and long-term behavioral regulation. In limbiq, it detects repeated user preferences and crystallizes them into behavioral rules. If a user consistently asks for concise responses, or always prefers code examples over prose explanations, serotonin fires and creates a rule that shapes future responses — without the user having to explicitly say “be concise” every session.

**Acetylcholine — “Focus on this domain.”** Acetylcholine is associated with attention, learning, and memory consolidation in specific domains. When a user sustains discussion on a particular topic across multiple sessions — say, Kubernetes deployments or Renaissance art — acetylcholine clusters related memories together. This allows deep, domain-specific recall without flooding the context with unrelated facts.

**Norepinephrine — “Topic shifted, be careful.”** Norepinephrine governs alertness and the response to novelty. When limbiq detects an abrupt topic change — you were discussing your vacation plans and suddenly ask about quantum computing — norepinephrine fires, widening the retrieval window and adding caution flags. This prevents the model from confidently applying old context to a new domain.

The five signals work together. A correction triggers both dopamine (on the new fact) and GABA (on the old one). A sustained interest triggers both acetylcholine (cluster the knowledge) and serotonin (note the behavioral pattern). A topic shift triggers norepinephrine alongside adjusted retrieval.

## The Three-Method API

Despite the sophistication underneath, limbiq exposes a remarkably simple interface. The entire integration surface is three methods:

```
from limbiq import Limbiq
```

```
lq = Limbiq(
    store_path="data/limbiq",
    user_id="default",
    embedding_model="all-MiniLM-L6-v2",
    llm_fn=my_compress_function,  # any fn(str) -> str
)
```

```
# 1. Before generating a response: ask limbiq for context
result = lq.process(
    message=user_input,
    conversation_history=recent_messages,
)
# result.context contains enriched memory to inject into the prompt
# result.signals_fired tells you what neurochemical events occurred
```

```
# 2. After generating a response: tell limbiq what happened
lq.observe(message=user_input, response=assistant_response)
```

```
# 3. When the session ends: consolidate
lq.end_session()
# Compresses conversations into atomic facts
# Runs knowledge graph inference
# Suppresses stale memories
# Deletes old suppressed memories
```

That’s it. `process → LLM → observe`. The engine doesn't need to know about signals, embeddings, graph inference, or memory tiers. Limbiq handles all of it internally.

## Memory Tiers: From Conversation to Knowledge

Not all memories are equal, and they shouldn’t be stored the same way. Limbiq uses three tiers that mirror the brain’s progression from episodic to semantic memory.

**SHORT tier** stores raw conversation turns — the episodic memory of “what just happened.” These are aged each session. After a few sessions without being accessed, they’re suppressed via GABA. This is the equivalent of how you forget the details of a specific conversation but retain the gist.

**MID tier** contains atomic facts compressed from conversations. When a session ends, limbiq uses the LLM to extract self-contained, searchable facts from the raw exchanges. “The user’s father is John” is a MID fact. It’s independently useful and can be matched by embedding search without needing the surrounding conversational context. This is semantic memory — knowledge stripped from its episodic origin.

**PRIORITY tier** holds dopamine-tagged facts — things the system has been explicitly or implicitly told are important. These bypass retrieval scoring entirely; they’re always injected into context. This mirrors how certain emotionally significant memories in the human brain are readily accessible regardless of current context.

The compression pipeline acts as a natural quality filter. Only conversations deemed worth remembering (by the signal system) produce MID-tier facts. And only those facts are later eligible for LoRA fine-tuning — creating a direct pipeline from “this mattered” to “learn from this.”

## The Knowledge Graph: Structured Understanding

Vector similarity is powerful but limited. When a user mentions “my father,” embedding search might return memories about fathers in general, or other people’s fathers, alongside the relevant one. Structured relationships require structured storage.

Limbiq builds a personal knowledge graph from conversations — entities (people, places, companies) connected by labeled relationships (father, wife, works_at). More interestingly, a deterministic inference engine computes implied relationships without ever calling the LLM:

```sql
User shares over several conversations:
  "My father is John"       →  User --[father]--> John
  "My wife is Sarah"        →  User --[wife]--> Sarah
```

```
Limbiq infers automatically:
  John --[father_in_law_of]--> Sarah
```

This matters for two reasons. First, token efficiency: instead of injecting five raw memory strings (perhaps 200 tokens), the graph produces a compact world summary in roughly 40 tokens — “Your father is John. Your wife is Sarah. You work at Acme Corp.” Second, graph queries like “Who is John to my wife?” are answered deterministically — zero LLM cost, instant response.

## Making Small Models Pay Attention

Here’s a practical lesson I learned the hard way: 8B-parameter models often ignore system prompts. You can inject beautifully structured memory context into the system message, and the model will cheerfully say “I don’t have any information about your previous conversations.”

The fix was architectural. Instead of relying on the system prompt alone, I inject memory context directly into the user message:

```
user_msg = (
    "Here is what you remember about me from past conversations "
    "(use this naturally, do NOT mention section names or tags). "
    "Answer using ONLY this memory — do NOT search the web:\n\n"
    f"{result.context}\n\n"
    f"Now answer this: {user_input}"
)
```

Small models pay far more attention to user turns than to system content buried early in the context window. This single design decision — injecting memory into the user message rather than the system prompt — was the difference between a model that consistently uses its memories and one that randomly ignores them.

## LoRA Neuroplasticity: From Memory to Learning

Context injection gives the model _information_. Fine-tuning gives it _capability_. The difference is the same as reading your notes before an exam versus actually understanding the material.

Living LLM includes a LoRA (Low-Rank Adaptation) training pipeline that runs on Apple Silicon via MLX. After enough conversations have been compressed and stored (the default threshold is three), the system can train a lightweight adapter on top of the base model.

The training data pipeline has an elegant property: it only learns from conversations that survived the compression pipeline. If limbiq’s signal system deemed an exchange worth compressing into facts, the interaction pattern is worth reinforcing through fine-tuning. GABA-suppressed exchanges are excluded. Dopamine-tagged interactions are prioritized. The neurochemical signals don’t just manage memory retrieval — they curate the training set.

```
# Only compressed (signal-approved) conversations become training data
rows = conn.execute(
    "SELECT id, messages FROM conversations WHERE compressed = 1"
).fetchall()
```

Each conversation is decomposed into individual turn pairs, formatted in the Llama 3.1 chat template (the exact format the model was instruction-tuned on), and saved as JSONL. Crucially, the system prompt — which contains whatever memory context was active during that conversation — is included in the training examples. This means the adapter doesn’t just learn to respond; it learns to respond _using memory context naturally_.

The training itself runs as a background process. The user can keep chatting while the model learns. When training completes, the new adapter is loaded on the next message — the model has literally changed its weights between turns.

An adapter manager handles versioning and rollback. The last five adapters are kept, and if the newest one degrades quality (which can happen with small or off-topic training data), the system can revert to a previous checkpoint. There’s also a built-in comparison tool that runs the same prompt through both the base and adapted models, letting you directly observe what the fine-tuning changed.

## The Full Architecture

Everything runs locally on a single Apple Silicon machine. One MLX model instance serves all purposes — primary generation, LoRA adapter inference, limbiq’s compression calls, and activation steering. No cloud dependencies, no API keys for the core functionality.

```sql
User message
    │
    ▼
lq.process()  ─── Signals fire, graph queries, memory context built
    │
    ▼
Prompt construction ─── Memory injected into user message
    │
    ├── (memory sufficient?) ──→ Direct generation
    │
    └── (need more info?) ──→ ReAct tool loop (web search, python, etc.)
    │
    ▼
lq.observe()  ─── Background: store exchange, extract web facts
    │
    ▼
Session end → lq.end_session()
    │
    ├── Compress conversations into atomic facts
    ├── Extract entities into knowledge graph
    ├── Run graph inference
    ├── Suppress stale memories (GABA)
    ├── Delete old suppressed memories
    └── (enough data?) → LoRA training in background
```

The web search integration deserves a note. When limbiq returns low-confidence results (few memories retrieved, no priority matches), a web augmenter triggers a search. Facts extracted from search results are stored through limbiq’s dopamine signal with a `[Web]` prefix, so they become part of the persistent memory. The model learns from the web and remembers what it found.

## What I Learned

**Signals are more than metadata.** The initial temptation was to treat dopamine/GABA as simple tags. But when I let signals influence _training data curation_, the quality gap became significant. The neurochemical metaphor isn’t just an API nicety — it creates a coherent pipeline from “this matters” to “learn from this.”

**Memory location matters more than memory content.** The same memory context, injected in the system prompt versus the user message, produces dramatically different behavior in small models. Where you put information is as important as what information you put.

**Consolidation is where learning happens.** The `end_session()` call — which compresses, extracts, infers, and prunes — is where the system does its most important work. It's the LLM equivalent of sleep consolidation in the brain, and skipping it means the memory system gradually silts up with unprocessed episodic fragments.

**Soft suppression beats hard deletion.** When I first built the system, GABA-suppressed memories were immediately deleted. This caused problems when users corrected corrections, or when context shifted back to a previously-suppressed topic. Soft suppression — hiding from retrieval but keeping in storage — mirrors the brain’s approach and proved far more robust.

## What’s Next

The system works. A locally-running 8B model that remembers your name, your family, your preferences, and your ongoing projects across sessions — and gradually gets better at understanding you through LoRA adaptation.

But I’m honest about the limitation: even with signals and fine-tuning, this is still fundamentally _retrieval plus adaptation_. The model reads its memories, it doesn’t truly “know” them the way a human knows their own name. The gap between context injection and genuine understanding remains. Closing it — moving from “reading notes before the exam” to “having internalized the material” — is the next frontier.

I think the path forward lies in two directions: structured skill learning through explicit pass/fail feedback loops (not just conversation, but task attempt → outcome → weight update), and knowledge internalization through pattern extraction from external resources (not just storing web facts, but distilling them into schema-level understanding). The neurotransmitter metaphor still has room to grow.

_Living LLM is open-source and runs entirely on Apple Silicon. The limbiq library is available on _[_GitHub_](https://github.com/deBilla/limbiq)_. The entire project — from architecture design to implementation — was built in collaboration with Claude Opus 4.6 (Anthropic). If you’re interested in building local AI systems that learn and adapt, I’d love your contributions and feedback._
