import type { APIRoute } from "astro";
import portfolio from "../data/portfolio.json";
import { canonicalFor, getPosts, isoDate, metaDescription } from "../utils/posts";
import { SITE } from "../site";

/**
 * /llms.txt — a plain-markdown map of the site for LLM crawlers, per the
 * llmstxt.org convention.
 *
 * Adoption is not established, and this may well amount to nothing. It costs a
 * build step and no maintenance, which is about the right investment for a
 * convention that might matter later: everything here is derived from the same
 * frontmatter that already feeds the sitemap and RSS, so it cannot go stale.
 *
 * Only public material appears. The résumé entry points at the summary page;
 * the withheld detail is not described here either.
 */
export const GET: APIRoute = async () => {
  const posts = await getPosts();
  const { resume } = portfolio;

  const lines: string[] = [
    `# ${portfolio.name}`,
    "",
    `> ${SITE.tagline}`,
    "",
    `${resume.description}`,
    "",
    "## Pages",
    "",
    `- [About](${SITE.url}/about): who I am and what I work on.`,
    `- [Resume](${SITE.url}/resume): roles, scope and stack. ${resume.experiences[0].position} at ${resume.experiences[0].company} since ${resume.experiences[0].dates.split("–")[0].trim()}. Full detail is available on request through the form on that page.`,
    `- [Writing](${SITE.url}/blogs): ${posts.length} posts.`,
    "",
    "## Writing",
    "",
  ];

  for (const post of posts) {
    const tags = post.data.tags.length ? ` [${post.data.tags.join(", ")}]` : "";
    lines.push(
      `- [${post.data.title}](${canonicalFor(post, SITE.url)}) — ${isoDate(post.data.date)}${tags}: ${metaDescription(post)}`
    );
  }

  lines.push("", "## Contact", "", `- ${SITE.url}/resume — request the full CV or get in touch.`, "");

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
