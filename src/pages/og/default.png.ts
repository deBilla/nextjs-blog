import type { APIRoute } from "astro";
import { renderOgImage } from "../../utils/og";

export const GET: APIRoute = async () => {
  const png = await renderOgImage({
    title: "Distributed systems, platform engineering, and AI infrastructure.",
    meta: "billacode.org",
  });

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
