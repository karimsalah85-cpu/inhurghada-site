import { NextRequest, NextResponse } from "next/server";
import { runAdminAutomation } from "@/lib/admin-automation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json({ ok: true, ...(await runAdminAutomation()) });
  } catch (error) {
    console.error("Admin automation failed", error);
    return NextResponse.json({ ok: false, error: "Automation failed." }, { status: 500 });
  }
}
