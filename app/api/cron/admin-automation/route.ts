import { NextRequest, NextResponse } from "next/server";
import { deliverReferralNotifications } from "@/lib/referral-notifications";
import { runAdminAutomation } from "@/lib/admin-automation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const automation = await runAdminAutomation();
    const referrals = await deliverReferralNotifications();
    // Finance failures are recorded in finance_sync_errors; fail the run so they are never silent.
    const ok = automation.finance.status !== "error";
    return NextResponse.json({ ok, ...automation, referrals }, { status: ok ? 200 : 500 });
  } catch (error) {
    console.error("Admin automation failed", error);
    return NextResponse.json({ ok: false, error: "Automation failed." }, { status: 500 });
  }
}
