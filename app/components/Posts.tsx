import React from "react";
import Card from "./Card";
import parse from "rss-to-json";
import { RSSObject, RSSResponse } from "./Movies";

const Posts = async () => {
  const mediumResponse: RSSResponse = await parse('https://medium.com/feed/@billa-code');
  const posts: RSSObject[] = mediumResponse.items;

  return (
    <div className="flex flex-wrap">
      {posts.map((post) => {
        return <Card key={post.id} rssObject={post} />;
      })}
    </div>
  );
};

export default Posts;
