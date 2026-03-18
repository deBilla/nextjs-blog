import React from "react";
import SocialLinks from "./SocialLinks";
import data from "../data/portfolio.json";

const HeroSection: React.FC = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center pt-16">
      <div className="max-w-6xl mx-auto px-6 w-full">
        <div className="max-w-3xl">
          {/* Overline */}
          <p className="opacity-0 animate-fade-up text-sm font-mono text-brand-400 mb-6">
            Hi, I&apos;m Dimuthu
          </p>

          {/* Name */}
          <h1 className="opacity-0 animate-fade-up-delay-1 text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
            {data.headerTaglineOne}
          </h1>

          {/* Gradient tagline */}
          <h2 className="opacity-0 animate-fade-up-delay-2 text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mt-2">
            <span className="text-gradient">{data.headerTaglineTwo}</span>
          </h2>

          {/* Continuation */}
          {data.headerTaglineThree && (
            <h2 className="opacity-0 animate-fade-up-delay-2 text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mt-2 text-gray-700 dark:text-gray-300">
              {data.headerTaglineThree}
            </h2>
          )}

          {/* Description */}
          <p className="opacity-0 animate-fade-up-delay-3 mt-8 text-lg md:text-xl leading-relaxed text-gray-500 dark:text-gray-400 max-w-2xl">
            7+ years building cloud-native microservices on Kubernetes, real-time
            streaming pipelines, and LLM-powered workflows across GCP &amp; AWS.
          </p>

          {/* CTAs */}
          <div className="opacity-0 animate-fade-up-delay-4 mt-10 flex flex-col sm:flex-row items-start gap-4">
            <a
              href="mailto:dimuthu.billa@gmail.com"
              className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold text-white
                bg-gradient-to-r from-brand-500 to-purple-500
                hover:from-brand-400 hover:to-purple-400
                shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30
                transition-all duration-300 active:scale-[0.97]"
            >
              Get in touch
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <SocialLinks className="mt-0.5" />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-2 text-gray-400 dark:text-gray-600">
          <span className="text-[10px] font-mono uppercase tracking-widest">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-gray-400 dark:from-gray-600 to-transparent" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
