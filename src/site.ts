export const SITE = {
  name: "billacode",
  author: "Dimuthu Wickramanayake",
  url: "https://billacode.org",
  title: "Dimuthu Wickramanayake",
  description:
    "Notes on distributed systems, platform engineering, and AI infrastructure — by Dimuthu Wickramanayake.",
  locale: "en",
} as const;

/** GA4 measurement ID. Only loaded in production builds. */
export const GA_ID = "G-JNMSN5FHDJ";

/** AdSense publisher ID. Must match the entry in public/ads.txt. */
export const ADSENSE_CLIENT = "ca-pub-4067803003775557";

export const NAV = [
  { href: "/blogs", label: "Writing" },
  { href: "/about", label: "About" },
  { href: "/cv", label: "CV" },
] as const;
