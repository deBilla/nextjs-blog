import React from "react";
import { getPostBySlug, getAllPosts } from "../../utils/api";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Head from "next/head";
import data from "../../data/portfolio.json";
import type { GetStaticProps, GetStaticPaths } from "next";

interface BlogPostPageProps {
  post: {
    slug: string;
    title: string;
    date: string;
    tagline: string;
    preview: string;
    image: string;
    content: string;
  };
}

const BlogPost: React.FC<BlogPostPageProps> = ({ post }) => {
  return (
    <>
      <Head>
        <title>{post.title} — {data.name}</title>
        <meta name="description" content={post.preview} />
      </Head>

      <div className="bg-glow" />
      <div className="bg-glow-2" />

      <div className="relative z-10">
        <Navbar />

        <article className="max-w-3xl mx-auto px-6 pt-28 pb-20">
          {/* Hero image */}
          {post.image && (
            <div className="rounded-2xl overflow-hidden mb-10">
              <img
                className="w-full h-64 lg:h-80 object-cover"
                src={post.image}
                alt={post.title}
              />
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
            {post.title}
          </h1>

          {post.tagline && (
            <p className="mt-3 text-base text-gray-500 dark:text-gray-400">
              {post.tagline}
            </p>
          )}

          {post.date && (
            <p className="mt-4 text-xs font-mono text-gray-400 dark:text-gray-600">
              {new Date(post.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}

          {/* Divider */}
          <div
            className="mt-6 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(var(--accent), 0.2), transparent)",
            }}
          />

          {/* Content */}
          <div
            className="prose prose-lg dark:prose-invert max-w-none mt-8
              prose-headings:font-bold prose-headings:tracking-tight
              prose-a:text-brand-400 prose-a:no-underline hover:prose-a:underline
              prose-code:text-brand-300 prose-code:bg-gray-800/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
              prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-800
              prose-img:rounded-xl"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>

        <div className="max-w-3xl mx-auto px-6">
          <Footer />
        </div>
      </div>
    </>
  );
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const post = getPostBySlug(params!.slug as string, [
    "date",
    "slug",
    "preview",
    "title",
    "tagline",
    "preview",
    "image",
    "content",
  ]);
  return { props: { post: { ...post } } };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = getAllPosts(["slug"]);
  return {
    paths: posts.map((post) => ({ params: { slug: post.slug } })),
    fallback: false,
  };
};

export default BlogPost;
