/**
 * The rule for "this post is only a summary of an article published elsewhere",
 * kept free of `astro:content` imports so `astro.config.mjs` can apply the same
 * rule when deciding which URLs belong in the sitemap.
 */

/** A post carrying a `mediumUrl` and fewer words than this is a summary stub. */
export const STUB_WORD_LIMIT = 400;

export function countWords(body: string): number {
  return body.split(/\s+/).filter(Boolean).length;
}

/** True when the canonical copy lives elsewhere and this page is just a teaser. */
export function isStubBody(body: string, mediumUrl?: string): boolean {
  if (!mediumUrl) return false;
  return countWords(body) < STUB_WORD_LIMIT;
}
