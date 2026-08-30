import { NextResponse } from "next/server";
import { getAdminAuthorization } from "@/lib/admin-permission";
import { getServerHitTotals } from "@/lib/server-hit-counter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { allowed } = await getAdminAuthorization("view_analytics");
  if (!allowed) return NextResponse.json({ error: "Analytics permission required." }, { status: 403 });
  return NextResponse.json(await getServerHitTotals(), { headers: { "Cache-Control": "private, no-store" } });
}
