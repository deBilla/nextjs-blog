import React from "react";
import data from "../data/portfolio.json";

const stats = [
  { label: "Years Experience", value: "7+" },
  { label: "Open Source Projects", value: "8+" },
  { label: "Published Libraries", value: "3" },
  { label: "Cloud Platforms", value: "GCP & AWS" },
];

const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-24 lg:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <p className="section-overline">About</p>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">
          {/* Bio text */}
          <div className="lg:col-span-3">
            <h2 className="section-title mb-6">
              Building systems that{" "}
              <span className="text-gradient">scale to millions</span>
            </h2>
            <p className="text-base md:text-lg leading-relaxed text-gray-600 dark:text-gray-400">
              {data.aboutpara}
            </p>
          </div>

          {/* Stats */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="card p-5 text-center"
                >
                  <p className="text-2xl md:text-3xl font-bold text-brand-500">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1.5 font-medium">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
