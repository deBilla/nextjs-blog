import portfolio from "../data/portfolio.json";
import { SITE } from "../site";

/**
 * JSON-LD building blocks. Every graph on the site points at the same `@id`s,
 * so search engines resolve one Person and one WebSite across all pages rather
 * than a separate copy per URL.
 */

export const PERSON_ID = `${SITE.url}/#person`;
export const SITE_ID = `${SITE.url}/#website`;

// Trailing slash stripped so these match the canonical URLs exactly.
const abs = (path: string) => new URL(path, SITE.url).href.replace(/\/$/, "");

/** Public profiles that corroborate the Person entity. */
const sameAs = portfolio.socials
  .filter((s) => !s.link.startsWith("mailto:"))
  .map((s) => s.link);

export const person = {
  "@type": "Person",
  "@id": PERSON_ID,
  name: SITE.author,
  url: SITE.url,
  jobTitle: portfolio.resume.tagline,
  description: portfolio.resume.description,
  sameAs,
};

export const website = {
  "@type": "WebSite",
  "@id": SITE_ID,
  url: SITE.url,
  name: SITE.name,
  description: SITE.description,
  inLanguage: "en",
  publisher: { "@id": PERSON_ID },
};

/** Wraps nodes in a single `@graph` document, ready for `JSON.stringify`. */
export function graph(...nodes: Array<Record<string, unknown>>) {
  return { "@context": "https://schema.org", "@graph": nodes };
}

/** A breadcrumb trail. Pass `[label, path]` pairs from the root downwards. */
export function breadcrumbs(trail: Array<[string, string]>) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map(([name, path], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: abs(path),
    })),
  };
}
