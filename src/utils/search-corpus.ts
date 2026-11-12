import { createHash } from "node:crypto";
import { formatDate, getPosts } from "./posts";
import { chunkMarkdown, slugify, type Chunk } from "./search-index";

/**
 * The passages behind "Ask the archive", and a fingerprint of them.
 *
 * Both the endpoint that serves the index and the component that fetches it
 * need to agree on the version, so the corpus is built here once and memoised.
 * The fingerprint is a hash of the emitted passages, which means it changes
 * exactly when the content does — no more, no less.
 */
let cache: { chunks: Chunk[]; version: string } | null = null;

async function build(): Promise<{ chunks: Chunk[]; version: string }> {
  if (cache) return cache;

  const chunks: Chunk[] = [];

  for (const post of await getPosts()) {
    const when = formatDate(post.data.date).replace(/^\d+ /, "");
    for (const { heading, text } of chunkMarkdown(post.body ?? "")) {
      chunks.push({
        t: text,
        d: post.data.title,
        u: `/blogs/${post.id}${heading ? `#${slugify(heading)}` : ""}`,
        ...(heading ? { h: heading } : {}),
        w: when,
      });
    }
  }

  const version = createHash("sha1")
    .update(JSON.stringify(chunks))
    .digest("hex")
    .slice(0, 8);

  cache = { chunks, version };
  return cache;
}

export async function getChunks(): Promise<Chunk[]> {
  return (await build()).chunks;
}

/** Short content hash, used as a cache-busting query on the index URL. */
export async function getIndexVersion(): Promise<string> {
  return (await build()).version;
}
