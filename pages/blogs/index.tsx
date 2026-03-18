import Head from "next/head";
import Link from "next/link";
import React from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import data from "../../data/portfolio.json";

interface BlogPost {
  slug: string;
  title: string;
  subtitle: string;
  date: string;
  readTime: string;
  tags: string[];
  preview: string;
}

const posts: BlogPost[] = [
  {
    slug: "living-llm-neurotransmitter-memory",
    title:
      "What If Your LLM Could Remember You? Building a Neurotransmitter-Inspired Memory System for Local Language Models",
    subtitle:
      "How I drew on neuroscience to give a locally-running Llama 3.1 persistent memory, a personal knowledge graph, and the ability to learn from its own conversations — with Claude Opus 4.6 as my coding collaborator.",
    date: "2026-03-19",
    readTime: "15 min read",
    tags: ["AI", "LLM", "Neuroscience", "Python", "Open Source"],
    preview:
      "Every time you close ChatGPT, it forgets you. I wanted to build something different: a locally-running language model that genuinely remembers — through a system inspired by how the human brain actually forms, strengthens, and suppresses memories.",
  },
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
