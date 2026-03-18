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
    title:
      "What If Your LLM Could Remember You? Building a Neurotransmitter-Inspired Memory System for Local Language Models",
    date: "2026-03-19",
    readTime: "15 min read",
    tags: ["AI", "LLM", "Neuroscience", "Python"],
    preview:
      "How I drew on neuroscience to give a locally-running Llama 3.1 persistent memory, a personal knowledge graph, and the ability to learn from its own conversations.",
  },
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
