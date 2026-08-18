// @ts-check
import { readdirSync, readFileSync } from "node:fs";
import { defineConfig, fontProviders } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { isStubBody } from "./src/utils/syndication.ts";

const SITE = "https://billacode.org";
const BLOG_DIR = new URL("./src/content/blog/", import.meta.url);

/**
 * Enough of each post's front matter to build the sitemap. Parsed straight off
 * disk because `astro:content` is not available inside the config, and the
 * values needed here (a date and a canonical URL) are plain quoted scalars.
 */
function readPosts() {
  return readdirSync(BLOG_DIR)
    .filter((name) => /\.mdx?$/.test(name))
    .map((name) => {
      const raw = readFileSync(new URL(name, BLOG_DIR), "utf8");
      const [, frontmatter = "", body = ""] =
        raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/) ?? [];
      const field = (/** @type {string} */ key) =>
        frontmatter.match(new RegExp(`^${key}:\\s*"?(.*?)"?\\s*$`, "m"))?.[1] || undefined;

      const syndicated = field("syndicated");

      return {
        url: `${SITE}/blogs/${name.replace(/\.mdx?$/, "")}`,
        lastmod: field("updated") ?? field("date"),
        draft: field("draft") === "true",
        // Mirrors `canonicalFor()`: an explicit override, or Medium when the
        // page here is only a summary of the article published there. An
        // explicit `syndicated` flag wins over the word-count heuristic.
        canonicalElsewhere: Boolean(
          field("canonicalUrl") ||
            (syndicated !== undefined
              ? syndicated === "true"
              : isStubBody(body, field("mediumUrl")))
        ),
      };
    });
}

const posts = readPosts();
/** URLs whose canonical lives on another domain do not belong in our sitemap. */
const excluded = new Set(
  posts.filter((p) => p.canonicalElsewhere || p.draft).map((p) => p.url)
);
/** @type {Map<string, string>} */
const lastmods = new Map();
for (const post of posts) {
  if (post.lastmod) lastmods.set(post.url, new Date(post.lastmod).toISOString());
}

export default defineConfig({
  site: SITE,
  trailingSlash: "never",

  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !excluded.has(page.replace(/\/$/, "")),
      serialize: (item) => {
        const lastmod = lastmods.get(item.url.replace(/\/$/, ""));
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
  ],

  build: {
    // Emit `/blogs/foo.html` rather than `/blogs/foo/index.html` so Cloudflare
    // serves the canonical extension-less URL without a redirect hop.
    format: "file",
  },

  markdown: {
    shikiConfig: {
      themes: { light: "github-light", dark: "github-dark-dimmed" },
      wrap: false,
    },
  },

  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "Inter",
      cssVariable: "--font-sans",
      weights: [400, 500, 600, 700],
      styles: ["normal"],
      subsets: ["latin"],
    },
    {
      provider: fontProviders.fontsource(),
      name: "Source Serif 4",
      cssVariable: "--font-serif",
      weights: [400, 600],
      styles: ["normal", "italic"],
      subsets: ["latin"],
    },
  ],
});
