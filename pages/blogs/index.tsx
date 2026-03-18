import Head from "next/head";
import Link from "next/link";
import React from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import data from "../../data/portfolio.json";

interface BlogPost {
  slug: string;
  title: string;
  subtitle?: string;
  date: string;
  readTime: string;
  tags: string[];
  preview: string;
}

const posts: BlogPost[] = [
  {
    slug: "living-llm-neurotransmitter-memory",
    title: "What If Your LLM Could Remember You? Building a Neurotransmitter-Inspired Memory System for Local Language Models",
    date: "2026-03-19",
    readTime: "15 min read",
    tags: [
      "AI",
      "LLM",
      "Neuroscience",
      "Python"
    ],
    preview: "How I drew on neuroscience to give a locally-running Llama 3.1 persistent memory, a personal knowledge graph, and the ability to learn from its own conversations."
  },
  {
    slug: "traditional-software-engineering-jobs-are-finished",
    title: "Traditional software engineering jobs are FINISHED!!!!",
    date: "2026-02-28",
    readTime: "4 min read",
    tags: [
      "claude-code",
      "ai-coding-agent",
      "software-engineering"
    ],
    preview: "\nFor the first time after long resisting letting AI agents do full changes to a codebase, this weekend I did a project using Claude Code and didn’t write a single line of code.\nA project like this wit"
  },
  {
    slug: "handling-rpc-exceptions-in-nestjs-microservices",
    title: "Handling RPC Exceptions in NestJS Microservices",
    date: "2025-10-22",
    readTime: "1 min read",
    tags: [
      "nestjs-exceptions",
      "microservices",
      "rcp-exception-handling",
      "nestjs"
    ],
    preview: "\nHi guys, welcome back to another episode of NestJS learning.\n In my last tutorial, I showed you how to use RPC to communicate between…\nContinue reading on Stackademic »\n"
  },
  {
    slug: "nestjs-microservice-to-microservice-communication-using-rpc",
    title: "NestJS — Microservice to Microservice Communication Using RPC",
    date: "2025-10-17",
    readTime: "1 min read",
    tags: [
      "microservices",
      "nestjs",
      "microservicecommunication"
    ],
    preview: "\nSo you split your giant monolith into microservices. Congratulations — you now have ten smaller problems instead of one big one.\nContinue reading on Stackademic »\n"
  },
  {
    slug: "my-recycling-app-did-3-pivots-and-0-recycles-a-post-mortem",
    title: "My Recycling App Did 3 Pivots and 0 Recycles. A Post-Mortem.",
    date: "2025-10-11",
    readTime: "4 min read",
    tags: [
      "failure",
      "postmortem",
      "recycling",
      "product-market-fit"
    ],
    preview: "\nI was gonna save the planet. With code.\nYeah, I know. Every developer has that one grand, world-changing idea they sketch out at 2 AM, fueled by cold pizza and delusion. Mine was zylobin. The name wa"
  },
  {
    slug: "this-is-fine-how-disabling-caching-can-set-your-database-ablaze",
    title: "This is Fine: How Disabling Caching Can Set Your Database Ablaze",
    date: "2025-10-11",
    readTime: "3 min read",
    tags: [
      "database-caching",
      "caching",
      "database",
      "redis"
    ],
    preview: "\nA cautionary tale from the trenches of application development.\nWe’ve all been there. A bug report lands on your desk, urgent and perplexing. The pressure is on. You’re diving through code, tracing e"
  },
  {
    slug: "your-laptops-ai-superpower-is-kinda-dumb-compared-to-real-apis",
    title: "Your Laptop’s “AI Superpower” is Kinda Dumb (Compared to Real APIs)",
    date: "2025-10-10",
    readTime: "1 min read",
    tags: [
      "llm",
      "ai",
      "generative-ai-tools"
    ],
    preview: "\n\nOr: How I Learned to Stop Worrying and Love the Cloud\nContinue reading on Stackademic »\n"
  },
  {
    slug: "i-built-a-website-because-sri-lankan-banks-wont-credit-card-deals-aggregator",
    title: "I Built a Website Because Sri Lankan Banks Won’t (Credit Card Deals Aggregator)",
    date: "2025-10-07",
    readTime: "4 min read",
    tags: [
      "codingstorytime",
      "ai",
      "llama-3",
      "side-project"
    ],
    preview: "\nTired of missing credit card promotions in Sri Lanka, I scraped 50 bank websites and built CardPromotions.org — using Python, Playwright, and local AI. Here’s how it went wrong (and right).\nEvery dev"
  },
  {
    slug: "firebase-dynamic-links-deprecated-implement-one-in-house",
    title: "Firebase dynamic links deprecated — Implement one in house",
    date: "2025-06-10",
    readTime: "1 min read",
    tags: [
      "deferred-deep-link",
      "deeplink",
      "firebasedynamiclinks"
    ],
    preview: "\n\nCreating a dynamic link is not that of a hard task, you would have a link which need to be shortened, so we map this shortened URL with…\nContinue reading on Stackademic »\n"
  },
  {
    slug: "creating-a-vod-application-like-netflix-amazon-prime-using-aws-media-converter-s",
    title: "Creating a VOD application (like Netflix, Amazon prime) using AWS (Media converter, S3, Cloudfront)",
    date: "2025-02-23",
    readTime: "1 min read",
    tags: [
      "aws",
      "cloudfront",
      "transcoding",
      "video-transcoding"
    ],
    preview: "\n\nHi Guys, Ever wondered how to create a video on demand service like netflix or amazon prime. I have written a article about how to design…\nContinue reading on Nerd For Tech »\n"
  },
  {
    slug: "estimating-bigquery-result-row-count-without-running-the-whole-query",
    title: "Estimating Bigquery result row count without running the whole query",
    date: "2025-01-27",
    readTime: "1 min read",
    tags: [
      "bigquery-dry-run",
      "bigquery",
      "bigquery-sql",
      "bigquery-javascript"
    ],
    preview: "\n\nHi Guys, In this article I will be showing you how to estimate bigquery result count without running the whole thing.\nContinue reading on Stackademic »\n"
  }
];

const BlogsIndex: React.FC = () => {
  return (
    <>
      <Head>
        <title>Blogs — {data.name}</title>
        <meta
          name="description"
          content="Deep dives on AI, distributed systems, and building software that thinks."
        />
      </Head>

      <div className="bg-glow" />
      <div className="bg-glow-2" />

      <div className="relative z-10">
        <Navbar />

        <div className="max-w-4xl mx-auto px-6">
          <section className="pt-28 pb-10">
            <p className="section-overline">Blogs</p>
            <h1 className="section-title">
              Deep Dives<span className="text-brand-500">.</span>
            </h1>
            <p className="mt-3 text-lg text-gray-500 dark:text-gray-400 max-w-xl">
              Long-form articles on AI systems, distributed architecture, and
              the intersection of neuroscience and software.
            </p>
          </section>

          <div className="pb-20 space-y-6">
            {posts.map((post) => (
              <Link key={post.slug} href={`/blogs/${post.slug}`}>
                <a className="block card group p-6 cursor-pointer">
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {post.tags.map((tag) => (
                      <span key={tag} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-xl font-bold leading-snug group-hover:text-brand-400 transition-colors">
                    {post.title}
                  </h2>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    {post.preview}
                  </p>
                  <div className="mt-4 flex items-center gap-3 text-xs font-mono text-gray-400 dark:text-gray-600">
                    <span>
                      {new Date(post.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-600" />
                    <span>{post.readTime}</span>
                  </div>
                </a>
              </Link>
            ))}
          </div>

          <Footer />
        </div>
      </div>
    </>
  );
};

export default BlogsIndex;
