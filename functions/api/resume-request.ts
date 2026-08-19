/**
 * POST /api/resume-request — someone asking for the full CV.
 *
 * A Cloudflare Pages Function, so it runs on the same origin as the site: the
 * page's `fetch` needs no CORS and the strict CSP (`connect-src 'self'`) allows
 * it without a new exception. The alternative — a third-party form service —
 * would need both, and would put every request through someone else's database.
 *
 * Delivery tries Resend first, then a Telegram message via the marsClaw bot.
 * Set whichever you prefer as a Pages secret:
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
  /** Telegram fallback: the marsClaw bot token and the chat to notify. */
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
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

  const lines = [
    `Name:    ${name}`,
    `Email:   ${email}`,
    org ? `Company: ${org}` : null,
    "",
    message || "(no message)",
  ].filter((line) => line !== null);

  const subject = `CV request — ${name}${org ? ` (${org})` : ""}`;
  const body = lines.join("\n");

  // Two ways out, tried in order. Email is the better one — replying to it goes
  // straight back to the requester with the PDF attached. Telegram needs no
  // third-party signup because the marsClaw bot already exists, so it is the
  // fallback that makes this work today.
  if (env.RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.RESUME_REQUEST_FROM ?? FROM,
        to: env.RESUME_REQUEST_TO ?? TO,
        reply_to: email,
        subject,
        text: body,
      }),
    });

    if (!res.ok) {
      console.error(`resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
      return json({ error: "Could not send the request." }, 502);
    }
    return json({ ok: true }, 200);
  }

  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    const res = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          // Plain text, no parse_mode: a name containing an underscore or an
          // asterisk would otherwise be rejected as broken markdown.
          text: `📄 ${subject}\n\n${body}`,
          disable_web_page_preview: true,
        }),
      }
    );

    if (!res.ok) {
      console.error(`telegram ${res.status}: ${(await res.text()).slice(0, 300)}`);
      return json({ error: "Could not send the request." }, 502);
    }
    return json({ ok: true }, 200);
  }

  return json({ error: "Mail delivery is not configured." }, 503);
};
