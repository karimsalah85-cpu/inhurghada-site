import { isLocale } from "@/lib/i18n";

const publicRouteRoots = new Set([
  "about", "admin", "api", "blog", "booking", "cart", "checkout", "contact",
  "destinations", "faq", "hurghada", "image-credits", "privacy-policy", "reviews",
  "terms-conditions", "tours", "transfers",
]);

const publicFiles = new Set(["/favicon.ico", "/llms.txt", "/robots.txt", "/sitemap.xml"]);

/** Rejects unknown catch-all roots before Next.js starts streaming a soft-404 response. */
export function isKnownApplicationPath(pathname: string) {
  if (pathname === "/" || publicFiles.has(pathname) || pathname.startsWith("/.well-known/")) return true;
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] && isLocale(parts[0])) parts.shift();
  return !parts.length || publicRouteRoots.has(parts[0]);
}
