import type { APIRoute } from "astro";
import { getChunks } from "../utils/search-corpus";

/**
 * The static index behind "Ask the archive", emitted at build time.
 *
 * Fetched lazily on first use, never on page load — it is dead weight for the
 * majority of visitors who never open the search box.
 *
 * Callers request it with `?v=<content hash>`, so a change to any post produces
 * a different URL rather than waiting out a TTL.
 *
 * The caching header lives in `public/_headers`, not here: this route is
 * prerendered to a static file, and Pages serves those with its own defaults —
 * anything set on this Response is discarded.
 */
export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ chunks: await getChunks() }), {
    headers: {
      "Content-Type": "application/json",
    },
  });
};
