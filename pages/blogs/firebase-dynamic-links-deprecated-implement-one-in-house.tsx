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
        <title>Firebase dynamic links deprecated — Implement one in house — {data.name}</title>
        <meta name="description" content="

Creating a dynamic link is not that of a hard task, you would have a link which need to be shortened, so we map this shortened URL with…
Continue reading on S" />
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
            {["deferred-deep-link","deeplink","firebasedynamiclinks"].map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight">
            Firebase dynamic links deprecated — Implement one in house
          </h1>

          <div className="mt-4 flex items-center gap-3 text-xs font-mono text-gray-400 dark:text-gray-600">
            <span>June 10, 2025</span>
            <span className="w-1 h-1 rounded-full bg-gray-600" />
            <span>1 min read</span>
            <span className="w-1 h-1 rounded-full bg-gray-600" />
            <a href="https://blog.stackademic.com/firebase-dynamic-links-deprecated-implement-one-in-house-b6c788205f13?source=rss-46f1692aa552------2" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline">
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
            dangerouslySetInnerHTML={{ __html: `<div class="medium-feed-item">
<p class="medium-feed-image"><a href="https://blog.stackademic.com/firebase-dynamic-links-deprecated-implement-one-in-house-b6c788205f13"><img src="https://cdn-images-1.medium.com/max/873/1*DZWD-XVR79RRqp8dhA258Q.png" width="873"/></a></p>
<p class="medium-feed-snippet">Creating a dynamic link is not that of a hard task, you would have a link which need to be shortened, so we map this shortened URL with…</p>
<p class="medium-feed-link"><a href="https://blog.stackademic.com/firebase-dynamic-links-deprecated-implement-one-in-house-b6c788205f13">Continue reading on Stackademic »</a></p>
</div>` }}
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
