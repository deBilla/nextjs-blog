import React from "react";
import Head from "next/head";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import data from "../../data/portfolio.json";

const Article: React.FC = () => {
  return (
    <>
      <Head>
        <title>Traditional software engineering jobs are FINISHED!!!! — {data.name}</title>
        <meta name="description" content="
For the first time after long resisting letting AI agents do full changes to a codebase, this weekend I did a project using Claude Code and didn’t write a sing" />
      </Head>

      <div className="bg-glow" />
      <div className="bg-glow-2" />

      <div className="relative z-10">
        <Navbar />

        <article className="max-w-3xl mx-auto px-6 pt-28 pb-20">
          <Link href="/blogs">
            <a className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-400 transition-colors mb-8">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to blogs
            </a>
          </Link>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {["claude-code","ai-coding-agent","software-engineering"].map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight">
            Traditional software engineering jobs are FINISHED!!!!
          </h1>

          <div className="mt-4 flex items-center gap-3 text-xs font-mono text-gray-400 dark:text-gray-600">
            <span>March 1, 2026</span>
            <span className="w-1 h-1 rounded-full bg-gray-600" />
            <span>4 min read</span>
            <span className="w-1 h-1 rounded-full bg-gray-600" />
            <a href="https://billacode.medium.com/traditional-software-engineering-jobs-are-finished-c646c9641895?source=rss-46f1692aa552------2" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline">
              Read on Medium
            </a>
          </div>

          <div
            className="mt-8 h-px"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(var(--accent), 0.3), transparent)",
            }}
          />

          <div
            className="markdown-class"
            dangerouslySetInnerHTML={{ __html: `
<p>For the first time after long resisting letting AI agents do full changes to a codebase, this weekend I did a project using Claude Code and didn’t write a single line of code.</p>
<figure><img alt="" src="https://cdn-images-1.medium.com/max/1024/1*pK2IzbqtL55q4rl3trs5EQ.png"/></figure><p>A project like this with unit tests, integration tests, proper CI/CD pipelines and everything would have taken me at least 3–4 days. I did it in under 12 hours.</p>
<p>If you want to ship something quickly without exhausting all your tokens, this guide might help.</p>
<p>This article is about what I did instead of writing code.</p>
<p>At least for now, even the best LLM models need a lot of guidance when it comes to producing a clean, production-grade product. This is where system design principles become your superpower.</p>
<p>Before starting the project, you should be clear about:</p>
<ul>
<li>High Level System Design (HLD)</li>
<li>Low Level Design (LLD)</li>
</ul>
<p>High Level Design covers what the application does: stakeholders, core entities, scalability, infrastructure, boundaries.</p>
<p>Low Level Design focuses on code-level structure: design patterns, module boundaries, OOP principles, error handling, testing strategy.</p>
<p>Let’s walk through a simple example.</p>
<p>You are asked to create an admin console application to handle a media pipeline orchestration.</p>
<h3>Step 1: High Level Design</h3>
<h3>Functional Requirements</h3>
<ul>
<li>CRUD for media metadata</li>
<li>Trigger transcoding (using AWS MediaConvert)</li>
<li>Update metadata with transcoded resource URLs</li>
</ul>
<h3>Non-Functional Requirements</h3>
<ul>
<li>Eventually consistent system</li>
<li>Highly available</li>
<li>Should handle ~1K RPS</li>
<li>Idempotent operations for job triggering</li>
<li>Observability (metrics + logs)</li>
</ul>
<h3>Core Entities</h3>
<ul>
<li>MediaItem</li>
<li>TranscodeJob</li>
<li>User</li>
</ul>
<h3>API Design</h3>
<pre>POST   /media-items<br/>GET    /media-items<br/>GET    /media-items/{id}<br/>PUT    /media-items/{id}<br/>DELETE /media-items/{id}</pre>
<pre>POST   /transcode-jobs<br/>GET    /transcode-jobs/{jobId}</pre>
<p>Example:</p>
<p>POST /media-items<br/>→ 201 { mediaItemId }</p>
<p>POST /transcode-jobs<br/>→ 201 { transcodeJobId, status }</p>
<h3>Step 2: High Level Architecture</h3>
<p>Instead of asking the AI to “build the project”, I first gave it an architecture blueprint.</p>
<h3>Architecture Components</h3>
<ul>
<li>API Service (stateless, horizontally scalable)</li>
<li>Relational Database (PostgreSQL)</li>
<li>Message Queue (for async job processing)</li>
<li>Worker Service (transcode orchestration)</li>
<li>AWS MediaConvert integration</li>
<li>Object storage (S3)</li>
<li>CI/CD pipeline</li>
</ul>
<h3>Flow</h3>
<ol>
<li>User creates MediaItem → Stored in DB.</li>
<li>User triggers TranscodeJob → API stores job in DB with status = PENDING.</li>
<li>API publishes event to Queue.</li>
<li>Worker consumes event.</li>
<li>Worker calls AWS MediaConvert.</li>
<li>MediaConvert sends callback / status polling.</li>
<li>Worker updates TranscodeJob status and MediaItem URLs.</li>
</ol>
<p>This separation alone prevents AI from creating a spaghetti monolith.</p>
<p>When you define clear service boundaries, AI follows them.</p>
<h3>Step 3: Database Design</h3>
<p>Instead of saying “create models”, I gave schema-level instructions.</p>
<h3>MediaItem</h3>
<ul>
<li>id (UUID)</li>
<li>title</li>
<li>description</li>
<li>mediaType</li>
<li>rawFileUrl</li>
<li>transcodedUrl</li>
<li>createdAt</li>
<li>updatedAt</li>
</ul>
<h3>TranscodeJob</h3>
<ul>
<li>id (UUID)</li>
<li>mediaItemId (FK)</li>
<li>status (PENDING | PROCESSING | COMPLETED | FAILED)</li>
<li>providerJobId</li>
<li>createdAt</li>
<li>updatedAt</li>
</ul>
<h3>User</h3>
<ul>
<li>id</li>
<li>role (ADMIN)</li>
</ul>
<p>When AI understands relationships, it generates much cleaner repositories and service layers.</p>
<h3>Step 4: Low Level Design</h3>
<p>This is where most developers fail with AI.</p>
<p>They say: “build the backend in Node.js”.</p>
<p>Instead, I gave it:</p>
<h3>Tech Stack</h3>
<ul>
<li>Node.js + TypeScript</li>
<li>Express</li>
<li>PostgreSQL</li>
<li>Prisma ORM</li>
<li>Jest (unit tests)</li>
<li>Supertest (integration tests)</li>
<li>Docker</li>
<li>GitHub Actions CI</li>
</ul>
<h3>Architectural Pattern</h3>
<ul>
<li>Clean Architecture</li>
<li>Controller → Service → Repository</li>
<li>Dependency injection</li>
<li>DTO validation layer</li>
<li>Centralized error handling middleware</li>
<li>Structured logging</li>
</ul>
<p>When you define this clearly, AI doesn’t hallucinate random patterns.</p>
<p>It follows structure.</p>
<h3>Step 5: Test-First Prompting</h3>
<p>This was a game changer. Instead of:</p>
<p>“Build media controller”</p>
<p>I did:</p>
<ol>
<li>“Write integration tests for media endpoints based on the API contract.”</li>
<li>“Now implement controller logic to satisfy these tests.”</li>
<li>“Now implement service layer.”</li>
<li>“Now implement repository layer.”</li>
</ol>
<p>By forcing AI to satisfy tests, it behaved like a disciplined junior engineer.</p>
<h3>Step 6: CI/CD &amp; DevOps</h3>
<p>I explicitly asked for:</p>
<ul>
<li>Dockerfile</li>
<li>docker-compose for local dev</li>
<li>Health check endpoint</li>
<li>GitHub Actions pipeline:</li>
<li>Install dependencies</li>
<li>Run lint</li>
<li>Run tests</li>
<li>Build</li>
<li>Fail on coverage &lt; 80%</li>
</ul>
<p>When you specify quality gates, AI doesn’t cut corners.</p>
<h3>Step 7: Handling Non-Functional Requirements</h3>
<p>To meet 1K RPS:</p>
<ul>
<li>Stateless API pods</li>
<li>Horizontal scaling</li>
<li>DB connection pooling</li>
<li>Async job processing</li>
<li>Retry with exponential backoff</li>
<li>Idempotency key for transcode trigger</li>
</ul>
<p>I also asked AI to:</p>
<ul>
<li>Add request validation</li>
<li>Add rate limiting middleware</li>
<li>Add structured logging</li>
<li>Add metrics endpoint</li>
</ul>
<p>Without explicitly asking, it wouldn’t have added half of this.</p>
<h3>What I Actually Did</h3>
<p>I did not code. But,</p>
<ul>
<li>Designed the system</li>
<li>Wrote structured prompts</li>
<li>Reviewed architecture</li>
<li>Corrected edge cases</li>
<li>Enforced constraints</li>
<li>Iteratively refined outputs</li>
</ul>
<p>I became the architect and reviewer. AI became the implementer.</p>
<h3>The Brutal Truth</h3>
<p>Traditional “code monkey” software engineering is dying. But ….</p>
<p>System design skill is becoming 10x more valuable.</p>
<p>If you only know how to write CRUD code, yes, you should be worried. If you know how to:</p>
<ul>
<li>Design scalable systems</li>
<li>Define clear contracts</li>
<li>Think in failure scenarios</li>
<li>Structure clean architectures</li>
<li>Write precise technical specs</li>
</ul>
<p>You’re not being replaced. You’re being upgraded.</p>
<h3>The New Role of a Software Engineer</h3>
<p>You are:</p>
<ul>
<li>System designer</li>
<li>AI conductor</li>
<li>Quality gatekeeper</li>
<li>Architecture decision maker</li>
</ul>
<p>AI writes syntax. You own thinking.</p>
<h3>Practical Advice</h3>
<p>If you want to survive (and thrive):</p>
<ol>
<li>Master High Level Design.</li>
<li>Master Low Level Design.</li>
<li>Learn distributed systems fundamentals.</li>
<li>Learn how to write structured prompts.</li>
<li>Think in constraints and contracts.</li>
<li>Always enforce testing.</li>
</ol>
<p>The engineers who adapt will ship 10x faster. The ones who don’t will feel like the world is collapsing.</p>
<h3>Final Thought</h3>
<p>Jobs are not finished. Low-skill implementation-only roles are shrinking. High-leverage system thinkers are becoming unstoppable. The future isn’t AI replacing engineers. It’s engineers who use AI replacing engineers who don’t. And after this weekend, I’m convinced: The bottleneck is no longer writing code. It’s thinking clearly.</p>
<p>The moment AI can:</p>
<ul>
<li>Define product vision without being prompted</li>
<li>Negotiate trade-offs between business, cost, and scalability</li>
<li>Detect flawed requirements and push back</li>
<li>Handle undefined edge cases without human framing</li>
<li>Take accountability for failures</li>
</ul>
<p>that’s the moment software engineers become optional.</p>
<img src="https://medium.com/_/stat?event=post.clientViewed&amp;referrerSource=full_rss&amp;postId=c646c9641895" width="1" height="1" alt=""/>
` }}
          />
        </article>

        <div className="max-w-3xl mx-auto px-6">
          <Footer />
        </div>
      </div>
    </>
  );
};

export default Article;
