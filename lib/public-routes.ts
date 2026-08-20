import { isLocale } from "@/lib/i18n";
import { localePath, type Locale } from "@/lib/i18n";

const publicRouteRoots = new Set([
  "about", "admin", "api", "blog", "booking", "cart", "checkout", "contact",
  "destinations", "faq", "hurghada", "jeddah", "marsa-alam", "image-credits", "privacy-policy", "reviews",
  "terms-conditions", "tours", "transfers",
]);

const publicFiles = new Set(["/favicon.ico", "/llms.txt", "/robots.txt", "/sitemap.xml"]);

/** Rejects unknown catch-all roots before Next.js starts streaming a soft-404 response. */
export function isKnownApplicationPath(pathname: string) {
  if (pathname === "/" || publicFiles.has(pathname) || pathname.startsWith("/.well-known/")) return true;
  const parts = pathname.split("/").filter(Boolean);
  const hasLocalePrefix = Boolean(parts[0] && isLocale(parts[0]));
  if (hasLocalePrefix) parts.shift();
  if (!parts.length) return hasLocalePrefix;
  if (!publicRouteRoots.has(parts[0])) return false;
  // There are no dynamic routes below the transfer hub. Reject unknown nested
  // paths before App Router streaming can turn notFound() into an HTTP 200.
  if (parts[0] === "transfers") return parts.length === 1;
  return true;
}

const canonicalAliases: Record<string, string> = {
  "/hurghada-tours": "/hurghada/excursions",
  "/tours/orange-bay-boat-trip-hurghada": "/tours/orange-bay",
  "/tours/snorkeling-trip-hurghada": "/tours/full-day-snorkeling",
  "/tours/scuba-diving-hurghada": "/tours/full-day-diving",
  "/tours/desert-safari-hurghada": "/tours/safari",
  "/tours/luxor-day-trip-from-hurghada": "/tours/luxor-private-day-trip",
  "/tours/mahmya-island-boat-trip": "/tours/mahmya-island",
  "/transfers/hurghada-airport-transfer": "/tours/hurghada-airport-transfer",
  "/transfers/hurghada-to-makadi-bay": "/transfers",
  "/transfers/hurghada-to-el-gouna": "/transfers",
  "/transfers/hurghada-to-soma-bay": "/transfers",
  "/transfers/hurghada-to-sahl-hasheesh": "/transfers",
};

/** Resolves known historical/discovered URLs while preserving the requested locale. */
export function canonicalAliasTarget(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const locale: Locale = parts[0] && isLocale(parts[0]) ? parts.shift() as Locale : "en";
  const source = `/${parts.join("/")}`;
  const target = canonicalAliases[source];
  return target ? localePath(locale, target) : null;
}
