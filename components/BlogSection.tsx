import React, { useEffect, useState } from "react";
import Link from "next/link";

interface MediumArticle {
  title: string;
  link: string;
  pubDate: string;
  thumbnail: string;
  description: string;
  categories: string[];
}

interface DeepDive {
  slug: string;
  title: string;
  date: string;
  readTime: string;
  tags: string[];
  preview: string;
}

const deepDives: DeepDive[] = [
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

const BlogSection: React.FC = () => {
  const [articles, setArticles] = useState<MediumArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"medium" | "deepdives">("medium");

  useEffect(() => {
    fetch(
      "https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@billacode"
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.items) {
          setArticles(
            data.items.map((item: any) => ({
              title: item.title,
              link: item.link,
              pubDate: item.pubDate,
              thumbnail: item.thumbnail || "",
              description:
                item.description?.replace(/<[^>]*>/g, "").slice(0, 150) +
                  "..." || "",
              categories: item.categories || [],
            }))
          );
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <section id="blog" className="py-24 lg:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <p className="section-overline">Writing</p>
        <h2 className="section-title mb-4">
          Articles &amp; <span className="text-gradient">deep dives</span>
        </h2>
        <p className="text-gray-400 mb-8 max-w-xl">
          Thoughts on distributed systems, AI, cloud architecture, and open source.
        </p>

        {/* Tabs */}
        <div className="flex gap-2 mb-10">
          <button
            onClick={() => setActiveTab("medium")}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 border ${
              activeTab === "medium"
                ? "bg-brand-500/10 text-brand-400 border-brand-500/30"
                : "border-gray-800 text-gray-500 hover:text-gray-300"
            }`}
          >
            Medium Published
          </button>
          <button
            onClick={() => setActiveTab("deepdives")}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 border ${
              activeTab === "deepdives"
                ? "bg-brand-500/10 text-brand-400 border-brand-500/30"
                : "border-gray-800 text-gray-500 hover:text-gray-300"
            }`}
          >
            Deep Dives ({deepDives.length})
          </button>
        </div>

        {/* Medium Published */}
        {activeTab === "medium" && (
          <>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="rounded-2xl h-72 animate-pulse bg-gray-800/50"
                  />
                ))}
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-16 card">
                <p className="text-sm text-gray-400">
                  Unable to load articles. Visit{" "}
                  <a
                    href="https://medium.com/@billacode"
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-400 hover:underline"
                  >
                    @billacode on Medium
                  </a>{" "}
                  directly.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {articles.map((article, i) => (
                  <a
                    key={i}
                    href={article.link}
                    target="_blank"
                    rel="noreferrer"
                    className="card group overflow-hidden flex flex-col"
                  >
                    {article.thumbnail && (
                      <div className="overflow-hidden h-44">
                        <img
                          src={article.thumbnail}
                          alt={article.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="p-5 flex-1 flex flex-col">
                      {article.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {article.categories.slice(0, 3).map((cat) => (
                            <span key={cat} className="tag">
                              {cat}
                            </span>
                          ))}
                        </div>
                      )}
                      <h3 className="font-semibold text-sm leading-snug group-hover:text-brand-400 transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-gray-500 line-clamp-2 flex-1">
                        {article.description}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-gray-600">
                          {new Date(article.pubDate).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </span>
                        <span className="text-xs font-medium text-brand-400 opacity-0 group-hover:opacity-100 transition-all duration-300 inline-flex items-center gap-1">
                          Read
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 8l4 4m0 0l-4 4m4-4H3"
                            />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}

            <div className="mt-8 text-center">
              <a
                href="https://medium.com/@billacode"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-brand-400 transition-colors"
              >
                View all articles on Medium
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          </>
        )}

        {/* Deep Dives */}
        {activeTab === "deepdives" && (
          <div className="space-y-4">
            {deepDives.map((post) => (
              <Link key={post.slug} href={`/blogs/${post.slug}`}>
                <a className="block card group p-6 cursor-pointer">
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {post.tags.map((tag) => (
                      <span key={tag} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-lg font-bold leading-snug group-hover:text-brand-400 transition-colors">
                    {post.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    {post.preview}
                  </p>
                  <div className="mt-4 flex items-center gap-3 text-xs font-mono text-gray-600">
                    <span>
                      {new Date(post.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-600" />
                    <span>{post.readTime}</span>
                  </div>
                </a>
              </Link>
            ))}

            <div className="mt-8 text-center">
              <Link href="/blogs">
                <a className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-brand-400 transition-colors">
                  View all deep dives
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </a>
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default BlogSection;
