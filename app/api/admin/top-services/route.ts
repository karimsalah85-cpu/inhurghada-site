import { NextRequest, NextResponse } from "next/server";
import { rankTopServices } from "@/lib/admin-analytics";
import { getAdminAuthorization } from "@/lib/admin-permission";

const day = 86_400_000;
const iso = (date: Date) => date.toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });

export async function GET(request: NextRequest) {
  const { supabase, allowed } = await getAdminAuthorization("view_analytics");
  if (!allowed) return NextResponse.json({ error: "Analytics access required." }, { status: 403 });
  const requested = Number(request.nextUrl.searchParams.get("range") || 30);
  const range = [7, 30, 90].includes(requested) ? requested : 30;
  const start = new Date();
  const currentFrom = iso(start);
  const currentTo = iso(new Date(start.getTime() + (range - 1) * day));
  const previousFrom = iso(new Date(start.getTime() - range * day));
  const previousTo = iso(new Date(start.getTime() - day));
  const { data, error } = await supabase.from("bookings").select("tour_name,date,status").is("archived_at", null).eq("status", "confirmed").gte("date", previousFrom).lte("date", currentTo);
  if (error) return NextResponse.json({ error: "Could not load service rankings." }, { status: 500 });
  const rows = data || [];
  const services = rankTopServices(rows.filter((row) => row.date && row.date >= currentFrom), rows.filter((row) => row.date && row.date <= previousTo));
  return NextResponse.json({ range, currentFrom, currentTo, previousFrom, previousTo, services }, { headers: { "Cache-Control": "private, no-store" } });
}
