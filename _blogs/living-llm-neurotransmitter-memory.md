---
title: "What If Your LLM Could Remember You? Building a Neurotransmitter-Inspired Memory System for Local Language Models"
date: "2026-03-19"
readTime: "15 min"
preview: "How I drew on neuroscience to give a locally-running Llama 3.1 persistent memory, a personal knowledge graph, and the ability to learn from its own conversations."
---

*How I drew on neuroscience to give a locally-running Llama 3.1 persistent memory, a personal knowledge graph, and the ability to learn from its own conversations — with Claude Opus 4.6 as my coding collaborator.*

Every time you close ChatGPT, it forgets you. Your name, your preferences, the fact that you told it three times you're allergic to shellfish — gone. The conversation is just a context window, and when it ends, so does everything the model "knew" about you.

I wanted to build something different: a locally-running language model that genuinely remembers. Not through a simple database lookup, but through a system inspired by how the human brain actually forms, strengthens, and suppresses memories.

This is the story of **Living LLM** and the library that powers it — **limbiq**. I built it with **Claude Opus 4.6** as my collaborator — not just for code generation, but as an architectural thinking partner throughout the design process. The ideas are mine; the velocity of turning those ideas into working code was very much a human-AI partnership.

---

## The Problem with "Just Add a Database"

The naive approach to LLM memory is straightforward: store every conversation in a vector database, retrieve relevant chunks before each response, inject them into the context window. It works. Sort of.

But it doesn't feel like memory. It feels like reading notes someone else wrote. The model doesn't distinguish between a casual remark and a deeply personal disclosure. It doesn't know that when you said "actually, my name is Alex, not Alexander" three messages ago, the old information should be *suppressed*, not just co-exist alongside the correction. It doesn't notice that you've asked about machine learning in twelve consecutive sessions and should probably start clustering that domain knowledge.

I needed something more principled. So I looked at how the brain does it.

## Five Signals: A Neurotransmitter Model for Memory

In the human brain, memory isn't a filing cabinet — it's a dynamic system where neurochemical signals determine what gets stored, what gets strengthened, what gets suppressed, and what fades entirely. I modeled five of these signals in software.

**Dopamine — "This matters, remember it."** In neuroscience, dopamine signals reward and salience. In limbiq, it fires when the user shares personal information, provides a correction, or gives positive feedback. A dopamine-tagged memory becomes *priority* — it's always included in the model's context, regardless of embedding similarity scores.

**GABA — "Suppress this, let it fade."** GABA is the brain's primary inhibitory neurotransmitter. In limbiq, it fires on contradictions, denials, and stale information. When a user corrects a fact, GABA suppresses the old memory while dopamine tags the new one. The suppression is soft and reversible.

**Serotonin — "This is a behavioral pattern."** Serotonin detects repeated user preferences and crystallizes them into behavioral rules. If a user consistently asks for concise responses, serotonin fires and creates a rule that shapes future responses.

**Acetylcholine — "Focus on this domain."** When a user sustains discussion on a particular topic across multiple sessions, acetylcholine clusters related memories together for domain-specific recall.

**Norepinephrine — "Topic shifted, be careful."** When limbiq detects an abrupt topic change, norepinephrine fires, widening the retrieval window and adding caution flags.

## The Three-Method API

Despite the sophistication underneath, limbiq exposes a remarkably simple interface:

```python
from limbiq import Limbiq

lq = Limbiq(
    store_path="data/limbiq",
    user_id="default",
    embedding_model="all-MiniLM-L6-v2",
    llm_fn=my_compress_function,
)

# Before generating a response
result = lq.process(message=user_input, conversation_history=recent_messages)

# After generating a response
lq.observe(message=user_input, response=assistant_response)

# When the session ends
lq.end_session()
```

That's it. `process → LLM → observe`. The engine handles signals, embeddings, graph inference, and memory tiers internally.

## Memory Tiers: From Conversation to Knowledge

**SHORT tier** stores raw conversation turns — episodic memory. These are aged each session and suppressed via GABA after a few sessions without access.

**MID tier** contains atomic facts compressed from conversations. When a session ends, limbiq uses the LLM to extract self-contained, searchable facts from the raw exchanges.

**PRIORITY tier** holds dopamine-tagged facts that bypass retrieval scoring entirely — always injected into context.

## The Knowledge Graph: Structured Understanding

Limbiq builds a personal knowledge graph from conversations — entities connected by labeled relationships. A deterministic inference engine computes implied relationships without calling the LLM:

```
User shares: "My father is John" → User --[father]--> John
User shares: "My wife is Sarah"  → User --[wife]--> Sarah

Limbiq infers: John --[father_in_law_of]--> Sarah
```

This matters for token efficiency: instead of injecting five raw memory strings (~200 tokens), the graph produces a compact world summary in ~40 tokens.

## Making Small Models Pay Attention

Here's a practical lesson I learned the hard way: 8B-parameter models often ignore system prompts. The fix was injecting memory context directly into the user message:

```python
user_msg = (
    "Here is what you remember about me from past conversations "
    "(use this naturally, do NOT mention section names or tags). "
    f"{result.context}\n\n"
    f"Now answer this: {user_input}"
)
```

Small models pay far more attention to user turns than to system content buried early in the context window.

## LoRA Neuroplasticity: From Memory to Learning

Living LLM includes a LoRA training pipeline that runs on Apple Silicon via MLX. The training data pipeline has an elegant property: it only learns from conversations that survived the compression pipeline. GABA-suppressed exchanges are excluded. Dopamine-tagged interactions are prioritized.

Each conversation is formatted in the Llama 3.1 chat template and saved as JSONL — including the system prompt with whatever memory context was active. The model learns to respond *using memory context naturally*.

## What I Learned

**Signals are more than metadata.** When signals influence training data curation, the quality gap becomes significant. The neurochemical metaphor creates a coherent pipeline from "this matters" to "learn from this."

**Memory location matters more than memory content.** The same memory context, injected in the system prompt versus the user message, produces dramatically different behavior in small models.

**Consolidation is where learning happens.** The `end_session()` call — which compresses, extracts, infers, and prunes — is the LLM equivalent of sleep consolidation in the brain.

**Soft suppression beats hard deletion.** Hiding from retrieval but keeping in storage mirrors the brain's approach and proved far more robust.

---

*Living LLM is open-source and runs entirely on Apple Silicon. Check out the [Living LLM repository](https://github.com/deBilla/living-llm) and the [limbiq library](https://github.com/deBilla/limbiq) on GitHub and [PyPI](https://pypi.org/project/limbiq/0.1.0/).*
