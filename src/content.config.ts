import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string().min(1),
    date: z.coerce.date(),
    /** Short summary used on listings, RSS, OG cards, and as the on-page lede. */
    preview: z.string().min(1),
    /**
     * Meta-description override. Set this when `preview` reads well on the page
     * but is too long or too terse for a search result (aim for 110-155 chars).
     */
    description: z.string().min(1).optional(),
    /** Last substantive edit. Feeds `dateModified` and the sitemap's lastmod. */
    updated: z.coerce.date().optional(),
    /**
     * Set when the canonical version lives on Medium. Empty strings are
     * normalised away so templates only ever see a URL or undefined.
     */
    mediumUrl: z
      .string()
      .transform((v) => (v.trim() === "" ? undefined : v.trim()))
      .pipe(z.url().optional())
      .optional(),
    /** Optional override; otherwise reading time is computed from the body. */
    readTime: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    /** Points elsewhere when this post was first published on another site. */
    canonicalUrl: z.url().optional(),
    /**
     * Overrides the word-count heuristic in `isSyndicatedStub`. Set false on a
     * post that is genuinely short but complete, so it is not mistaken for a
     * truncated summary of the Medium copy.
     */
    syndicated: z.boolean().optional(),
  }),
});

export const collections = { blog };
