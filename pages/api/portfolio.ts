import fs from "fs";
import { join } from "path";
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
): void {
  const portfolioData = join(process.cwd(), "/data/portfolio.json");
  if (process.env.NODE_ENV === "development") {
    if (req.method === "POST") {
      fs.writeFileSync(portfolioData, JSON.stringify(req.body), "utf-8");
    } else {
      res
        .status(200)
        .json({ name: "This route works in development mode only" });
    }
  }
}
