import React from "react";
import MovieCard from "./MovieCard";
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

const Movies = async () => {
  const rssResponse: RSSResponse = await parse("https://rss.app/feeds/GAiIchqg3LbdUi1c.xml");
  const rss2Response: RSSResponse = await parse("https://rss.app/feeds/0C8Oov0tMBss0rWl.xml");
  const rss3Response: RSSResponse = await parse("https://rss.app/feeds/4I0piqtTJS26oPhI.xml");
  const rss4Response: RSSResponse = await parse("https://rss.app/feeds/ixmh9NVBJpzUDgdw.xml");
  const movies: RSSObject[] = [...rssResponse.items, ...rss2Response.items, ...rss3Response.items, ...rss4Response.items];

  return (
    <div className="flex flex-wrap">
      {movies.map((movie) => {
        return <MovieCard key={movie.link} movie={movie} />;
      })}
    </div>
  );
};

export default Movies;
