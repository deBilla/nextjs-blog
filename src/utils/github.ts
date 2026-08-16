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
export async function getTopRepos(limit = 6): Promise<Repo[]> {
  const token = process.env.GITHUB_TOKEN;

  try {
    const response = await fetch(
      `https://api.github.com/users/${USER}/repos?per_page=100&sort=updated`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "billacode.org-build",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    if (!response.ok) {
      console.warn(
        `[github] ${response.status} ${response.statusText} — skipping repo list.` +
          (response.status === 403 ? " Rate limited; set GITHUB_TOKEN to raise the limit." : "")
      );
      return [];
    }

    const repos = (await response.json()) as GitHubRepo[];

    return repos
      // A repo with no description renders as a bare name and language, which
      // reads as unfinished on the home page.
      .filter((repo) => !repo.fork && !repo.archived && repo.description?.trim())
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, limit)
      .map((repo) => ({
        name: repo.name,
        description: repo.description,
        url: repo.html_url,
        stars: repo.stargazers_count,
        language: repo.language,
      }));
  } catch (error) {
    console.warn("[github] fetch failed — skipping repo list:", error);
    return [];
  }
}
