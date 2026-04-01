import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import data from "../../data/portfolio.json";

interface MediumArticle {
  title: string;
  link: string;
  pubDate: string;
}

interface BlogPost {
  slug: string;
  title: string;
  date: string;
  readTime: string;
}

const deepDives: BlogPost[] = [
  { slug: "living-llm-neurotransmitter-memory", title: "What If Your LLM Could Remember You? Building a Neurotransmitter-Inspired Memory System for Local Language Models", date: "2026-03-19", readTime: "15 min" },
  { slug: "traditional-software-engineering-jobs-are-finished", title: "Traditional software engineering jobs are FINISHED!!!!", date: "2026-02-28", readTime: "4 min" },
  { slug: "handling-rpc-exceptions-in-nestjs-microservices", title: "Handling RPC Exceptions in NestJS Microservices", date: "2025-10-22", readTime: "1 min" },
  { slug: "nestjs-microservice-to-microservice-communication-using-rpc", title: "NestJS — Microservice to Microservice Communication Using RPC", date: "2025-10-17", readTime: "1 min" },
  { slug: "my-recycling-app-did-3-pivots-and-0-recycles-a-post-mortem", title: "My Recycling App Did 3 Pivots and 0 Recycles. A Post-Mortem.", date: "2025-10-11", readTime: "4 min" },
  { slug: "this-is-fine-how-disabling-caching-can-set-your-database-ablaze", title: "This is Fine: How Disabling Caching Can Set Your Database Ablaze", date: "2025-10-11", readTime: "3 min" },
  { slug: "your-laptops-ai-superpower-is-kinda-dumb-compared-to-real-apis", title: "Your Laptop's \"AI Superpower\" is Kinda Dumb (Compared to Real APIs)", date: "2025-10-10", readTime: "1 min" },
  { slug: "i-built-a-website-because-sri-lankan-banks-wont-credit-card-deals-aggregator", title: "I Built a Website Because Sri Lankan Banks Won't (Credit Card Deals Aggregator)", date: "2025-10-07", readTime: "4 min" },
  { slug: "firebase-dynamic-links-deprecated-implement-one-in-house", title: "Firebase dynamic links deprecated — Implement one in house", date: "2025-06-10", readTime: "1 min" },
  { slug: "creating-a-vod-application-like-netflix-amazon-prime-using-aws-media-converter-s", title: "Creating a VOD application (like Netflix, Amazon prime) using AWS", date: "2025-02-23", readTime: "1 min" },
  { slug: "estimating-bigquery-result-row-count-without-running-the-whole-query", title: "Estimating Bigquery result row count without running the whole query", date: "2025-01-27", readTime: "1 min" },
];

const Blog: React.FC = () => {
  const [mediumArticles, setMediumArticles] = useState<MediumArticle[]>([]);

  useEffect(() => {
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
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <Head>
        <title>Blog — {data.name}</title>
        <meta
          name="description"
          content="Thoughts on distributed systems, AI, cloud architecture, and open source."
        />
      </Head>

      <Navbar />

      <div className="max-w-2xl mx-auto px-6 pt-12 pb-20">
        <h1 className="text-2xl font-bold tracking-tight">Writing</h1>
        <p className="mt-2 text-sm text-gray-500">
          I also write on{" "}
          <a
            href="https://medium.com/@billacode"
            target="_blank"
            rel="noopener noreferrer"
          >
            Medium
          </a>
          .
        </p>

        {/* Deep Dives */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold tracking-tight mb-4">
            Deep Dives
          </h2>
          <div className="space-y-3">
            {deepDives.map((post) => (
              <div key={post.slug} className="text-sm">
                <Link href={`/blogs/${post.slug}`}>
                  <a className="font-medium">{post.title}</a>
                </Link>
                <span className="text-gray-400 ml-2">
                  {new Date(post.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Medium Articles */}
        {mediumArticles.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-semibold tracking-tight mb-4">
              Medium
            </h2>
            <div className="space-y-3">
              {mediumArticles.map((article, i) => (
                <div key={i} className="text-sm">
                  <a
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium"
                  >
                    {article.title}
                  </a>
                  <span className="text-gray-400 ml-2">
                    {new Date(article.pubDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        <Footer />
      </div>
    </>
  );
};

export default Blog;
