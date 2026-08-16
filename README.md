# billacode.org

Personal site and blog for Dimuthu Wickramanayake. Astro, static output, deployed to
Cloudflare Pages.

## Running it

```bash
nvm use          # Node 22, per .nvmrc
npm install
npm run dev      # http://localhost:4321
```

| Command         | Does                                          |
| --------------- | --------------------------------------------- |
| `npm run dev`   | Dev server with hot reload                    |
| `npm run build` | Static build into `dist/`                     |
| `npm run check` | Type + template checking (runs in CI)         |
| `npm run preview` | Serve the built `dist/` locally             |

## Writing a post

Add a Markdown file to `src/content/blog/`. **The filename becomes the URL**, so
`src/content/blog/my-post.md` is served at `/blogs/my-post`. Renaming a file breaks its
links — don't rename published posts.

```markdown
---
title: "The title, in sentence case"
date: "2026-08-16"
preview: "One or two sentences. Used on listings, the meta description, RSS, and the social card."
tags: ["kubernetes"]        # optional
mediumUrl: "https://..."    # optional — see below
draft: true                 # optional; hidden from production builds
---

Body starts here. No `# H1` — the title above becomes the H1.
```

The frontmatter is validated by a schema in `src/content.config.ts`, so a typo or a
missing field fails the build rather than shipping a broken page.

Reading time is computed from the body. `readTime` in frontmatter overrides it.

### Posts that also live on Medium

Set `mediumUrl`. Behaviour depends on how much content is actually here:

- **Under 400 words** — treated as a summary. The page shows a "the full article is on
  Medium" notice, and its canonical URL points at Medium so the two copies don't compete
  in search.
- **A full post** — stays canonical here, with a quiet "also published on Medium" line at
  the end. This is the direction worth moving in: publish here first, syndicate second.

Six of the current posts are summaries. Filling them in and flipping the canonical back
to this domain is the single highest-leverage thing you can do for search.

## Structure

```
src/
  content/blog/       posts (filename = URL slug)
  content.config.ts   frontmatter schema
  data/portfolio.json CV + project data — the only source for /cv and /about
  pages/              routes; og/ generates social cards at build time
  layouts/            BaseLayout (chrome) and PostLayout (article furniture)
  components/         header, footer, theme toggle, post list, TOC
  styles/global.css   design tokens, typography, prose, print styles
  site.ts             site metadata, nav, GA measurement ID
```

Updating the CV means editing `src/data/portfolio.json` — nothing in `cv.astro` is
hardcoded. `/cv` has a print stylesheet, so "Print / Save as PDF" produces a clean
document with no site chrome.

## Design notes

- Inter for UI, Source Serif 4 for article prose, system mono for code. Fonts are
  self-hosted and subset by Astro's font pipeline, so there are no third-party requests.
- Light and dark themes follow the system preference until the reader picks one, which is
  then stored. The choice is applied before first paint to avoid a flash.
- Colours are OKLCH tokens in `:root`. To reskin the site, edit the token blocks at the
  top of `global.css` — the light palette is the base and dark overrides only the tokens.
- Social cards are generated per post at build time (`src/utils/og.ts`, satori + sharp)
  with the font embedded, so they render identically wherever the build runs.

## Deploying

Pushes to `main` build and deploy via `.github/workflows/deploy.yml`. Pull requests build
and typecheck but do not deploy.

Two repository secrets are required:

| Secret                  | Where to get it                                              |
| ----------------------- | ------------------------------------------------------------ |
| `CLOUDFLARE_API_TOKEN`  | Cloudflare dashboard → My Profile → API Tokens, with the "Cloudflare Pages — Edit" permission |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard → Workers & Pages, in the right sidebar  |

The Pages project must be named `billacode`, or update `--project-name` in the workflow.

`public/_headers` sets caching and security headers; `public/_redirects` forwards legacy
paths. Both are copied into `dist/` and read by Cloudflare Pages.
