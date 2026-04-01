import Head from "next/head";
import Link from "next/link";
import React from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import data from "../../data/portfolio.json";

interface BlogPost {
  slug: string;
  title: string;
  date: string;
  readTime: string;
}

const posts: BlogPost[] = [
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

const BlogsIndex: React.FC = () => {
  return (
    <>
      <Head>
        <title>Blogs — {data.name}</title>
        <meta
          name="description"
          content="Deep dives on AI, distributed systems, and building software."
        />
      </Head>

      <Navbar />

      <div className="max-w-2xl mx-auto px-6 pt-8 pb-20">
        <h1 className="text-2xl font-bold tracking-tight">Deep Dives</h1>
        <p className="mt-2 text-sm text-gray-500">
          Long-form articles on AI systems, distributed architecture, and
          software engineering.
        </p>

        <div className="mt-8 space-y-3">
          {posts.map((post) => (
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

        <Footer />
      </div>
    </>
  );
};

export default BlogsIndex;
