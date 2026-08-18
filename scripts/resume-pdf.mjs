/**
 * `npm run resume:pdf` — render the full CV to a PDF you can attach to a reply.
 *
 * Only works locally, and that is the point: the full document exists when
 * `src/data/resume-detail.json` is present, which it never is in CI. The public
 * build of the same page renders the summary plus the request form.
 *
 * Build + preview rather than the dev server, so the PDF comes from exactly the
 * bytes that ship — same fonts, same print CSS, no HMR client.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PORT = 4331;
const OUT = process.argv[2] ?? "resume.pdf";
const CHROME =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

if (!existsSync("src/data/resume-detail.json")) {
  console.error(
    "src/data/resume-detail.json is missing — this would render the public summary,\n" +
      "not the full CV. Restore the private file before generating a PDF."
  );
  process.exit(1);
}

if (!existsSync(CHROME)) {
  console.error(`Chrome not found at ${CHROME}. Set CHROME_PATH to override.`);
  process.exit(1);
}

const run = (cmd, args, opts = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", ...opts });
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))
    );
  });

/** Poll until the preview server answers, rather than sleeping a guessed interval. */
async function waitForServer(url, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`preview server never came up at ${url}`);
}

/**
 * Print one URL to a PDF.
 *
 * Headless Chrome writes the file and then, often as not, declines to exit —
 * so waiting on the process is a hang waiting to happen. Wait for the bytes on
 * disk to stop growing instead, then end the process ourselves.
 */
async function printPdf(url, out) {
  rmSync(out, { force: true });

  const child = spawn(
    CHROME,
    [
      "--headless",
      "--disable-gpu",
      "--no-first-run",
      "--disable-extensions",
      `--user-data-dir=${profile}`,
      "--no-pdf-header-footer",
      `--print-to-pdf=${out}`,
      url,
    ],
    { stdio: "ignore" }
  );

  try {
    const deadline = Date.now() + 90_000;
    let lastSize = -1;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 400));
      const size = existsSync(out) ? statSync(out).size : 0;
      if (size > 0 && size === lastSize) return; // written and stable
      lastSize = size;
    }
    throw new Error("Chrome never finished writing the PDF");
  } finally {
    child.kill();
  }
}

await run("npx", ["astro", "build"]);

const preview = spawn("npx", ["astro", "preview", "--port", String(PORT)], {
  stdio: "ignore",
});

const profile = mkdtempSync(join(tmpdir(), "resume-pdf-"));

try {
  await waitForServer(`http://localhost:${PORT}/resume`);
  await printPdf(`http://localhost:${PORT}/resume`, OUT);
  console.log(`\nWrote ${OUT}`);
} finally {
  preview.kill();
  // Chrome can still hold files in the profile for a moment after being killed;
  // a failed cleanup of a temp directory is not worth failing the run over.
  try {
    rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
  } catch {
    /* the OS will reap it from tmp */
  }
}
