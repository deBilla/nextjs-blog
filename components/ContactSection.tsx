import React from "react";
import SocialLinks from "./SocialLinks";

const ContactSection: React.FC = () => {
  return (
    <section id="contact" className="py-24 lg:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <div className="card p-10 md:p-16 text-center">
          <p className="section-overline">Contact</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            Have a project?{" "}
            <span className="text-gradient">Let&apos;s talk.</span>
          </h2>
          <p className="mt-4 text-base text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
            I&apos;m always open to discussing platform architecture, distributed
            systems, AI infrastructure, or open-source collaboration.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:dimuthu.billa@gmail.com"
              className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold text-white
                bg-gradient-to-r from-brand-500 to-purple-500
                hover:from-brand-400 hover:to-purple-400
                shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30
                transition-all duration-300 active:scale-[0.97]"
            >
              dimuthu.billa@gmail.com
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <SocialLinks size="md" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
