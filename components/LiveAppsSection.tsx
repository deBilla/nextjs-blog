import React from "react";
import data from "../data/portfolio.json";

const LiveAppsSection: React.FC = () => {
  const apps = (data as any).apps || [];

  if (apps.length === 0) return null;

  return (
    <section id="live-apps" className="py-24 lg:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <p className="section-overline">Live</p>
        <h2 className="section-title mb-12">
          Apps in <span className="text-gradient">production</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {apps.map((app: any) => (
            <a
              key={app.id}
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card group p-5"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{app.emoji}</span>
                <div>
                  <h3 className="font-semibold group-hover:text-brand-400 transition-colors">
                    {app.title}
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-mono">
                    {app.url.replace("https://", "")}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                {app.description}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-400 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                Visit
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LiveAppsSection;
