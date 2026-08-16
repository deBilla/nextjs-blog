// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://billacode.org",
  trailingSlash: "never",

  integrations: [mdx(), sitemap()],

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
