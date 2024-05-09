import React from "react";
import { Post } from "../posts/page";
import Card from "./Card";

type PostsProps = {
  posts: Post[];
}

const Posts: React.FC<PostsProps> = ({posts}) => {
  return (
    <div className="flex flex-wrap">
      {posts.map((post) => {
        return <Card post={post} />;
      })}
    </div>
  );
};

export default Posts;
