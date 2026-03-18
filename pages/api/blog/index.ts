import fs from "fs";
import matter from "gray-matter";
import { join } from "path";
const uuidv4 = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
import { getRandomImage } from "../../../utils";
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
): void {
  const postsfolder = join(process.cwd(), `/_posts/${uuidv4()}.md`);
  if (process.env.NODE_ENV === "development") {
    if (req.method === "POST") {
      const data = matter.stringify("# New Blog", {
        date: new Date().toISOString(),
        title: "New Blog",
        tagline: "Amazing New Blog",
        preview:
          "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
        image: getRandomImage(),
      });
      fs.writeFileSync(postsfolder, data);
      res.status(200).json({ status: "CREATED" });
    }
    if (req.method === "DELETE") {
      const deleteFile = join(
        process.cwd(),
        `/_posts/${req.body.slug}.md`
      );
      fs.unlinkSync(deleteFile);
      res.status(200).json({ status: "DONE" });
    }
  } else {
    res
      .status(200)
      .json({ name: "This route works in development mode only" });
  }
}
