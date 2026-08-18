import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Per-role achievement bullets — the part of the CV that is handed out on
 * request rather than published.
 *
 * The file is git-ignored, so it exists on Dimuthu's machine and nowhere else.
 * CI checks out a repo without it and builds the public summary; a local build
 * picks it up and renders the full document for `npm run resume:pdf`.
 *
 * Read through `fs` rather than `import` on purpose: a static import of a file
 * that is absent in CI fails the build, and the whole point is that the build
 * has to survive its absence.
 */
// Resolved against the project root, not `import.meta.url`: during `astro build`
// this module is bundled into a temporary chunk, so a URL relative to the module
// points at the build output and the file is never found — which silently
// published the summary from a machine that had the detail sitting right there.
const DETAIL_PATH = join(process.cwd(), "src/data/resume-detail.json");

function load(): Record<string, string[]> {
  // `RESUME_PUBLIC=1 npm run dev` previews what a visitor sees without having to
  // move the private file out of the way and remember to put it back.
  if (process.env.RESUME_PUBLIC === "1") return {};
  if (!existsSync(DETAIL_PATH)) return {};
  try {
    return JSON.parse(readFileSync(DETAIL_PATH, "utf8"));
  } catch (err) {
    // A malformed private file should not silently publish a thinner CV than
    // intended — say so loudly at build time, then carry on with the summary.
    console.warn(`[resume] ignoring unreadable resume-detail.json: ${err}`);
    return {};
  }
}

const detail = load();

/** Bullets for a company, or an empty list when running without the private file. */
export function bulletsFor(company: string): string[] {
  return detail[company] ?? [];
}

/** True when this build has the private detail — i.e. a local, full-CV build. */
export const hasDetail = Object.keys(detail).length > 0;
