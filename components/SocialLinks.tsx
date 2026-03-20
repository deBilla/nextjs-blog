import React from "react";
import data from "../data/portfolio.json";

const icons: Record<string, JSX.Element> = {
  Github: (
    <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  ),
  LinkedIn: (
    <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  Blog: (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
    </svg>
  ),
  Email: (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  ResearchGate: (
    <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19.586 0c-1.37 0-2.573.81-3.109 1.986h-.002C15.96 3.16 15.66 4.574 15.66 6.06c0 1.487.3 2.9.815 4.073.536 1.176 1.74 1.986 3.11 1.986 1.37 0 2.573-.81 3.109-1.986.515-1.174.815-2.586.815-4.073 0-1.487-.3-2.9-.815-4.074C22.159.81 20.956 0 19.586 0zm0 10.238c-.584 0-1.108-.41-1.398-1.048-.32-.704-.505-1.675-.505-2.73 0-1.054.185-2.025.505-2.73.29-.637.814-1.048 1.398-1.048.585 0 1.109.41 1.399 1.049.32.704.505 1.675.505 2.73 0 1.054-.185 2.025-.505 2.73-.29.637-.814 1.047-1.399 1.047zM9.586 5.71H7.088v1.64h2.498c.672 0 1.216-.503 1.216-1.12v-.4c0-.617-.544-1.12-1.216-1.12zM6.16 24h3.372c.354 0 .641-.287.641-.641v-.359a.641.641 0 00-.641-.641H7.088V18.41h2.498c2.063 0 3.734-1.544 3.734-3.448v-.4c0-1.904-1.671-3.449-3.734-3.449H5.234a.926.926 0 00-.926.926V23.074c0 .512.415.926.926.926z" />
    </svg>
  ),
};

interface SocialLinksProps {
  className?: string;
  size?: "sm" | "md";
}

const SocialLinks: React.FC<SocialLinksProps> = ({ className, size = "sm" }) => {
  return (
    <div className={`flex gap-1 ${className || ""}`}>
      {data.socials.map((social) => (
        <a
          key={social.id}
          href={social.link}
          target="_blank"
          rel="noreferrer"
          className={`rounded-xl transition-all duration-200
            text-gray-500 dark:text-gray-500
            hover:text-brand-500 dark:hover:text-brand-400
            hover:bg-brand-500/10
            active:scale-90
            ${size === "md" ? "p-3" : "p-2.5"}`}
          title={social.title}
        >
          {icons[social.title] || (
            <span className="text-xs font-medium">{social.title}</span>
          )}
        </a>
      ))}
    </div>
  );
};

export default SocialLinks;
