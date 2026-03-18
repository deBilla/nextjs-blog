#!/usr/bin/env node

/**
 * Fetches all Medium articles from @billacode RSS feed and generates:
 * 1. A deep dives page for each article under pages/blogs/
 * 2. Updates the deepDives array in components/BlogSection.tsx
 *
 * Usage: node scripts/sync-medium.js
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const RSS_URL =
  "https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@billacode";
const BLOGS_DIR = path.join(__dirname, "..", "pages", "blogs");
const BLOG_SECTION_PATH = path.join(
  __dirname,
  "..",
  "components",
  "BlogSection.tsx"
);

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
      res.on("error", reject);
    });
  });
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function estimateReadTime(html) {
  const text = html.replace(/<[^>]*>/g, "");
  const words = text.split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 250));
  return `${minutes} min read`;
}

function escapeJsx(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/'/g, "&apos;")
    .replace(/"/g, "&quot;");
}

// Convert Medium HTML content to clean JSX-safe HTML
function cleanHtml(html) {
  return (
    html
      // Remove Medium tracking params from links
      .replace(/\?source=rss[\w-]*/g, "")
      // Fix self-closing tags for JSX
      .replace(/<br>/g, "<br/>")
      .replace(/<hr>/g, "<hr/>")
      .replace(/<img([^>]*)>/g, "<img$1/>")
      // Remove Medium specific elements
      .replace(/<figure[^>]*>/g, "<figure>")
      .replace(/<figcaption[^>]*>(.*?)<\/figcaption>/gs, "")
  );
}

function generatePageContent(article) {
  const slug = slugify(article.title);
  const description = article.description
    .replace(/<[^>]*>/g, "")
    .slice(0, 160)
    .replace(/"/g, '\\"');
  const tags = article.categories.slice(0, 5);
  const readTime = estimateReadTime(article.content || article.description);
  const date = new Date(article.pubDate);
  const dateStr = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const cleanContent = cleanHtml(article.content || article.description);

  return `import React from "react";
import Head from "next/head";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import data from "../../data/portfolio.json";

const Article: React.FC = () => {
  return (
    <>
      <Head>
        <title>${escapeJsx(article.title)} — {data.name}</title>
        <meta name="description" content="${description}" />
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
            {${JSON.stringify(tags)}.map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight">
            ${escapeJsx(article.title)}
          </h1>

          <div className="mt-4 flex items-center gap-3 text-xs font-mono text-gray-400 dark:text-gray-600">
            <span>${dateStr}</span>
            <span className="w-1 h-1 rounded-full bg-gray-600" />
            <span>${readTime}</span>
            <span className="w-1 h-1 rounded-full bg-gray-600" />
            <a href="${article.link}" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline">
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
            dangerouslySetInnerHTML={{ __html: \`${cleanContent.replace(/`/g, "\\`").replace(/\$/g, "\\$")}\` }}
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
`;
}

function generateDeepDivesArray(articles) {
  return articles.map((article) => {
    const description = article.description
      .replace(/<[^>]*>/g, "")
      .slice(0, 200);
    return {
      slug: slugify(article.title),
      title: article.title,
      date: new Date(article.pubDate).toISOString().split("T")[0],
      readTime: estimateReadTime(article.content || article.description),
      tags: article.categories.slice(0, 4),
      preview: description,
    };
  });
}

function updateBlogSection(deepDives) {
  let content = fs.readFileSync(BLOG_SECTION_PATH, "utf-8");

  const arrayStr = JSON.stringify(deepDives, null, 2)
    .replace(/"([^"]+)":/g, "$1:")
    .replace(/"/g, '"');

  // Replace the deepDives array
  const regex = /const deepDives: DeepDive\[\] = \[[\s\S]*?\];/;
  const replacement = `const deepDives: DeepDive[] = ${arrayStr};`;
  content = content.replace(regex, replacement);

  fs.writeFileSync(BLOG_SECTION_PATH, content);
}

async function main() {
  console.log("Fetching Medium articles...");
  const raw = await fetch(RSS_URL);
  const data = JSON.parse(raw);

  if (!data.items || data.items.length === 0) {
    console.error("No articles found in RSS feed");
    process.exit(1);
  }

  console.log(`Found ${data.items.length} articles\n`);

  // Ensure blogs directory exists
  if (!fs.existsSync(BLOGS_DIR)) {
    fs.mkdirSync(BLOGS_DIR, { recursive: true });
  }

  const generated = [];

  for (const article of data.items) {
    const slug = slugify(article.title);
    const filePath = path.join(BLOGS_DIR, `${slug}.tsx`);

    // Skip the manually created Living LLM article
    if (slug === "living-llm-neurotransmitter-memory") {
      console.log(`⏭  Skipping (manual): ${slug}`);
      // Still include in deepDives list
      generated.push({
        slug,
        title: article.title,
        date: new Date(article.pubDate).toISOString().split("T")[0],
        readTime: estimateReadTime(article.content || article.description),
        tags: article.categories.slice(0, 4),
        preview: article.description.replace(/<[^>]*>/g, "").slice(0, 200),
      });
      continue;
    }

    console.log(`Generating: ${slug}`);
    const pageContent = generatePageContent(article);
    fs.writeFileSync(filePath, pageContent);
    generated.push({
      slug,
      title: article.title,
      date: new Date(article.pubDate).toISOString().split("T")[0],
      readTime: estimateReadTime(article.content || article.description),
      tags: article.categories.slice(0, 4),
      preview: article.description.replace(/<[^>]*>/g, "").slice(0, 200),
    });
  }

  // Also keep the Living LLM article if not in RSS
  const hasLivingLlm = generated.some(
    (d) => d.slug === "living-llm-neurotransmitter-memory"
  );
  if (!hasLivingLlm) {
    generated.unshift({
      slug: "living-llm-neurotransmitter-memory",
      title:
        "What If Your LLM Could Remember You? Building a Neurotransmitter-Inspired Memory System for Local Language Models",
      date: "2026-03-19",
      readTime: "15 min read",
      tags: ["AI", "LLM", "Neuroscience", "Python"],
      preview:
        "How I drew on neuroscience to give a locally-running Llama 3.1 persistent memory, a personal knowledge graph, and the ability to learn from its own conversations.",
    });
  }

  // Update BlogSection.tsx deepDives array
  console.log("\nUpdating BlogSection.tsx deepDives array...");
  updateBlogSection(generated);

  // Update blogs/index.tsx posts array
  const indexPath = path.join(BLOGS_DIR, "index.tsx");
  if (fs.existsSync(indexPath)) {
    let indexContent = fs.readFileSync(indexPath, "utf-8");
    const postsStr = JSON.stringify(generated, null, 2)
      .replace(/"([^"]+)":/g, "$1:")
      .replace(/"/g, '"');
    const postsRegex = /const posts: BlogPost\[\] = \[[\s\S]*?\];/;
    indexContent = indexContent.replace(
      postsRegex,
      `const posts: BlogPost[] = ${postsStr};`
    );
    fs.writeFileSync(indexPath, indexContent);
    console.log("Updated blogs/index.tsx posts array");
  }

  console.log(`\nDone! Generated ${generated.length} deep dive pages.`);
  console.log("Files created in pages/blogs/:");
  generated.forEach((d) => console.log(`  - ${d.slug}.tsx`));
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
