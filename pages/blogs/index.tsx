import Head from "next/head";
import Link from "next/link";
import React from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import data from "../../data/portfolio.json";
import { getAllBlogs } from "../../utils/api";
import type { GetStaticProps } from "next";

interface BlogPost {
  slug: string;
  title: string;
  date: string;
  readTime: string;
}

interface BlogsIndexProps {
  posts: BlogPost[];
}

const BlogsIndex: React.FC<BlogsIndexProps> = ({ posts }) => {
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

export const getStaticProps: GetStaticProps = async () => {
  const posts = getAllBlogs(["slug", "title", "date", "readTime"]);
  return { props: { posts } };
};

export default BlogsIndex;
