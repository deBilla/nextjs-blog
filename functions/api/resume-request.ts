/**
 * POST /api/resume-request — someone asking for the full CV.
 *
 * A Cloudflare Pages Function, so it runs on the same origin as the site: the
 * page's `fetch` needs no CORS and the strict CSP (`connect-src 'self'`) allows
 * it without a new exception. The alternative — a third-party form service —
 * would need both, and would put every request through someone else's database.
 *
 * Delivery goes through Resend. Set the secret once:
 *   npx wrangler pages secret put RESEND_API_KEY --project-name=billacode
 *
 * Until that exists the endpoint fails cleanly with 503 and the page falls back
 * to a mailto: link, so a missing key degrades to "email me" rather than a
 * silent black hole.
 */

/**
 * The two fields of the Pages Functions context this handler touches. Declared
 * locally rather than pulling in `@cloudflare/workers-types`, which registers
 * Workers globals across the whole project and collides with the DOM lib the
 * Astro components are checked against.
 */
type PagesFunction<E> = (context: {
  request: Request;
  env: E;
}) => Response | Promise<Response>;

interface Env {
  RESEND_API_KEY?: string;
  /** Overrides the default recipient. Handy for testing against another inbox. */
  RESUME_REQUEST_TO?: string;
  /** Verified sender domain in Resend. Defaults to Resend's shared sender. */
  RESUME_REQUEST_FROM?: string;
}

const TO = "dimuthu.billa@gmail.com";
const FROM = "billacode <onboarding@resend.dev>";

/** Trim, cap, and strip control characters before anything is echoed into email. */
function clean(value: unknown, max: number): string {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, max);
}

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Malformed request." }, 400);
  }

  // Honeypot: a real browser leaves this empty because the field is off-screen.
  // Answer 200 so a bot logs a success and does not come back with variations.
  if (clean(payload.website, 200)) return json({ ok: true }, 200);

  const name = clean(payload.name, 120);
  const email = clean(payload.email, 200);
  const org = clean(payload.org, 160);
  const message = clean(payload.message, 2000);

  // Deliberately loose: the address only has to be plausible, because the real
  // validation is whether the CV I send to it bounces.
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "A name and a valid email address are required." }, 422);
  }

  const key = env.RESEND_API_KEY;
  if (!key) return json({ error: "Mail delivery is not configured." }, 503);

  const lines = [
    `Name:    ${name}`,
    `Email:   ${email}`,
    org ? `Company: ${org}` : null,
    "",
    message || "(no message)",
  ].filter((line) => line !== null);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.RESUME_REQUEST_FROM ?? FROM,
      to: env.RESUME_REQUEST_TO ?? TO,
      // Replying from the inbox goes straight back to the requester, which is
      // the whole workflow: read, reply, attach the PDF.
      reply_to: email,
      subject: `CV request — ${name}${org ? ` (${org})` : ""}`,
      text: lines.join("\n"),
    }),
  });

  if (!res.ok) {
    console.error(`resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
    return json({ error: "Could not send the request." }, 502);
  }

  return json({ ok: true }, 200);
};
