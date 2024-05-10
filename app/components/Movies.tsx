import React from "react";
import MovieCard from "./MovieCard";
import parse from "rss-to-json";

type RSSThumbnail = {
  medium: string;
  url: string;
}

type RSSMedia = {
  thumbnail: RSSThumbnail;
}

export type Movie = {
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
  items: Movie[];
};

const Movies = async () => {
  const rssResponse: RSSResponse = await parse("https://rss.app/feeds/GAiIchqg3LbdUi1c.xml");
  const movies: Movie[] = rssResponse.items;

  return (
    <div className="flex flex-wrap">
      {movies.map((movie) => {
        return <MovieCard key={movie.link} movie={movie} />;
      })}
    </div>
  );
};

export default Movies;
