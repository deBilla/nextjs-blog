import React from "react";
import Link from "next/link";
import { RSSObject } from "./Posts";
import Image from "next/image";

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
          <Image src={rssObject?.media?.thumbnail?.url} alt={""} />
        </figure>
        <h4 className="text-left m-4">{rssObject.author}</h4>
      </div>
    </Link>
  );
};

export default Card;
