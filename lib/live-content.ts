import "server-only";

import { blogPosts, type BlogPost } from "@/data/blog-posts";
import { tours, type Tour } from "@/data/tours";
import { createAdminClient } from "@/utils/supabase/admin";

export type TripListingStatus = "active" | "paused" | "unlisted";
type ContentRow = { slug: string; status: "draft" | "scheduled" | "published" | "archived"; listing_status: TripListingStatus; title: string; excerpt: string | null; body: unknown; seo_title: string | null; seo_description: string | null; featured_image: string | null; published_at: string | null; publish_at: string | null };

async function contentRows(contentType: "tour" | "blog") {
  const client = createAdminClient();
  if (!client) return [];
  const { data, error } = await client.from("content_items").select("slug,status,listing_status,title,excerpt,body,seo_title,seo_description,featured_image,published_at,publish_at").eq("content_type", contentType).eq("locale", "en");
  if (error) {
    console.error(`Could not load live ${contentType} content`, error.message);
    return [];
  }
  return (data || []) as ContentRow[];
}

function objectBody(row: ContentRow) {
  return row.body && typeof row.body === "object" && !Array.isArray(row.body) ? row.body as Record<string, unknown> : {};
}

export async function getLiveTours(): Promise<Tour[]> {
  const rows = await contentRows("tour");
  if (!rows.length) return tours;
  const managedSlugs = new Set(rows.map((row) => row.slug));
  const overrides = new Map(rows.filter((row) => row.status === "published" && row.listing_status !== "unlisted").map((row) => {
    const fallback = tours.find((tour) => tour.slug === row.slug);
    const body = objectBody(row);
    return [row.slug, { ...fallback, ...body, slug: row.slug, listingStatus: row.listing_status || "active", title: row.title, description: row.excerpt || String(body.description || fallback?.description || ""), image: row.featured_image || String(body.image || fallback?.image || "/images/orange-bay.jpeg"), seoTitle: row.seo_title || String(body.seoTitle || ""), metaDescription: row.seo_description || String(body.metaDescription || ""), price: String(body.price || fallback?.price || "0"), rating: String(body.rating || fallback?.rating || "5.0"), location: String(body.location || fallback?.location || "Hurghada, Egypt"), duration: String(body.duration || fallback?.duration || "") } as Tour];
  }));
  return [...tours.filter((tour) => !managedSlugs.has(tour.slug)), ...overrides.values()];
}

export async function getUnavailableTrip(slugs: string[]): Promise<{ slug: string; status: TripListingStatus } | null> {
  const uniqueSlugs = [...new Set(slugs.filter(Boolean))];
  if (!uniqueSlugs.length) return null;
  const client = createAdminClient();
  if (!client) return null;
  const { data, error } = await client.from("content_items").select("slug,status,listing_status").eq("content_type", "tour").eq("locale", "en").in("slug", uniqueSlugs);
  if (error) {
    console.error("Could not verify trip availability", error.message);
    throw new Error("Trip availability could not be verified.");
  }
  const unavailable = (data || []).find((row) => row.status !== "published" || row.listing_status !== "active");
  if (!unavailable) return null;
  return { slug: unavailable.slug, status: unavailable.listing_status === "paused" ? "paused" : "unlisted" };
}

export async function getLiveBlogPosts(): Promise<BlogPost[]> {
  const rows = await contentRows("blog");
  if (!rows.length) return blogPosts;
  const managedSlugs = new Set(rows.map((row) => row.slug));
  const overrides = new Map(rows.filter((row) => row.status === "published").map((row) => {
    const fallback = blogPosts.find((post) => post.slug === row.slug);
    const body = objectBody(row);
    return [row.slug, { ...fallback, ...body, slug: row.slug, title: row.title, metaDescription: row.seo_description || row.excerpt || String(body.metaDescription || ""), publishedAt: row.published_at || row.publish_at || String(body.publishedAt || new Date().toISOString()), heroImage: row.featured_image || String(body.heroImage || "/images/orange-bay.jpeg"), relatedTourSlugs: Array.isArray(body.relatedTourSlugs) ? body.relatedTourSlugs as string[] : fallback?.relatedTourSlugs || [], intro: String(body.intro || row.excerpt || ""), sections: Array.isArray(body.sections) ? body.sections as BlogPost["sections"] : fallback?.sections || [], faqs: Array.isArray(body.faqs) ? body.faqs as BlogPost["faqs"] : fallback?.faqs || [] } as BlogPost];
  }));
  return [...blogPosts.filter((post) => !managedSlugs.has(post.slug)), ...overrides.values()];
}

export async function getPublicSiteSettings(): Promise<Record<string, unknown>> {
  const client = createAdminClient();
  if (!client) return {};
  const { data, error } = await client.from("site_settings").select("key,value").eq("public", true);
  if (error) { console.error("Could not load public site settings", error.message); return {}; }
  return Object.fromEntries((data || []).map((row) => [row.key, row.value]));
}
