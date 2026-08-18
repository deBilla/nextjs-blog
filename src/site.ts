export const SITE = {
  name: "billacode",
  author: "Dimuthu Wickramanayake",
  url: "https://billacode.org",
  /** Home page <title>. Names the person and what they do, for search results. */
  title: "Dimuthu Wickramanayake — AI Platform & Agent Infrastructure Engineer",
  description:
    "Notes on AI platform and agent infrastructure, distributed systems, and reliability — by Dimuthu Wickramanayake.",
  /** Short "who is this" line, shown under the name in the sidebar. */
  tagline:
    "AI platform & agent infrastructure engineer. Notes on distributed systems, LLM tooling, and the things that break in production.",
  locale: "en",
} as const;

/** GA4 measurement ID. Only loaded in production builds. */
export const GA_ID = "G-JNMSN5FHDJ";

/** AdSense publisher ID. Must match the entry in public/ads.txt. */
export const ADSENSE_CLIENT = "ca-pub-4067803003775557";

export const NAV = [
  { href: "/blogs", label: "Writing" },
  { href: "/about", label: "About" },
  { href: "/resume", label: "Resume" },
] as const;
