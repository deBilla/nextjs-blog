import type { APIRoute } from "astro";
import { getChunks } from "../utils/search-corpus";

/**
 * The static index behind "Ask the archive", emitted at build time.
 *
 * Fetched lazily on first use, never on page load — it is dead weight for the
 * majority of visitors who never open the search box.
 *
 * Cached hard and forever: callers request it with a `?v=<content hash>`, so a
 * change to any post produces a different URL rather than waiting out a TTL.
 */
export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ chunks: await getChunks() }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
