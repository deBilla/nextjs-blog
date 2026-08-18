import { getCollection, type CollectionEntry } from "astro:content";
import { countWords, isStubBody } from "./syndication";

export type Post = CollectionEntry<"blog">;

const WORDS_PER_MINUTE = 220;

export { countWords };

/**
 * Posts that only summarise an article published elsewhere. They are shown
 * with a "published on Medium" affordance instead of pretending to be the
 * canonical copy.
 */
export function isSyndicatedStub(post: Post): boolean {
  if (post.data.syndicated !== undefined) return post.data.syndicated;
  return isStubBody(post.body ?? "", post.data.mediumUrl);
}

/**
 * The URL search engines should treat as canonical for a post: an explicit
 * override, else Medium when this page is only a summary, else our own page.
 */
export function canonicalFor(post: Post, siteUrl: string): string {
  if (post.data.canonicalUrl) return post.data.canonicalUrl;
  if (isSyndicatedStub(post) && post.data.mediumUrl) return post.data.mediumUrl;
  return new URL(`/blogs/${post.id}`, siteUrl).href;
}

/** Meta description: the hand-written override when set, else the on-page lede. */
export function metaDescription(post: Post): string {
  return post.data.description ?? post.data.preview;
}

/** The date to advertise as last modified. */
export function modifiedDate(post: Post): Date {
  return post.data.updated ?? post.data.date;
}

export function readingTime(post: Post): string {
  // Hand-set values are written as "10 min"; computed ones read "10 min read".
  // Normalise so a listing never mixes the two forms.
  const override = post.data.readTime?.trim();
  if (override) return /read$/i.test(override) ? override : `${override} read`;
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
