import React from "react";
import Head from "next/head";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import data from "../../data/portfolio.json";
import { getBlogBySlug, getBlogSlugs } from "../../utils/api";
import markdownToHtml from "../../utils/markdownToHtml";
import type { GetStaticProps, GetStaticPaths } from "next";

interface BlogPostPageProps {
  post: {
    slug: string;
    title: string;
    date: string;
    readTime: string;
    preview: string;
    mediumUrl?: string;
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

      <Navbar />

      <article className="max-w-2xl mx-auto px-6 pt-8 pb-20">
        <Link href="/blogs">
          <a className="text-sm text-gray-400 hover:text-gray-600">
            &larr; Back to blogs
          </a>
        </Link>

        <h1 className="mt-6 text-2xl md:text-3xl font-bold leading-tight tracking-tight">
          {post.title}
        </h1>

        <div className="mt-2 flex items-center gap-3 text-sm text-gray-400">
          <span>
            {new Date(post.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          <span>·</span>
          <span>{post.readTime} read</span>
          {post.mediumUrl && (
            <>
              <span>·</span>
              <a
                href={post.mediumUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600"
              >
                Read on Medium
              </a>
            </>
          )}
        </div>

        <hr className="mt-6 border-gray-200" />

        <div
          className="markdown-class prose prose-lg max-w-none mt-8
            prose-headings:font-bold prose-headings:tracking-tight
            prose-a:text-gray-900 prose-a:underline hover:prose-a:text-gray-500
            prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
            prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200
            prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <Footer />
      </article>
    </>
  );
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const post = getBlogBySlug(params!.slug as string, [
    "slug",
    "title",
    "date",
    "readTime",
    "preview",
    "mediumUrl",
    "content",
  ]);
  const content = await markdownToHtml(post.content || "");
  return { props: { post: { ...post, content } } };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = getBlogSlugs();
  return {
    paths: slugs.map((slug) => ({
      params: { slug: slug.replace(/\.md$/, "") },
    })),
    fallback: false,
  };
};

export default BlogPost;
