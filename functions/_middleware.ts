/**
 * One canonical host: billacode.com.
 *
 * billacode.org still resolves — the registration is deliberately kept so its
 * links keep working and pass their ranking signals on — but it must never
 * serve a second copy of the site, or the two domains compete in search and
 * the 91 Medium posts whose canonical points at the old domain get muddled.
 *
 * This lives in middleware rather than `_redirects` because Pages matches only
 * the path there, not the host, so a host-qualified rule silently never fires.
 * A zone-level Redirect Rule in the Cloudflare dashboard would do the same job
 * without invoking a Function per request; swap to that if request volume ever
 * makes it worth the dashboard trip.
 */

type PagesFunction = (context: {
  request: Request;
  next: () => Promise<Response>;
}) => Response | Promise<Response>;

const CANONICAL_HOST = "billacode.com";

const REDIRECT_HOSTS = new Set([
  "billacode.org",
  "www.billacode.org",
  "www.billacode.com",
]);

export const onRequest: PagesFunction = async ({ request, next }) => {
  const url = new URL(request.url);

  if (REDIRECT_HOSTS.has(url.hostname)) {
    url.hostname = CANONICAL_HOST;
    url.protocol = "https:";
    url.port = "";
    // 301: permanent, so search engines move the signals across rather than
    // treating the old URL as a temporary detour.
    return Response.redirect(url.toString(), 301);
  }

  return next();
};
