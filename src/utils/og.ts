import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import satori from "satori";
import sharp from "sharp";
import { SITE } from "../site";

const require = createRequire(import.meta.url);

/**
 * Satori accepts React elements, but also plain objects with the same shape.
 * This keeps OG generation free of a React dependency.
 */
type Node = {
  type: string;
  props: Record<string, unknown> & { children?: Node[] | string };
};

const h = (
  type: string,
  props: Record<string, unknown> = {},
  children?: Node[] | string
): Node => ({ type, props: { ...props, children } });

let fontCache: Array<{ name: string; data: Buffer; weight: 400 | 600 }> | null = null;

async function loadFonts() {
  if (fontCache) return fontCache;
  // Fontsource ships .woff alongside .woff2; satori reads woff but not woff2.
  const load = (weight: 400 | 600) =>
    readFile(require.resolve(`@fontsource/inter/files/inter-latin-${weight}-normal.woff`));

  const [regular, semibold] = await Promise.all([load(400), load(600)]);
  fontCache = [
    { name: "Inter", data: regular, weight: 400 as const },
    { name: "Inter", data: semibold, weight: 600 as const },
  ];
  return fontCache;
}

const COLORS = {
  bg: "#14171c",
  ink: "#eceef1",
  muted: "#8b939e",
  accent: "#4ade80",
  rule: "#2a2f37",
};

export interface OgCard {
  title: string;
  meta?: string;
  eyebrow?: string;
}

/** Renders a 1200x630 social card as PNG. */
export async function renderOgImage({ title, meta, eyebrow }: OgCard): Promise<Buffer> {
  // Long titles get a smaller size so they stay inside the card.
  const fontSize = title.length > 90 ? 52 : title.length > 55 ? 62 : 74;

  const markup = h(
    "div",
    {
      style: {
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: COLORS.bg,
        padding: "72px 80px",
        fontFamily: "Inter",
      },
    },
    [
      h(
        "div",
        { style: { display: "flex", alignItems: "center", gap: "14px" } },
        [
          h("div", {
            style: {
              width: "14px",
              height: "14px",
              borderRadius: "50%",
              background: COLORS.accent,
            },
          }),
          h(
            "div",
            {
              style: {
                fontSize: "24px",
                fontWeight: 600,
                color: COLORS.ink,
                letterSpacing: "-0.01em",
              },
            },
            eyebrow ?? SITE.name
          ),
        ]
      ),

      h(
        "div",
        {
          style: {
            display: "flex",
            fontSize: `${fontSize}px`,
            fontWeight: 600,
            color: COLORS.ink,
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
            // Guard against an unusually long title overflowing the card.
            maxHeight: "340px",
            overflow: "hidden",
          },
        },
        title
      ),

      h(
        "div",
        {
          style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: `1px solid ${COLORS.rule}`,
            paddingTop: "28px",
            fontSize: "24px",
            color: COLORS.muted,
          },
        },
        [
          h("div", { style: { display: "flex" } }, SITE.author),
          h("div", { style: { display: "flex" } }, meta ?? "billacode.com"),
        ]
      ),
    ]
  );

  const svg = await satori(markup as never, {
    width: 1200,
    height: 630,
    fonts: await loadFonts(),
  });

  return sharp(Buffer.from(svg)).png().toBuffer();
}
