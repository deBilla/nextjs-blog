/**
 * Build-time search index for "Ask the archive".
 *
 * Everything here runs during `astro build` and the output is a static JSON
 * file. There is no server and no model: retrieval is BM25 over passages, which
 * for a corpus this size (97 posts, ~100k words, ~800 passages) is both smaller
 * and faster than any embedding approach — a few hundred KB and well under a
 * millisecond to score.
 *
 * The résumé is indexed from the PUBLIC summary only. The achievement bullets in
 * `resume-detail.json` are deliberately withheld from the site, and shipping
 * them inside a machine-readable index would undo that far more thoroughly than
 * putting them back on the page.
 */

export interface Chunk {
  /** Passage text, shown verbatim as the answer. */
  t: string;
  /** Title of the containing document. */
  d: string;
  /** URL, including a heading anchor where one exists. */
  u: string;
  /** Sub-heading within the document, when the source had one. */
  h?: string;
  /** Display date, e.g. "Oct 2025". Absent for the résumé. */
  w?: string;
  /** "resume" marks the CV passages, which rank differently — see the runtime. */
  k?: "resume";
}

const STOPWORDS = new Set(
  ("a an and are as at be been but by for from had has have he her his how i if in into is it its" +
    " of on or our so that the their then there these they this to too was we were what when where" +
    " which who will with would you your")
    .split(" ")
);

/**
 * Lowercase, split on anything non-alphanumeric, drop stopwords and single
 * characters, and strip a couple of common suffixes.
 *
 * Deliberately not a real stemmer: Porter would collapse "caching" and "cache"
 * but also "universal" and "universe", and on a technical corpus the false
 * merges cost more than the recall gains. Identifiers like `height<=?720` and
 * `bv*+ba` survive as their alphanumeric parts, which is what people type.
 */
export function tokenize(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.toLowerCase().split(/[^a-z0-9]+/)) {
    if (raw.length < 2 || STOPWORDS.has(raw)) continue;
    out.push(raw.replace(/(ing|ers|es|s)$/, (m, _g, offset) => (offset > 3 ? "" : m)));
  }
  return out;
}

/** Strip the markdown that would otherwise be quoted back at the reader. */
function clean(markdown: string): string {
  return markdown
    // Fenced code: rarely reads as an answer, and it dominates the byte budget.
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^>\s?/gm, "")
    .replace(/[*_`#]/g, "")
    .replace(/\r/g, "");
}

/** GitHub-style heading anchor, so a result links to the exact section. */
export function slugify(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

const TARGET_WORDS = 110;
const MIN_WORDS = 25;

/**
 * Split a document into passages.
 *
 * Two eras of writing to cope with: posts from 2023 on are organised under `##`
 * headings, while the 2021–22 tutorials are a single unbroken run of prose. So
 * headings are used as boundaries when they exist, and paragraphs are packed
 * into ~110-word passages when they do not.
 */
export function chunkMarkdown(markdown: string): { heading?: string; text: string }[] {
  const body = clean(markdown);
  const out: { heading?: string; text: string }[] = [];

  const sections = body.split(/\n(?=##\s)/);

  for (const section of sections) {
    const headingMatch = section.match(/^##\s*(.+)$/m);
    const heading = headingMatch?.[1]?.trim();
    const text = heading ? section.replace(/^##\s*.+$/m, "") : section;

    let buffer: string[] = [];
    let words = 0;

    const flush = () => {
      if (!buffer.length) return;
      const joined = buffer.join(" ").replace(/\s+/g, " ").trim();
      if (joined.split(" ").length >= MIN_WORDS) out.push({ heading, text: joined });
      buffer = [];
      words = 0;
    };

    for (const para of text.split(/\n{2,}/)) {
      const p = para.replace(/\s+/g, " ").trim();
      if (!p) continue;
      const n = p.split(" ").length;
      // Overflowing the target is better than splitting mid-paragraph: a
      // passage that ends mid-thought reads as broken when quoted back.
      if (words + n > TARGET_WORDS && words > 0) flush();
      buffer.push(p);
      words += n;
    }
    flush();
  }

  return out;
}
