import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { hasAdminPermission } from "@/lib/admin-auth";
import { getGoogleAdsReport, googleAdsConfiguration } from "@/lib/google-ads";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!hasAdminPermission(user,"finance")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const configuration = googleAdsConfiguration();
  if (!configuration.configured) return NextResponse.json({ configured: false, missing: configuration.missing }, { headers: { "Cache-Control": "private, no-store" } });

  const from = request.nextUrl.searchParams.get("from") || "";
  const to = request.nextUrl.searchParams.get("to") || "";
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(from) || !datePattern.test(to) || from > to) return NextResponse.json({ error: "Invalid date range." }, { status: 400 });
  try {
    return NextResponse.json(await getGoogleAdsReport(from, to), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Google Ads reporting failed." }, { status: 502, headers: { "Cache-Control": "private, no-store" } });
  }
}
