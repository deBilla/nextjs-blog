import React, { useEffect, useState } from "react";

interface GitHubRepo {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  topics: string[];
  updated_at: string;
  fork: boolean;
}

const languageColors: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Rust: "#dea584",
  Java: "#b07219",
  Go: "#00ADD8",
  Dart: "#00B4AB",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
  Jupyter: "#DA5B0B",
  "Jupyter Notebook": "#DA5B0B",
  Dockerfile: "#384d54",
  C: "#555555",
  "C++": "#f34b7d",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Ruby: "#701516",
  PHP: "#4F5D95",
};

const GitHubSection: React.FC = () => {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetch(
      "https://api.github.com/users/deBilla/repos?per_page=100&sort=updated&direction=desc"
    )
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Filter out forks, sort by stars then recent update
          const filtered = data
            .filter((r: GitHubRepo) => !r.fork)
            .sort(
              (a: GitHubRepo, b: GitHubRepo) =>
                b.stargazers_count - a.stargazers_count ||
                new Date(b.updated_at).getTime() -
                  new Date(a.updated_at).getTime()
            );
          setRepos(filtered);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const displayed = showAll ? repos : repos.slice(0, 9);

  return (
    <section id="repositories" className="py-24 lg:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <p className="section-overline">GitHub</p>
        <h2 className="section-title mb-4">
          Public <span className="text-gradient">repositories</span>
        </h2>
        <p className="text-gray-400 mb-12 max-w-xl">
          Open source work and side projects on GitHub.
        </p>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-2xl h-40 animate-pulse bg-gray-800/50"
              />
            ))}
          </div>
        ) : repos.length === 0 ? (
          <div className="text-center py-16 card">
            <p className="text-sm text-gray-400">
              Unable to load repositories. Visit{" "}
              <a
                href="https://github.com/deBilla"
                target="_blank"
                rel="noreferrer"
                className="text-brand-400 hover:underline"
              >
                github.com/deBilla
              </a>{" "}
              directly.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayed.map((repo) => (
                <a
                  key={repo.id}
                  href={repo.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="card group p-5 flex flex-col"
                >
                  {/* Repo name */}
                  <div className="flex items-start gap-2 mb-2">
                    <svg
                      className="w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                      />
                    </svg>
                    <h3 className="font-semibold text-sm group-hover:text-brand-400 transition-colors leading-tight">
                      {repo.name}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-xs leading-relaxed text-gray-500 line-clamp-2 flex-1 mb-3">
                    {repo.description || "No description"}
                  </p>

                  {/* Bottom row: language + stats */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {repo.language && (
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor:
                              languageColors[repo.language] || "#8b8b8b",
                          }}
                        />
                        {repo.language}
                      </span>
                    )}
                    {repo.stargazers_count > 0 && (
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                          />
                        </svg>
                        {repo.stargazers_count}
                      </span>
                    )}
                    {repo.forks_count > 0 && (
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                          />
                        </svg>
                        {repo.forks_count}
                      </span>
                    )}
                  </div>
                </a>
              ))}
            </div>

            {/* Show more / less */}
            {repos.length > 9 && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-brand-400 transition-colors"
                >
                  {showAll
                    ? `Show less`
                    : `Show all ${repos.length} repositories`}
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      showAll ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default GitHubSection;
