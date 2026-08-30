import { NextRequest, NextResponse } from "next/server";
import { getAdminAuthorization } from "@/lib/admin-permission";
import { getGoogleAdsReport, googleAdsConfiguration, isDeveloperTokenNotApproved, GOOGLE_ADS_PENDING_APPROVAL_MESSAGE } from "@/lib/google-ads";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { allowed } = await getAdminAuthorization("view_analytics");
  if (!allowed) return NextResponse.json({ error: "Analytics permission required." }, { status: 403 });

  const configuration = googleAdsConfiguration();
  if (!configuration.configured) return NextResponse.json({ configured: false, missing: configuration.missing }, { headers: { "Cache-Control": "private, no-store" } });

  const from = request.nextUrl.searchParams.get("from") || "";
  const to = request.nextUrl.searchParams.get("to") || "";
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(from) || !datePattern.test(to) || from > to) return NextResponse.json({ error: "Invalid date range." }, { status: 400 });
  try {
    return NextResponse.json(await getGoogleAdsReport(from, to), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    // A token still restricted to Test Accounts is an expected pending-approval
    // state, not a server fault: return 200 with a clear one-line status so the
    // admin page shows a calm notice instead of a red error box.
    if (isDeveloperTokenNotApproved(error)) {
      return NextResponse.json({ configured: true, pendingApproval: true, message: GOOGLE_ADS_PENDING_APPROVAL_MESSAGE }, { headers: { "Cache-Control": "private, no-store" } });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Google Ads reporting failed." }, { status: 502, headers: { "Cache-Control": "private, no-store" } });
  }
}
