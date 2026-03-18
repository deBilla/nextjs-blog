import React from "react";
import Head from "next/head";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import data from "../../data/portfolio.json";

const LivingLLMArticle: React.FC = () => {
  return (
    <>
      <Head>
        <title>
          What If Your LLM Could Remember You? — {data.name}
        </title>
        <meta
          name="description"
          content="How I drew on neuroscience to give a locally-running Llama 3.1 persistent memory, a personal knowledge graph, and the ability to learn from its own conversations."
        />
      </Head>

      <div className="bg-glow" />
      <div className="bg-glow-2" />

      <div className="relative z-10">
        <Navbar />

        <article className="max-w-3xl mx-auto px-6 pt-28 pb-20">
          {/* Back link */}
          <Link
            href="/blogs"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-400 transition-colors mb-8"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to blogs
          </Link>

          {/* Header */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {["AI", "LLM", "Neuroscience", "Python", "Open Source"].map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold leading-tight tracking-tight">
            What If Your LLM Could Remember You? Building a Neurotransmitter-Inspired Memory System for Local Language Models
          </h1>

          <p className="mt-4 text-base md:text-lg text-gray-400 dark:text-gray-400 leading-relaxed italic">
            How I drew on neuroscience to give a locally-running Llama 3.1 persistent memory, a personal knowledge graph, and the ability to learn from its own conversations — with Claude Opus 4.6 as my coding collaborator.
          </p>

          <div className="mt-4 flex items-center gap-3 text-xs font-mono text-gray-400 dark:text-gray-600">
            <span>March 19, 2026</span>
            <span className="w-1 h-1 rounded-full bg-gray-600" />
            <span>15 min read</span>
          </div>

          {/* Divider */}
          <div
            className="mt-8 h-px"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(var(--accent), 0.3), transparent)",
            }}
          />

          {/* Article body */}
          <div className="markdown-class">
            <p>
              Every time you close ChatGPT, it forgets you. Your name, your preferences, the fact that you told it three times you&apos;re allergic to shellfish — gone. The conversation is just a context window, and when it ends, so does everything the model &ldquo;knew&rdquo; about you.
            </p>

            <p>
              I wanted to build something different: a locally-running language model that genuinely remembers. Not through a simple database lookup, but through a system inspired by how the human brain actually forms, strengthens, and suppresses memories.
            </p>

            <p>
              This is the story of <strong>Living LLM</strong> and the library that powers it — <strong>limbiq</strong>. I built it with <strong>Claude Opus 4.6</strong> as my collaborator — not just for code generation, but as an architectural thinking partner throughout the design process. The ideas are mine; the velocity of turning those ideas into working code was very much a human-AI partnership.
            </p>

            <hr />

            <h2>The Problem with &ldquo;Just Add a Database&rdquo;</h2>

            <p>
              The naive approach to LLM memory is straightforward: store every conversation in a vector database, retrieve relevant chunks before each response, inject them into the context window. It works. Sort of.
            </p>

            <p>
              But it doesn&apos;t feel like memory. It feels like reading notes someone else wrote. The model doesn&apos;t distinguish between a casual remark and a deeply personal disclosure. It doesn&apos;t know that when you said &ldquo;actually, my name is Alex, not Alexander&rdquo; three messages ago, the old information should be <em>suppressed</em>, not just co-exist alongside the correction. It doesn&apos;t notice that you&apos;ve asked about machine learning in twelve consecutive sessions and should probably start clustering that domain knowledge.
            </p>

            <p>I needed something more principled. So I looked at how the brain does it.</p>

            <h2>Five Signals: A Neurotransmitter Model for Memory</h2>

            <p>
              In the human brain, memory isn&apos;t a filing cabinet — it&apos;s a dynamic system where neurochemical signals determine what gets stored, what gets strengthened, what gets suppressed, and what fades entirely. I modeled five of these signals in software.
            </p>

            <p>
              <strong>Dopamine — &ldquo;This matters, remember it.&rdquo;</strong> In neuroscience, dopamine signals reward and salience. In limbiq, it fires when the user shares personal information, provides a correction, or gives positive feedback. A dopamine-tagged memory becomes <em>priority</em> — it&apos;s always included in the model&apos;s context, regardless of embedding similarity scores. When a user says &ldquo;My wife&apos;s name is Sarah,&rdquo; that&apos;s not just another fact. It&apos;s a signal that this person is investing trust, and the system should never forget it.
            </p>

            <p>
              <strong>GABA — &ldquo;Suppress this, let it fade.&rdquo;</strong> GABA is the brain&apos;s primary inhibitory neurotransmitter. In limbiq, it fires on contradictions, denials, and stale information. When a user corrects a fact — &ldquo;I actually left that job last year&rdquo; — GABA suppresses the old memory while dopamine tags the new one. The suppression is soft and reversible; the old memory isn&apos;t deleted, just excluded from retrieval. This mirrors how human memories aren&apos;t truly &ldquo;erased&rdquo; — they become harder to access.
            </p>

            <p>
              <strong>Serotonin — &ldquo;This is a behavioral pattern.&rdquo;</strong> Serotonin modulates mood, social behavior, and long-term behavioral regulation. In limbiq, it detects repeated user preferences and crystallizes them into behavioral rules. If a user consistently asks for concise responses, or always prefers code examples over prose explanations, serotonin fires and creates a rule that shapes future responses — without the user having to explicitly say &ldquo;be concise&rdquo; every session.
            </p>

            <p>
              <strong>Acetylcholine — &ldquo;Focus on this domain.&rdquo;</strong> Acetylcholine is associated with attention, learning, and memory consolidation in specific domains. When a user sustains discussion on a particular topic across multiple sessions — say, Kubernetes deployments or Renaissance art — acetylcholine clusters related memories together. This allows deep, domain-specific recall without flooding the context with unrelated facts.
            </p>

            <p>
              <strong>Norepinephrine — &ldquo;Topic shifted, be careful.&rdquo;</strong> Norepinephrine governs alertness and the response to novelty. When limbiq detects an abrupt topic change — you were discussing your vacation plans and suddenly ask about quantum computing — norepinephrine fires, widening the retrieval window and adding caution flags. This prevents the model from confidently applying old context to a new domain.
            </p>

            <p>
              The five signals work together. A correction triggers both dopamine (on the new fact) and GABA (on the old one). A sustained interest triggers both acetylcholine (cluster the knowledge) and serotonin (note the behavioral pattern). A topic shift triggers norepinephrine alongside adjusted retrieval.
            </p>

            <h2>The Three-Method API</h2>

            <p>
              Despite the sophistication underneath, limbiq exposes a remarkably simple interface. The entire integration surface is three methods:
            </p>

            <pre><code className="language-python">{`from limbiq import Limbiq

lq = Limbiq(
    store_path="data/limbiq",
    user_id="default",
    embedding_model="all-MiniLM-L6-v2",
    llm_fn=my_compress_function,  # any fn(str) -> str
)

# 1. Before generating a response: ask limbiq for context
result = lq.process(
    message=user_input,
    conversation_history=recent_messages,
)
# result.context contains enriched memory to inject into the prompt
# result.signals_fired tells you what neurochemical events occurred

# 2. After generating a response: tell limbiq what happened
lq.observe(message=user_input, response=assistant_response)

# 3. When the session ends: consolidate
lq.end_session()
# Compresses conversations into atomic facts
# Runs knowledge graph inference
# Suppresses stale memories
# Deletes old suppressed memories`}</code></pre>

            <p>
              That&apos;s it. <code>process → LLM → observe</code>. The engine doesn&apos;t need to know about signals, embeddings, graph inference, or memory tiers. Limbiq handles all of it internally.
            </p>

            <h2>Memory Tiers: From Conversation to Knowledge</h2>

            <p>
              Not all memories are equal, and they shouldn&apos;t be stored the same way. Limbiq uses three tiers that mirror the brain&apos;s progression from episodic to semantic memory.
            </p>

            <p>
              <strong>SHORT tier</strong> stores raw conversation turns — the episodic memory of &ldquo;what just happened.&rdquo; These are aged each session. After a few sessions without being accessed, they&apos;re suppressed via GABA. This is the equivalent of how you forget the details of a specific conversation but retain the gist.
            </p>

            <p>
              <strong>MID tier</strong> contains atomic facts compressed from conversations. When a session ends, limbiq uses the LLM to extract self-contained, searchable facts from the raw exchanges. &ldquo;The user&apos;s father is John&rdquo; is a MID fact. It&apos;s independently useful and can be matched by embedding search without needing the surrounding conversational context. This is semantic memory — knowledge stripped from its episodic origin.
            </p>

            <p>
              <strong>PRIORITY tier</strong> holds dopamine-tagged facts — things the system has been explicitly or implicitly told are important. These bypass retrieval scoring entirely; they&apos;re always injected into context. This mirrors how certain emotionally significant memories in the human brain are readily accessible regardless of current context.
            </p>

            <p>
              The compression pipeline acts as a natural quality filter. Only conversations deemed worth remembering (by the signal system) produce MID-tier facts. And only those facts are later eligible for LoRA fine-tuning — creating a direct pipeline from &ldquo;this mattered&rdquo; to &ldquo;learn from this.&rdquo;
            </p>

            <h2>The Knowledge Graph: Structured Understanding</h2>

            <p>
              Vector similarity is powerful but limited. When a user mentions &ldquo;my father,&rdquo; embedding search might return memories about fathers in general, or other people&apos;s fathers, alongside the relevant one. Structured relationships require structured storage.
            </p>

            <p>
              Limbiq builds a personal knowledge graph from conversations — entities (people, places, companies) connected by labeled relationships (father, wife, works_at). More interestingly, a deterministic inference engine computes implied relationships without ever calling the LLM:
            </p>

            <pre><code>{`User shares over several conversations:
  "My father is John"       →  User --[father]--> John
  "My wife is Sarah"        →  User --[wife]--> Sarah

Limbiq infers automatically:
  John --[father_in_law_of]--> Sarah`}</code></pre>

            <p>
              This matters for two reasons. First, token efficiency: instead of injecting five raw memory strings (perhaps 200 tokens), the graph produces a compact world summary in roughly 40 tokens — &ldquo;Your father is John. Your wife is Sarah. You work at Acme Corp.&rdquo; Second, graph queries like &ldquo;Who is John to my wife?&rdquo; are answered deterministically — zero LLM cost, instant response.
            </p>

            <h2>Making Small Models Pay Attention</h2>

            <p>
              Here&apos;s a practical lesson I learned the hard way: 8B-parameter models often ignore system prompts. You can inject beautifully structured memory context into the system message, and the model will cheerfully say &ldquo;I don&apos;t have any information about your previous conversations.&rdquo;
            </p>

            <p>The fix was architectural. Instead of relying on the system prompt alone, I inject memory context directly into the user message:</p>

            <pre><code className="language-python">{`user_msg = (
    "Here is what you remember about me from past conversations "
    "(use this naturally, do NOT mention section names or tags). "
    "Answer using ONLY this memory — do NOT search the web:\\n\\n"
    f"{result.context}\\n\\n"
    f"Now answer this: {user_input}"
)`}</code></pre>

            <p>
              Small models pay far more attention to user turns than to system content buried early in the context window. This single design decision — injecting memory into the user message rather than the system prompt — was the difference between a model that consistently uses its memories and one that randomly ignores them.
            </p>

            <h2>LoRA Neuroplasticity: From Memory to Learning</h2>

            <p>
              Context injection gives the model <em>information</em>. Fine-tuning gives it <em>capability</em>. The difference is the same as reading your notes before an exam versus actually understanding the material.
            </p>

            <p>
              Living LLM includes a LoRA (Low-Rank Adaptation) training pipeline that runs on Apple Silicon via MLX. After enough conversations have been compressed and stored (the default threshold is three), the system can train a lightweight adapter on top of the base model.
            </p>

            <p>
              The training data pipeline has an elegant property: it only learns from conversations that survived the compression pipeline. If limbiq&apos;s signal system deemed an exchange worth compressing into facts, the interaction pattern is worth reinforcing through fine-tuning. GABA-suppressed exchanges are excluded. Dopamine-tagged interactions are prioritized. The neurochemical signals don&apos;t just manage memory retrieval — they curate the training set.
            </p>

            <pre><code className="language-python">{`# Only compressed (signal-approved) conversations become training data
rows = conn.execute(
    "SELECT id, messages FROM conversations WHERE compressed = 1"
).fetchall()`}</code></pre>

            <p>
              Each conversation is decomposed into individual turn pairs, formatted in the Llama 3.1 chat template (the exact format the model was instruction-tuned on), and saved as JSONL. Crucially, the system prompt — which contains whatever memory context was active during that conversation — is included in the training examples. This means the adapter doesn&apos;t just learn to respond; it learns to respond <em>using memory context naturally</em>.
            </p>

            <p>
              The training itself runs as a background process. The user can keep chatting while the model learns. When training completes, the new adapter is loaded on the next message — the model has literally changed its weights between turns.
            </p>

            <p>
              An adapter manager handles versioning and rollback. The last five adapters are kept, and if the newest one degrades quality (which can happen with small or off-topic training data), the system can revert to a previous checkpoint. There&apos;s also a built-in comparison tool that runs the same prompt through both the base and adapted models, letting you directly observe what the fine-tuning changed.
            </p>

            <h2>The Full Architecture</h2>

            <p>
              Everything runs locally on a single Apple Silicon machine. One MLX model instance serves all purposes — primary generation, LoRA adapter inference, limbiq&apos;s compression calls, and activation steering. No cloud dependencies, no API keys for the core functionality.
            </p>

            <pre><code>{`User message
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
    └── (enough data?) → LoRA training in background`}</code></pre>

            <p>
              The web search integration deserves a note. When limbiq returns low-confidence results (few memories retrieved, no priority matches), a web augmenter triggers a search. Facts extracted from search results are stored through limbiq&apos;s dopamine signal with a <code>[Web]</code> prefix, so they become part of the persistent memory. The model learns from the web and remembers what it found.
            </p>

            <h2>What I Learned</h2>

            <p>
              <strong>Signals are more than metadata.</strong> The initial temptation was to treat dopamine/GABA as simple tags. But when I let signals influence <em>training data curation</em>, the quality gap became significant. The neurochemical metaphor isn&apos;t just an API nicety — it creates a coherent pipeline from &ldquo;this matters&rdquo; to &ldquo;learn from this.&rdquo;
            </p>

            <p>
              <strong>Memory location matters more than memory content.</strong> The same memory context, injected in the system prompt versus the user message, produces dramatically different behavior in small models. Where you put information is as important as what information you put.
            </p>

            <p>
              <strong>Consolidation is where learning happens.</strong> The <code>end_session()</code> call — which compresses, extracts, infers, and prunes — is where the system does its most important work. It&apos;s the LLM equivalent of sleep consolidation in the brain, and skipping it means the memory system gradually silts up with unprocessed episodic fragments.
            </p>

            <p>
              <strong>Soft suppression beats hard deletion.</strong> When I first built the system, GABA-suppressed memories were immediately deleted. This caused problems when users corrected corrections, or when context shifted back to a previously-suppressed topic. Soft suppression — hiding from retrieval but keeping in storage — mirrors the brain&apos;s approach and proved far more robust.
            </p>

            <h2>What&apos;s Next</h2>

            <p>
              The system works. A locally-running 8B model that remembers your name, your family, your preferences, and your ongoing projects across sessions — and gradually gets better at understanding you through LoRA adaptation.
            </p>

            <p>
              But I&apos;m honest about the limitation: even with signals and fine-tuning, this is still fundamentally <em>retrieval plus adaptation</em>. The model reads its memories, it doesn&apos;t truly &ldquo;know&rdquo; them the way a human knows their own name. The gap between context injection and genuine understanding remains. Closing it — moving from &ldquo;reading notes before the exam&rdquo; to &ldquo;having internalized the material&rdquo; — is the next frontier.
            </p>

            <p>
              I think the path forward lies in two directions: structured skill learning through explicit pass/fail feedback loops (not just conversation, but task attempt → outcome → weight update), and knowledge internalization through pattern extraction from external resources (not just storing web facts, but distilling them into schema-level understanding). The neurotransmitter metaphor still has room to grow.
            </p>

            <hr />

            <p>
              <em>
                Living LLM is open-source and runs entirely on Apple Silicon. The limbiq library is available on{" "}
                <a href="https://github.com/deBilla/limbiq" target="_blank" rel="noopener noreferrer">
                  GitHub
                </a>
                . The entire project — from architecture design to implementation — was built in collaboration with Claude Opus 4.6 (Anthropic). If you&apos;re interested in building local AI systems that learn and adapt, I&apos;d love your contributions and feedback.
              </em>
            </p>
          </div>
        </article>

        <div className="max-w-3xl mx-auto px-6">
          <Footer />
        </div>
      </div>
    </>
  );
};

export default LivingLLMArticle;
