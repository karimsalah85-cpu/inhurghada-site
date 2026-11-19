import "server-only";

import { tours } from "@/data/tours";
import { blogPosts } from "@/data/blog-posts";
import { isLocale } from "@/lib/i18n";

// The root loading.tsx makes every page stream, and once streaming starts Next.js must send
// HTTP 200: a notFound() inside the tour or blog page then becomes a "soft 404" that search
// engines treat as a real, empty page. The proxy uses this module to answer 404 for tour and
// blog slugs that do not exist *before* the page starts rendering.
//
// Published slugs come from the code catalog plus admin-managed content, read through the
// Supabase REST API (like redirect-rules.ts) and cached briefly. If that read fails the check
// answers "exists", so a database problem can never take real pages offline.

type ContentRow = { slug: string; content_type: "tour" | "blog"; status: string; listing_status: string | null };
type Known = { tours: Set<string>; blogs: Set<string> };

const TTL_MS = 60_000;
let cached: { known: Known | null; expiresAt: number } | null = null;

export function clearKnownContentCache() {
  cached = null;
}

/** Same rules as getLiveTours / getLiveBlogPosts and the page fallbacks. */
export function publicContentSlugs(rows: ContentRow[]): Known {
  const codeUnlisted = new Set(tours.filter((tour) => tour.listingStatus === "unlisted").map((tour) => tour.slug));
  const tourSlugs = new Set(tours.filter((tour) => tour.listingStatus !== "unlisted").map((tour) => tour.slug));
  for (const row of rows) {
    if (row.content_type === "tour" && row.status === "published" && row.listing_status !== "unlisted" && !codeUnlisted.has(row.slug)) tourSlugs.add(row.slug);
  }
  const managedBlogs = new Set(rows.filter((row) => row.content_type === "blog").map((row) => row.slug));
  const blogSlugs = new Set(blogPosts.filter((post) => !managedBlogs.has(post.slug)).map((post) => post.slug));
  for (const row of rows) if (row.content_type === "blog" && row.status === "published") blogSlugs.add(row.slug);
  return { tours: tourSlugs, blogs: blogSlugs };
}

async function loadKnownContent(): Promise<Known | null> {
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.known;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  // Without credentials the pages themselves only use the code catalog, so answer from it.
  if (!url || !serviceKey) return publicContentSlugs([]);
  try {
    const query = new URLSearchParams({ select: "slug,content_type,status,listing_status", locale: "eq.en", content_type: "in.(tour,blog)", limit: "5000" });
    const response = await fetch(`${url}/rest/v1/content_items?${query}`, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: "no-store" });
    if (!response.ok) return cached?.known ?? null;
    const known = publicContentSlugs((await response.json()) as ContentRow[]);
    cached = { known, expiresAt: now + TTL_MS };
    return known;
  } catch (error) {
    console.error("Known content lookup failed", error);
    return cached?.known ?? null;
  }
}

/** Tour or blog article path (optionally locale-prefixed) and its slug, or null for other pages. */
export function contentPathSlug(pathname: string): { kind: "tours" | "blogs"; slug: string } | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] && isLocale(parts[0])) parts.shift();
  if (parts.length !== 2) return null;
  if (parts[0] === "tours") return { kind: "tours", slug: decodeURIComponent(parts[1]) };
  if (parts[0] === "blog") return { kind: "blogs", slug: decodeURIComponent(parts[1]) };
  return null;
}

/** Static routes that live under /tours/ next to the trip pages. */
const staticTourRoutes = new Set(["transfer-to-and-from-senzo-mall"]);

/** False only when the path is a tour or blog article that is certainly not published. */
export async function isPublishedContentPath(pathname: string): Promise<boolean> {
  const target = contentPathSlug(pathname);
  if (!target) return true;
  if (target.kind === "tours" && staticTourRoutes.has(target.slug)) return true;
  const known = await loadKnownContent();
  if (!known) return true;
  return known[target.kind].has(target.slug);
}
