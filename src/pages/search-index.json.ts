import type { APIRoute } from "astro";
import portfolio from "../data/portfolio.json";
import { formatDate, getPosts } from "../utils/posts";
import { chunkMarkdown, slugify, type Chunk } from "../utils/search-index";

/**
 * The static index behind "Ask the archive", emitted at build time.
 *
 * Fetched lazily on first use, never on page load — it is dead weight for the
 * majority of visitors who never open the search box.
 */
export const GET: APIRoute = async () => {
  const chunks: Chunk[] = [];

  for (const post of await getPosts()) {
    const when = formatDate(post.data.date).replace(/^\d+ /, "");
    for (const { heading, text } of chunkMarkdown(post.body ?? "")) {
      chunks.push({
        t: text,
        d: post.data.title,
        u: `/blogs/${post.id}${heading ? `#${slugify(heading)}` : ""}`,
        ...(heading ? { h: heading } : {}),
        w: when,
      });
    }
  }

  // The résumé, from the public summary only — no achievement bullets. Each
  // role is one passage so "where does he work" returns the role, not a
  // fragment of one.
  const { resume } = portfolio;

  chunks.push({
    t:
      `${portfolio.name} is ${resume.tagline}, based in ${resume.location}. ` +
      `${resume.description}`,
    d: "Resume",
    u: "/resume",
    h: "Summary",
    k: "resume",
  });

  resume.experiences.forEach((job, i) => {
    const current = i === 0;
    chunks.push({
      // Written out in the vocabulary people search with — "job", "role",
      // "employer", "currently" — because none of those words appear in a
      // résumé otherwise, and BM25 can only match words that are present.
      t:
        `${current ? "Current job and employer. Currently works" : "Previously worked"} ` +
        `as ${job.position} at ${job.company}, ${job.dates}, based in ${job.location}. ` +
        `${job.context}. This role is part of his work experience and employment history. ` +
        `The detailed project work and achievements for this position are available on ` +
        `request from the resume page.`,
      d: "Resume",
      u: "/resume",
      h: `${job.company} — ${job.position}`,
      k: "resume",
    });
  });

  chunks.push({
    t:
      `Skills, technologies and tools he knows and works with. ` +
      resume.skills.map((group) => `${group.label}: ${group.items.join(", ")}.`).join(" "),
    d: "Resume",
    u: "/resume",
    h: "Skills",
    k: "resume",
  });

  for (const project of resume.selectedWork) {
    chunks.push({
      t: `${project.title} — ${project.description} One of his selected projects.`,
      d: "Selected work",
      u: "/resume",
      h: project.title,
      k: "resume",
    });
  }

  chunks.push({
    t:
      `Education and degree: ${resume.education.universityPara}, ` +
      `${resume.education.universityName}, ${resume.education.universityDate}. ` +
      `Where he studied at university.`,
    d: "Resume",
    u: "/resume",
    h: "Education",
    k: "resume",
  });

  return new Response(JSON.stringify({ chunks }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
};
