import React from "react";
import { Post } from "./Posts";

interface CardProps {
  post: Post;
}

const Card: React.FC<CardProps> = ({ post }) => {
  return (
    <div className="card w-96 bg-base-100 shadow-xl m-4">
      <div className="card-body">
        <h2 className="card-title" dangerouslySetInnerHTML={{ __html: post.title }} />
        <p>{post.body}</p>
      </div>
      <figure>
        <img src={post.thumbnail} />
      </figure>
      <p className="text-center m-4">{post.categories.toString()}</p>
      <h4 className="text-left m-4">{post.author}</h4>
    </div>
  );
};

export default Card;
