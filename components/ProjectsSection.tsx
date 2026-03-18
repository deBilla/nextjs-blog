import React from "react";
import data from "../data/portfolio.json";

const ProjectsSection: React.FC = () => {
  const apps = (data as any).apps || [];

  return (
    <section id="projects" className="py-24 lg:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <p className="section-overline">Work</p>
        <h2 className="section-title mb-12">
          Open source &amp; <span className="text-gradient">projects</span>
        </h2>

        {/* Project grid — featured item spans 2 cols */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.projects.map((project: any, i: number) => (
            <a
              key={project.id}
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`card group overflow-hidden flex flex-col ${
                i === 0 ? "md:col-span-2 md:row-span-2" : ""
              }`}
            >
              {/* Image */}
              <div
                className={`overflow-hidden ${
                  i === 0 ? "h-56 md:h-72 lg:h-80" : "h-40"
                }`}
              >
                <img
                  alt={project.title}
                  src={project.imageSrc}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col">
                {/* Tags */}
                {project.tags && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {project.tags.map((tag: string) => (
                      <span key={tag} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <h3 className="font-semibold text-base group-hover:text-brand-400 transition-colors duration-300">
                  {project.title}
                </h3>
                <p
                  className={`mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400 ${
                    i === 0 ? "" : "line-clamp-2"
                  }`}
                >
                  {project.description}
                </p>

                <span className="mt-auto pt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-400 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                  View project
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </div>
            </a>
          ))}
        </div>

        {/* Live Apps */}
        {apps.length > 0 && (
          <div className="mt-16">
            <p className="section-overline">Live Apps</p>
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
        )}
      </div>
    </section>
  );
};

export default ProjectsSection;
