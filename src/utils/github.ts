export interface Repo {
  name: string;
  description: string | null;
  url: string;
  stars: number;
  language: string | null;
}

interface GitHubRepo {
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  fork: boolean;
  archived: boolean;
}

const USER = "deBilla";

/**
 * Top repositories by star count, fetched at build time.
 *
 * Build-time rather than in the browser: visitors never hit GitHub's rate
 * limit, the list needs no client JS, and api.github.com stays out of the CSP.
 * The trade-off is that star counts only refresh on deploy.
 *
 * A GitHub outage must not break the build, so failures degrade to an empty
 * list and the section is simply omitted.
 */
const PER_PAGE = 100;
const MAX_PAGES = 5;

export async function getRepos(limit?: number): Promise<Repo[]> {
  const token = process.env.GITHUB_TOKEN;
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "billacode.com-build",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const collected: GitHubRepo[] = [];

  try {
    // The account has more than one page of repos, so walk until a short page
    // comes back. MAX_PAGES stops a pathological loop from stalling the build.
    for (let page = 1; page <= MAX_PAGES; page++) {
      const response = await fetch(
        `https://api.github.com/users/${USER}/repos?per_page=${PER_PAGE}&sort=updated&page=${page}`,
        { headers }
      );

      if (!response.ok) {
        console.warn(
          `[github] ${response.status} ${response.statusText} on page ${page}.` +
            (response.status === 403
              ? " Rate limited; set GITHUB_TOKEN to raise the limit."
              : "")
        );
        break;
      }

      const batch = (await response.json()) as GitHubRepo[];
      collected.push(...batch);
      if (batch.length < PER_PAGE) break;
    }
  } catch (error) {
    console.warn("[github] fetch failed:", error);
  }

  if (collected.length === 0) return [];

  const repos = collected
    .filter((repo) => !repo.fork && !repo.archived)
    .sort(
      (a, b) =>
        b.stargazers_count - a.stargazers_count ||
        // Described repos ahead of bare ones at the same star count.
        Number(Boolean(b.description?.trim())) - Number(Boolean(a.description?.trim())) ||
        a.name.localeCompare(b.name)
    )
    .map((repo) => ({
      name: repo.name,
      description: repo.description,
      url: repo.html_url,
      stars: repo.stargazers_count,
      language: repo.language,
    }));

  console.log(`[github] ${repos.length} repositories`);
  return limit ? repos.slice(0, limit) : repos;
}
