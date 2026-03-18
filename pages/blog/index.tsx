import Head from "next/head";
import Router, { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import data from "../../data/portfolio.json";
import { getAllPosts } from "../../utils/api";
import type { GetStaticProps } from "next";

interface MediumArticle {
  title: string;
  link: string;
  pubDate: string;
  thumbnail: string;
  description: string;
  categories: string[];
}

interface BlogProps {
  posts: Record<string, string>[];
}

const Blog: React.FC<BlogProps> = ({ posts }) => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [mediumArticles, setMediumArticles] = useState<MediumArticle[]>([]);
  const [loadingMedium, setLoadingMedium] = useState(true);
  const [activeTab, setActiveTab] = useState<"medium" | "local">("medium");

  useEffect(() => {
    setMounted(true);
    fetch(
      "https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@billa-code"
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.items) {
          setMediumArticles(
            data.items.map((item: any) => ({
              title: item.title,
              link: item.link,
              pubDate: item.pubDate,
              thumbnail: item.thumbnail || "",
              description:
                item.description?.replace(/<[^>]*>/g, "").slice(0, 160) +
                  "..." || "",
              categories: item.categories || [],
            }))
          );
        }
        setLoadingMedium(false);
      })
      .catch(() => setLoadingMedium(false));
  }, []);

  return (
    <>
      <Head>
        <title>Blog — {data.name}</title>
        <meta name="description" content="Thoughts on distributed systems, AI, cloud architecture, and open source." />
      </Head>

      <div className="bg-glow" />
      <div className="bg-glow-2" />

      <div className="relative z-10">
        <Navbar />

        <div className="max-w-6xl mx-auto px-6">
          {/* Header */}
          <section className="pt-28 pb-10">
            <p className="section-overline">Blog</p>
            <h1 className="section-title">
              Writing<span className="text-brand-500">.</span>
            </h1>
            <p className="mt-3 text-lg text-gray-500 dark:text-gray-400 max-w-xl">
              Thoughts on distributed systems, AI, cloud architecture, and open
              source.
            </p>
          </section>

          {/* Tabs */}
          <div className="flex gap-2 mb-8">
            <button
              onClick={() => setActiveTab("medium")}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 border
                ${
                  activeTab === "medium"
                    ? "bg-brand-500/10 text-brand-400 border-brand-500/30"
                    : "border-gray-200 dark:border-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
            >
              Medium Articles
            </button>
            <button
              onClick={() => setActiveTab("local")}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 border
                ${
                  activeTab === "local"
                    ? "bg-brand-500/10 text-brand-400 border-brand-500/30"
                    : "border-gray-200 dark:border-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
            >
              Posts ({posts.length})
            </button>
          </div>

          {/* Medium Articles */}
          {activeTab === "medium" && (
            <div className="pb-20">
              {loadingMedium ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="rounded-2xl h-64 animate-pulse bg-gray-200 dark:bg-gray-800/50"
                    />
                  ))}
                </div>
              ) : mediumArticles.length === 0 ? (
                <div className="text-center py-20 card">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Unable to load Medium articles. Visit{" "}
                    <a
                      href="https://medium.com/@billa-code"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-400 hover:underline"
                    >
                      @billa-code on Medium
                    </a>{" "}
                    directly.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mediumArticles.map((article, i) => (
                    <a
                      key={i}
                      href={article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="card group overflow-hidden"
                    >
                      {article.thumbnail && (
                        <div className="overflow-hidden h-40">
                          <img
                            src={article.thumbnail}
                            alt={article.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className="p-5">
                        {article.categories.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
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
                        <p className="mt-2 text-xs leading-relaxed text-gray-400 dark:text-gray-500 line-clamp-2">
                          {article.description}
                        </p>
                        <span className="mt-3 block text-[10px] font-mono text-gray-400 dark:text-gray-600">
                          {new Date(article.pubDate).toLocaleDateString(
                            "en-US",
                            { year: "numeric", month: "short", day: "numeric" }
                          )}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Local posts */}
          {activeTab === "local" && (
            <div className="pb-20">
              {posts.length === 0 ? (
                <div className="text-center py-20 card">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No local posts yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {posts.map((post) => (
                    <div
                      key={post.slug}
                      onClick={() => Router.push(`/blog/${post.slug}`)}
                      className="card group cursor-pointer overflow-hidden"
                    >
                      <div className="overflow-hidden h-40">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-5">
                        <h3 className="font-semibold text-sm group-hover:text-brand-400 transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500 line-clamp-2">
                          {post.preview}
                        </p>
                        <span className="mt-3 block text-[10px] font-mono text-gray-400 dark:text-gray-600">
                          {post.date}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <Footer />
        </div>
      </div>
    </>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  const posts = getAllPosts([
    "slug",
    "title",
    "image",
    "preview",
    "author",
    "date",
  ]);
  return { props: { posts: [...posts] } };
};

export default Blog;
