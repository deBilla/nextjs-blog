import React, { useEffect, useState } from "react";

interface MediumArticle {
  title: string;
  link: string;
  pubDate: string;
  thumbnail: string;
  description: string;
  categories: string[];
}

const BlogSection: React.FC = () => {
  const [articles, setArticles] = useState<MediumArticle[]>([]);
  const [loading, setLoading] = useState(true);

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
        <p className="section-overline">Blog</p>
        <h2 className="section-title mb-4">
          Latest <span className="text-gradient">articles</span>
        </h2>
        <p className="text-gray-400 mb-12 max-w-xl">
          Thoughts on distributed systems, AI, cloud architecture, and open source.
        </p>

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
                      {new Date(article.pubDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="text-xs font-medium text-brand-400 opacity-0 group-hover:opacity-100 transition-all duration-300 inline-flex items-center gap-1">
                      Read
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
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
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
