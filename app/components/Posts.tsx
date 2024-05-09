import React from "react";
import Card from "./Card";

export type Post = {
  pubDate: Date;
  link: string;
  title: string;
  body: string;
  author: string;
  thumbnail: string;
  description: string;
  content: string;
  enclosure: any;
  categories: string[];
};

export type MediumResponse = {
  status: string;
  feed: any;
  items: Post[];
};

const Posts = async () => {
  const res = await fetch(
    "https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@billa-code",
    { cache: "no-cache" }
  );
  const mediumResponse: MediumResponse = await res.json();
  const posts = mediumResponse.items;

  return (
    <div className="flex flex-wrap">
      {posts.map((post) => {
        return <Card key={post.link} post={post} />;
      })}
    </div>
  );
};

export default Posts;
