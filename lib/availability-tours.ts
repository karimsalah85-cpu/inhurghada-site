import type { SupabaseClient } from "@supabase/supabase-js";
import { tours } from "@/data/tours";
import { supportsDatePrice } from "@/lib/date-pricing";

/** `datePrice` says whether one price per date can apply (not for boat, package or group-tier trips). */
export type AvailabilityTourOption = { slug: string; title: string; category: string; destination: string; currency: string; datePrice: boolean };

const TRANSFER_CATEGORIES = new Set(["Airport Transfer", "Shopping Transfer"]);

type ContentRow = { slug: string; title: string | null; body: unknown };

async function liveTourRows(supabase: SupabaseClient): Promise<ContentRow[]> {
  const { data, error } = await supabase.from("content_items").select("slug,title,body").eq("content_type", "tour").eq("locale", "en").limit(1000);
  // The catalog in code is always available; the admin-managed rows are an addition to it.
  return error ? [] : (data || []) as ContentRow[];
}

/**
 * Tours that can have availability: the catalog in code plus trips that exist only as
 * admin-managed content. Titles follow the live (admin-edited) title where there is one.
 */
export async function availabilityTourOptions(supabase: SupabaseClient): Promise<AvailabilityTourOption[]> {
  const rows = await liveTourRows(supabase);
  const liveTitle = new Map(rows.map((row) => [row.slug, String(row.title || "").trim()]));
  const options = new Map<string, AvailabilityTourOption>();
  for (const tour of tours) {
    if (TRANSFER_CATEGORIES.has(tour.category || "")) continue;
    options.set(tour.slug, { slug: tour.slug, title: liveTitle.get(tour.slug) || tour.title, category: tour.category || "Other", destination: tour.destinationSlug || "", currency: tour.currency || "USD", datePrice: supportsDatePrice(tour) });
  }
  const codeSlugs = new Set(tours.map((tour) => tour.slug));
  for (const row of rows) {
    if (codeSlugs.has(row.slug)) continue;
    const body = (row.body && typeof row.body === "object" ? row.body : {}) as Record<string, unknown>;
    const category = String(body.category || "Other");
    if (TRANSFER_CATEGORIES.has(category)) continue;
    options.set(row.slug, { slug: row.slug, title: String(row.title || row.slug), category, destination: String(body.destinationSlug || ""), currency: String(body.currency || "USD"), datePrice: supportsDatePrice(body as Parameters<typeof supportsDatePrice>[0]) });
  }
  return [...options.values()].sort((a, b) => a.title.localeCompare(b.title));
}

export async function knownTourSlugs(supabase: SupabaseClient): Promise<Set<string>> {
  const rows = await liveTourRows(supabase);
  return new Set([...tours.map((tour) => tour.slug), ...rows.map((row) => row.slug)]);
}

/**
 * Lower-cased title → slug, for matching multi-trip legs (saved by name) back to tours. Holds
 * both the title in code and the live admin-edited title, since a booking keeps whichever
 * was on the site when it was made.
 */
export async function tourSlugByTitle(supabase: SupabaseClient): Promise<Map<string, string>> {
  const index = new Map(tours.map((tour) => [tour.title.trim().toLowerCase(), tour.slug]));
  for (const row of await liveTourRows(supabase)) if (row.title) index.set(row.title.trim().toLowerCase(), row.slug);
  return index;
}
