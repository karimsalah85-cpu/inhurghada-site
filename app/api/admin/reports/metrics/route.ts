import { NextResponse } from "next/server";
import { getAdminAuthorization, hasLivePermission } from "@/lib/admin-permission";
import { loadBookingReports } from "@/lib/finance/load-booking-report";
export async function GET() {
  const { supabase, user, allowed } = await getAdminAuthorization("view_reports");
  const headers = { "Cache-Control": "private, no-store" };
  if (!allowed || !await hasLivePermission(supabase, user, "view_finance"))
    return NextResponse.json({ error: "Finance permission required for financial totals." }, { status: 403, headers });
  try {
    const ids: string[] = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await supabase.from("bookings").select("id").is("archived_at", null).order("id").range(offset, offset + 499);
      if (error) throw error;
      ids.push(...(data || []).map(b => b.id));
      if (!data || data.length < 500) break;
    }
    return NextResponse.json(await loadBookingReports(supabase, ids), { headers });
  } catch { return NextResponse.json({ error: "Financial totals unavailable. Refresh or check Finance." }, { status: 503, headers }); }
}
