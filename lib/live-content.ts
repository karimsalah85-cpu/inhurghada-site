import "server-only";

import { blogPosts, type BlogPost } from "@/data/blog-posts";
import { tours, type Tour } from "@/data/tours";
import { createAdminClient } from "@/utils/supabase/admin";
import { applyTourCollectionMediaSafety } from "@/lib/tour-media-safety";
import type { Locale } from "@/lib/i18n";

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

function codeControlledTourFields(fallback: Tour | undefined) {
  if (!fallback?.boatOptions?.length) return {};
  return {
    boatOptions: fallback.boatOptions,
    price: fallback.price,
    packagePrice: fallback.packagePrice,
    pricingMode: fallback.pricingMode,
    priceUnit: fallback.priceUnit,
  } satisfies Partial<Tour>;
}

export type MediaAssetRow = { id: string; public_url: string | null; storage_path: string; alt_text: string | null; focal_x: number | string | null; focal_y: number | string | null };
export type MediaUsageRow = { asset_id: string; owner_key: string; role: string; sort_order: number };
export type MediaLocalizationRow = { asset_id: string; locale: string; alt_text: string | null };

const focal = (value: unknown) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 1 ? number : 0.5;
};

export function mergeTourMedia(tourRows: Tour[], usages: MediaUsageRow[], assetRows: MediaAssetRow[], localizations: MediaLocalizationRow[], locale = "en") {
  const assets = new Map(assetRows.map((asset) => [asset.id, asset]));
  const altFor = (asset: MediaAssetRow) => localizations.find((item) => item.asset_id === asset.id && item.locale === locale)?.alt_text || localizations.find((item) => item.asset_id === asset.id && item.locale === "en")?.alt_text || asset.alt_text || undefined;
  return tourRows.map((tour) => {
    const assigned = usages.filter((usage) => usage.owner_key === tour.slug).map((usage) => ({ usage, asset: assets.get(usage.asset_id) })).filter((item): item is { usage: MediaUsageRow; asset: MediaAssetRow } => Boolean(item.asset));
    const featured = assigned.find((item) => item.usage.role === "featured");
    const gallery = assigned.filter((item) => item.usage.role === "gallery").sort((a, b) => a.usage.sort_order - b.usage.sort_order);
    return { ...tour,
      ...(featured ? { image: featured.asset.public_url || featured.asset.storage_path, imageAlt: altFor(featured.asset), imageFocalPoint: { x: focal(featured.asset.focal_x), y: focal(featured.asset.focal_y) } } : {}),
      ...(gallery.length ? { galleryImages: gallery.map(({ asset }) => asset.public_url || asset.storage_path), galleryImageAlts: gallery.map(({ asset }) => altFor(asset) || tour.title), galleryImageFocalPoints: gallery.map(({ asset }) => ({ x: focal(asset.focal_x), y: focal(asset.focal_y) })) } : {}),
    };
  });
}

async function applyTourMedia(tourRows: Tour[], locale = "en") {
  const client = createAdminClient();
  if (!client || !tourRows.length) return tourRows;
  try {
  const slugs = tourRows.map((tour) => tour.slug);
  const { data: usageData, error: usageError } = await client.from("media_usages").select("asset_id,owner_key,role,sort_order").eq("owner_type", "tour").in("owner_key", slugs).in("role", ["featured", "gallery"]).order("sort_order");
  if (usageError || !usageData?.length) return tourRows;
  const usages = usageData as MediaUsageRow[];
  const assetIds = [...new Set(usages.map((usage) => usage.asset_id))];
  const [{ data: assetData, error: assetError }, { data: localizationData }] = await Promise.all([
    client.from("media_assets").select("id,public_url,storage_path,alt_text,focal_x,focal_y").in("id", assetIds).is("archived_at", null),
    client.from("media_asset_localizations").select("asset_id,locale,alt_text").in("asset_id", assetIds).in("locale", [locale, "en"]),
  ]);
  if (assetError) return tourRows;
  const localizations = (localizationData || []) as MediaLocalizationRow[];
  return mergeTourMedia(tourRows, usages, (assetData || []) as MediaAssetRow[], localizations, locale);
  } catch {
    return tourRows;
  }
}

export async function getLiveTours(locale: Locale = "en"): Promise<Tour[]> {
  const rows = await contentRows("tour");
  const locallyUnlistedSlugs = new Set(tours.filter((tour) => tour.listingStatus === "unlisted").map((tour) => tour.slug));
  const listedTours = tours.filter((tour) => tour.listingStatus !== "unlisted");
  if (!rows.length) return applyTourCollectionMediaSafety(await applyTourMedia(listedTours, locale), locale);
  const publicRows = rows.filter((row) => !locallyUnlistedSlugs.has(row.slug));
  const managedSlugs = new Set(publicRows.map((row) => row.slug));
  const overrides = new Map(publicRows.filter((row) => row.status === "published" && row.listing_status !== "unlisted").map((row) => {
    const fallback = tours.find((tour) => tour.slug === row.slug);
    const body = objectBody(row);
    return [row.slug, { ...fallback, ...body, slug: row.slug, listingStatus: row.listing_status || "active", title: row.title, description: row.excerpt || String(body.description || fallback?.description || ""), image: row.featured_image || String(body.image || fallback?.image || "/images/placeholders/island-trip.svg"), seoTitle: row.seo_title || String(body.seoTitle || ""), metaDescription: row.seo_description || String(body.metaDescription || ""), price: String(body.price || fallback?.price || "0"), rating: String(body.rating || fallback?.rating || "5.0"), location: String(body.location || fallback?.location || "Hurghada, Egypt"), duration: String(body.duration || fallback?.duration || ""), ...codeControlledTourFields(fallback) } as Tour];
  }));
  return applyTourCollectionMediaSafety(await applyTourMedia([...listedTours.filter((tour) => !managedSlugs.has(tour.slug)), ...overrides.values()], locale), locale);
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

function resolveBlogHeroImages(posts: BlogPost[], liveTours: Tour[]): BlogPost[] {
  const tourImages = new Map(liveTours.map((tour) => [tour.slug, tour.image]));
  return posts.map((post) => {
    if (post.heroImage && !post.heroImage.startsWith("/images/placeholders/")) return post;
    const heroImage = post.relatedTourSlugs
      .map((slug) => tourImages.get(slug))
      .find((image): image is string => Boolean(image) && !image.startsWith("/images/placeholders/"));
    return heroImage ? { ...post, heroImage } : applyBlogMediaSafety(post);
  });
}

export async function getLiveBlogPosts(): Promise<BlogPost[]> {
  const rows = await contentRows("blog");
  const liveTours = await getLiveTours();
  if (!rows.length) return resolveBlogHeroImages(blogPosts, liveTours);
  const managedSlugs = new Set(rows.map((row) => row.slug));
  const overrides = new Map(rows.filter((row) => row.status === "published").map((row) => {
    const fallback = blogPosts.find((post) => post.slug === row.slug);
    const body = objectBody(row);
    return [row.slug, { ...fallback, ...body, slug: row.slug, title: row.title, metaDescription: row.seo_description || row.excerpt || String(body.metaDescription || ""), publishedAt: row.published_at || row.publish_at || String(body.publishedAt || new Date().toISOString()), heroImage: row.featured_image || String(body.heroImage || "/images/placeholders/island-trip.svg"), relatedTourSlugs: Array.isArray(body.relatedTourSlugs) ? body.relatedTourSlugs as string[] : fallback?.relatedTourSlugs || [], intro: String(body.intro || row.excerpt || ""), sections: Array.isArray(body.sections) ? body.sections as BlogPost["sections"] : fallback?.sections || [], faqs: Array.isArray(body.faqs) ? body.faqs as BlogPost["faqs"] : fallback?.faqs || [] } as BlogPost];
  }));
  return resolveBlogHeroImages([...blogPosts.filter((post) => !managedSlugs.has(post.slug)), ...overrides.values()], liveTours);
}

function applyBlogMediaSafety(post: BlogPost): BlogPost {
  if (post.heroImage && !post.heroImage.startsWith("/images/placeholders/")) return post;
  const text = `${post.title} ${post.intro}`.toLowerCase();
  const heroImage = /diving|underwater|scuba/.test(text) ? "/images/placeholders/diving.svg"
    : /desert|safari|quad|camel/.test(text) ? "/images/placeholders/desert-experience.svg"
    : /transfer|airport/.test(text) ? "/images/placeholders/private-transfer.svg"
    : /luxor|cairo|temple|culture/.test(text) ? "/images/placeholders/cultural-trip.svg"
    : "/images/placeholders/island-trip.svg";
  return { ...post, heroImage };
}

export async function getPublicSiteSettings(): Promise<Record<string, unknown>> {
  const client = createAdminClient();
  if (!client) return {};
  const { data, error } = await client.from("site_settings").select("key,value").eq("public", true);
  if (error) { console.error("Could not load public site settings", error.message); return {}; }
  return Object.fromEntries((data || []).map((row) => [row.key, row.value]));
}
