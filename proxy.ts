import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/proxy";
import { canonicalAliasTarget, isKnownApplicationPath } from "@/lib/public-routes";
import { recordServerHit } from "@/lib/server-hit-counter";

// A raw, consent-independent page-view counter. Counts one hit per real
// public document navigation (not prefetches, assets, API calls, or the admin
// area) so /admin/analytics can compare it against the GA4 numbers.
function isCountableNavigation(request: NextRequest, pathname: string) {
  if (request.method !== "GET") return false;
  if (pathname.startsWith("/api") || pathname.startsWith("/admin") || pathname.startsWith("/_next")) return false;
  if (pathname.includes(".")) return false; // robots.txt, sitemap.xml, icons, etc.
  const headers = request.headers;
  if (headers.get("next-router-prefetch") || headers.get("x-middleware-prefetch")) return false;
  if (headers.get("purpose") === "prefetch" || (headers.get("sec-purpose") || "").includes("prefetch")) return false;
  const wantsHtml = headers.get("sec-fetch-dest") === "document" || (headers.get("accept") || "").includes("text/html");
  return wantsHtml;
}

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  const pathname = request.nextUrl.pathname;
  const previewAuthRoutes = new Set(["/api/admin/login", "/api/admin/logout", "/api/admin/forgot-password"]);
  if (process.env.VERCEL_ENV === "preview" && pathname.startsWith("/api/admin/") && !previewAuthRoutes.has(pathname) && !["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    return NextResponse.json({ error: "Administration changes are disabled in this preview until an isolated test database is configured." }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
  const aliasTarget = canonicalAliasTarget(pathname);
  if (aliasTarget) return NextResponse.redirect(new URL(aliasTarget, request.url), 301);
  if (!isKnownApplicationPath(pathname)) {
    return new NextResponse(
      "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"robots\" content=\"noindex\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>Page not found | Daily Red Sea</title></head><body><main><h1>Page not found</h1><p>The requested Daily Red Sea page does not exist.</p><p><a href=\"/\">Return to the homepage</a></p></main></body></html>",
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex" } },
    );
  }
  if (isCountableNavigation(request, pathname)) event.waitUntil(recordServerHit());

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && serviceKey && !pathname.startsWith("/api/") && !pathname.startsWith("/admin")) {
    try {
      const query = new URLSearchParams({ select: "destination_path,permanent", active: "eq.true", source_path: `eq.${pathname}`, limit: "1" });
      const response = await fetch(`${url}/rest/v1/redirect_rules?${query}`, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: "no-store" });
      if (response.ok) {
        const [rule] = await response.json() as Array<{ destination_path: string; permanent: boolean }>;
        if (rule?.destination_path) return NextResponse.redirect(new URL(rule.destination_path, request.url), rule.permanent ? 308 : 307);
      }
    } catch (error) {
      console.error("Redirect lookup failed", error);
    }
  }
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
