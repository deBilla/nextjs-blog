import React from "react";
import { RSSObject } from "./Movies";
import Link from "next/link";

interface CardProps {
  rssObject: RSSObject;
}

const Card: React.FC<CardProps> = ({ rssObject }) => {
  return (
    <Link href={rssObject.link}>
      <div className="card w-96 bg-base-100 shadow-xl m-4">
        <div className="card-body">
          <h2
            className="card-title"
            dangerouslySetInnerHTML={{ __html: rssObject.title }}
          />
        </div>
        <figure>
          <img src={rssObject?.media?.thumbnail?.url} />
        </figure>
        <h4 className="text-left m-4">{rssObject.author}</h4>
      </div>
    </Link>
  );
};

export default Card;
