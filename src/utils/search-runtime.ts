/**
 * BM25 retrieval, in the browser, over the passages shipped in
 * `/search-index.json`.
 *
 * The posting lists are built here rather than shipped, which trades ~30ms of
 * one-off CPU for ~100KB of transfer, and — more usefully — guarantees that
 * queries and documents are tokenised by the exact same function. An index
 * built with a different tokeniser than the one asking the questions is the
 * classic way for a search box to quietly return nothing.
 */
import { tokenize, type Chunk } from "./search-index";

// Standard BM25 parameters. k1 controls how fast term frequency saturates, b
// how strongly length is normalised; these are the usual defaults and there is
// no relevance-judgement set here to justify tuning them.
const K1 = 1.2;
const B = 0.75;

export interface Result {
  chunk: Chunk;
  score: number;
  /** Query terms present in this passage, for highlighting. */
  matched: Set<string>;
}

export interface Runtime {
  chunks: Chunk[];
  postings: Map<string, [number, number][]>;
  lengths: Int32Array;
  avgdl: number;
}

export function buildRuntime(chunks: Chunk[]): Runtime {
  const postings = new Map<string, [number, number][]>();
  const lengths = new Int32Array(chunks.length);
  let total = 0;

  chunks.forEach((chunk, i) => {
    // Title and heading are indexed with the body so that a query naming a post
    // finds it even when the words appear nowhere in the passage itself.
    const tokens = tokenize(`${chunk.d} ${chunk.h ?? ""} ${chunk.t}`);
    const freq = new Map<string, number>();
    for (const token of tokens) freq.set(token, (freq.get(token) ?? 0) + 1);

    for (const [term, tf] of freq) {
      const list = postings.get(term);
      if (list) list.push([i, tf]);
      else postings.set(term, [[i, tf]]);
    }

    lengths[i] = tokens.length;
    total += tokens.length;
  });

  return { chunks, postings, lengths, avgdl: total / Math.max(1, chunks.length) };
}

export function search(query: string, rt: Runtime, limit = 4): Result[] {
  const terms = [...new Set(tokenize(query))];
  if (!terms.length) return [];

  const scores = new Map<number, number>();
  const matched = new Map<number, Set<string>>();
  const N = rt.chunks.length;

  for (const term of terms) {
    const postings = rt.postings.get(term);
    if (!postings) continue;

    // Standard BM25 IDF. Terms in more than half the corpus go slightly
    // negative, which is the intended behaviour — they carry no signal.
    const idf = Math.log(1 + (N - postings.length + 0.5) / (postings.length + 0.5));

    for (const [i, tf] of postings) {
      const norm = tf * (K1 + 1) / (tf + K1 * (1 - B + (B * rt.lengths[i]) / rt.avgdl));
      scores.set(i, (scores.get(i) ?? 0) + idf * norm);
      const seen = matched.get(i);
      if (seen) seen.add(term);
      else matched.set(i, new Set([term]));
    }
  }

  const ranked = [...scores.entries()]
    .map(([i, score]) => ({
      chunk: rt.chunks[i],
      // Passages matching more of the query beat passages that repeat one term
      // of it, which single-term BM25 sums otherwise reward too heavily.
      score:
        score *
        (1 + 0.35 * ((matched.get(i)?.size ?? 1) - 1)),
      matched: matched.get(i) ?? new Set<string>(),
    }))
    .sort((a, b) => b.score - a.score);

  // One passage per document. Three excerpts from the same post are one
  // answer wearing three hats; a reader wants the best passage from each of
  // several sources.
  const seen = new Set<string>();
  const diverse = ranked.filter((r) => {
    if (seen.has(r.chunk.d)) return false;
    seen.add(r.chunk.d);
    return true;
  });

  return diverse.slice(0, limit);
}

/** Wrap matched terms in <mark>, escaping everything else. */
export function highlight(text: string, matched: Set<string>): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  if (!matched.size) return escaped;

  // Match on word prefixes so "caching" highlights when the stemmed term is
  // "cach". Sorted longest-first so the longest prefix wins.
  const prefixes = [...matched].sort((a, b) => b.length - a.length);
  const pattern = new RegExp(
    `\\b(${prefixes.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\w*`,
    "gi"
  );
  return escaped.replace(pattern, "<mark>$&</mark>");
}
