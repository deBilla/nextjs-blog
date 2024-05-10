import React from "react";
import Card from "./Card";
import MovieCard from "./MovieCard";

export type Movie = {
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

export type TwitterResponse = {
  status: string;
  feed: any;
  items: Movie[];
};

const Movies = async () => {
  const res = await fetch(
    "https://api.rss2json.com/v1/api.json?rss_url=https://rss.app/feeds/GAiIchqg3LbdUi1c.xml",
    { cache: "no-cache" }
  );
  const twitterResponse: TwitterResponse = await res.json();
  const posts = twitterResponse.items;

  return (
    <div className="flex flex-wrap">
      {posts.map((post) => {
        return <MovieCard key={post.link} movie={post} />;
      })}
    </div>
  );
};

export default Movies;
