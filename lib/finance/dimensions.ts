import type { SupabaseClient } from "@supabase/supabase-js";
import { tours, type Tour } from "@/data/tours";

export type TourDimension = { tour_slug: string; tour_name: string; destination: string | null; product_line: string };

/** Reporting dimensions (destination + product line) for every catalog tour. Product line is the tour category. */
export function tourDimensions(catalog: Pick<Tour, "slug" | "title" | "destinationSlug" | "category">[] = tours): TourDimension[] {
  const bySlug = new Map<string, TourDimension>();
  for (const tour of catalog) {
    bySlug.set(tour.slug, {
      tour_slug: tour.slug,
      tour_name: tour.title,
      destination: tour.destinationSlug || null,
      product_line: tour.category?.trim() || "Tour",
    });
  }
  return [...bySlug.values()];
}

/** Upserts the catalog dimensions; a database trigger re-labels existing financial lines. */
export async function syncTourDimensions(supabase: SupabaseClient) {
  const rows = tourDimensions().map((row) => ({ ...row, updated_at: new Date().toISOString() }));
  const { error } = await supabase.from("finance_tour_dimensions").upsert(rows, { onConflict: "tour_slug" });
  if (error) throw error;
  return rows.length;
}
