import type { NextRequest } from "next/server";
import { findUnmatchedHotels, isMissingTableError, type HotelRow } from "@/lib/pickup-zones";
import { json, migrationRequired, pickupZonesAccess } from "@/lib/pickup-zones-admin";
import { pickupTours } from "@/lib/pickup-zone-tours";

const UNMATCHED_LOOKBACK_DAYS = 180;

// Everything the Hotels & pickup times page needs: zones, hotels, the zone × tour time grid, the tour
// list, and booking hotel spellings (last 180 days and all upcoming) that match no hotel yet.
export async function GET(request: NextRequest) {
  const access = await pickupZonesAccess(request, { write: false });
  if (!access.ok) return access.response;
  const { supabase } = access;
  const since = new Date(Date.now() - UNMATCHED_LOOKBACK_DAYS * 86_400_000).toISOString().slice(0, 10);
  const [zones, hotels, times, bookings] = await Promise.all([
    supabase.from("pickup_zones").select("id,name,destination,notes,active,created_at,updated_at").order("destination").order("name").limit(1000),
    supabase.from("hotels").select("id,name,normalized_name,aliases,zone_id,active,created_at,updated_at").order("name").limit(10_000),
    supabase.from("zone_pickup_times").select("zone_id,tour_slug,pickup_time").limit(20_000),
    supabase.from("bookings").select("hotel,date").is("archived_at", null).neq("status", "cancelled").gte("date", since).not("hotel", "is", null).limit(20_000),
  ]);
  const missing = [zones.error, hotels.error, times.error].find((error) => isMissingTableError(error));
  if (missing) return migrationRequired();
  const error = zones.error || hotels.error || times.error || bookings.error;
  if (error) return json({ error: error.message }, 500);
  const unmatched = findUnmatchedHotels(bookings.data || [], (hotels.data || []) as HotelRow[]).slice(0, 200);
  return json({ configured: true, zones: zones.data || [], hotels: hotels.data || [], times: times.data || [], tours: pickupTours, unmatched, unmatchedSince: since });
}
