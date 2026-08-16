import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string().min(1),
    date: z.coerce.date(),
    /** Short summary used on listings, meta description, RSS, and OG cards. */
    preview: z.string().min(1),
    /**
     * Set when the canonical version lives on Medium. Empty strings are
     * normalised away so templates only ever see a URL or undefined.
     */
    mediumUrl: z
      .string()
      .transform((v) => (v.trim() === "" ? undefined : v.trim()))
      .pipe(z.string().url().optional())
      .optional(),
    /** Optional override; otherwise reading time is computed from the body. */
    readTime: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    /** Points elsewhere when this post was first published on another site. */
    canonicalUrl: z.string().url().optional(),
  }),
});

export const collections = { blog };
