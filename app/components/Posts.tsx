import React from "react";
import Card from "./Card";
import parse from "rss-to-json";

export type RSSThumbnail = {
  medium: string;
  url: string;
}

export type RSSMedia = {
  thumbnail: RSSThumbnail;
}

export type RSSObject = {
  id: string;
  title: string;
  description: string;
  link: string;
  author: string;
  published: number;
  created: number;
  category: string[];
  content: string;
  enclosure: any;
  media: RSSMedia;
};

export type RSSResponse = {
  title: string;
  description: any;
  link: string;
  image: string;
  category: any[];
  items: RSSObject[];
};


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
