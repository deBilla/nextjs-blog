import React from "react";
import { Movie } from "./Movies";
import Link from "next/link";

interface CardProps {
  movie: Movie;
}

const MovieCard: React.FC<CardProps> = ({ movie }) => {
  return (
    <Link href={movie.link}>
      <div className="card w-96 bg-base-100 shadow-xl m-4">
        <div className="card-body">
          <h2
            className="card-title"
            dangerouslySetInnerHTML={{ __html: movie.title }}
          />
          <p>{movie.body}</p>
        </div>
        <figure>
          <img src={movie?.enclosure?.link} />
        </figure>
        <p className="text-center m-4">{movie.categories.toString()}</p>
        <h4 className="text-left m-4">{movie.author}</h4>
      </div>
    </Link>
  );
};

export default MovieCard;
