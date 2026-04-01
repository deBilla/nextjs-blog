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
        <title>
          {post.title} — {data.name}
        </title>
        <meta name="description" content={post.preview} />
      </Head>

      <Navbar />

      <article className="max-w-2xl mx-auto px-6 pt-12 pb-20">
        <h1 className="text-2xl md:text-3xl font-bold leading-tight tracking-tight">
          {post.title}
        </h1>

        {post.tagline && (
          <p className="mt-2 text-sm text-gray-500">{post.tagline}</p>
        )}

        {post.date && (
          <p className="mt-2 text-xs text-gray-400">
            {new Date(post.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}

        <hr className="mt-6 border-gray-200" />

        <div
          className="prose prose-lg max-w-none mt-8
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
