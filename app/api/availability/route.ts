import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const tourSlug = request.nextUrl.searchParams.get("tour")?.trim() || "";
  const date = request.nextUrl.searchParams.get("date")?.trim() || "";
  if (!/^[a-z0-9-]{1,100}$/.test(tourSlug) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "Invalid availability request." }, { status: 400 });
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ managed: false });
  const { data, error } = await supabase.from("tour_availability").select("start_time,capacity,reserved,blocked,price_override,currency").eq("tour_slug", tourSlug).eq("service_date", date).order("start_time");
  if (error) return NextResponse.json({ error: "Availability is temporarily unavailable." }, { status: 503 });
  const slots = (data || []).map((slot) => ({ ...slot, remaining: slot.blocked ? 0 : slot.capacity == null ? null : Math.max(0, slot.capacity - slot.reserved), soldOut: slot.blocked || (slot.capacity != null && slot.reserved >= slot.capacity) }));
  return NextResponse.json({ managed: slots.length > 0, soldOut: slots.length > 0 && slots.every((slot) => slot.soldOut), slots }, { headers: { "Cache-Control": "public, s-maxage=20" } });
}
