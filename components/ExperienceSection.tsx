import React from "react";
import data from "../data/portfolio.json";

const ExperienceSection: React.FC = () => {
  const { experiences, education, languages, frameworks, others } = data.resume;

  return (
    <section id="experience" className="py-24 lg:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <p className="section-overline">Background</p>
        <h2 className="section-title mb-12">
          Experience &amp; <span className="text-gradient">skills</span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-12">
          {/* Left column — Education + Skills */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            {/* Education */}
            <div className="mb-10">
              <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-500 mb-4">
                Education
              </h3>
              <div className="card p-5">
                <h4 className="font-semibold text-sm">
                  {education.universityName}
                </h4>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono">
                  {education.universityDate}
                </p>
                <p className="text-xs text-brand-400 mt-1.5">
                  {education.universityPara}
                </p>
              </div>
            </div>

            {/* Skills */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-500 mb-4">
                Skills
              </h3>
              <div className="card p-5 space-y-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-600 mb-2.5">
                    Languages
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {languages.map((l) => (
                      <span key={l} className="pill">{l}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-600 mb-2.5">
                    Frameworks
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {frameworks.map((f) => (
                      <span key={f} className="pill">{f}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-600 mb-2.5">
                    Infrastructure &amp; Tools
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {others.map((o) => (
                      <span key={o} className="pill">{o}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column — Work Experience */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-500 mb-4">
              Work Experience
            </h3>
            <div className="space-y-4">
              {experiences.map(({ id, dates, type, position, bullets }) => {
                const bulletsList = bullets.split(",").map((b) => b.trim());
                return (
                  <div key={id} className="card p-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 mb-4">
                      <h4 className="font-semibold">{position}</h4>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs font-mono text-gray-400 dark:text-gray-500">
                          {dates}
                        </span>
                        <span className="tag">{type}</span>
                      </div>
                    </div>
                    <ul className="space-y-2.5">
                      {bulletsList.map((bullet, idx) => (
                        <li
                          key={idx}
                          className="text-sm leading-relaxed flex items-start gap-3 text-gray-600 dark:text-gray-400"
                        >
                          <span
                            className="mt-2 w-1 h-1 rounded-full flex-shrink-0 bg-brand-500/50"
                          />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExperienceSection;
