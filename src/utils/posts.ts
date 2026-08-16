import { getCollection, type CollectionEntry } from "astro:content";

export type Post = CollectionEntry<"blog">;

const WORDS_PER_MINUTE = 220;

/**
 * Posts that only summarise an article published elsewhere. They are shown
 * with a "published on Medium" affordance instead of pretending to be the
 * canonical copy.
 */
export function isSyndicatedStub(post: Post): boolean {
  if (!post.data.mediumUrl) return false;
  return countWords(post.body ?? "") < 400;
}

export function countWords(body: string): number {
  return body.split(/\s+/).filter(Boolean).length;
}

export function readingTime(post: Post): string {
  if (post.data.readTime) return post.data.readTime;
  const minutes = Math.max(1, Math.round(countWords(post.body ?? "") / WORDS_PER_MINUTE));
  return `${minutes} min read`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** All published posts, newest first. Drafts are excluded from production. */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection("blog", ({ data }) =>
    import.meta.env.PROD ? data.draft !== true : true
  );
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** Groups posts by year for the archive listing. */
export function groupByYear(posts: Post[]): Array<[string, Post[]]> {
  const groups = new Map<string, Post[]>();
  for (const post of posts) {
    const year = String(post.data.date.getUTCFullYear());
    const bucket = groups.get(year);
    if (bucket) bucket.push(post);
    else groups.set(year, [post]);
  }
  return [...groups.entries()].sort((a, b) => Number(b[0]) - Number(a[0]));
}
