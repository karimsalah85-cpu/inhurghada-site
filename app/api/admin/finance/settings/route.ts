import { NextRequest } from "next/server";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { financeAuthorization, financeDbError, financeJson } from "@/lib/finance/api";
import { firstIssue } from "@/lib/finance/schemas";
import { MARGIN_THRESHOLD_KEY, marginThreshold, marginThresholdSchema } from "@/lib/finance/reporting-data";

export async function GET() {
  const { supabase, user, allowed } = await financeAuthorization("view_finance");
  if (!user) return financeJson({ error: "Sign in required." }, 401);
  if (!allowed) return financeJson({ error: "Finance access required." }, 403);
  return financeJson({ margin_threshold_pct: await marginThreshold(supabase) });
}

/** Sets the margin % below which margins are flagged. */
export async function PUT(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return financeJson({ error: "Invalid origin." }, 403);
  const { supabase, user, allowed } = await financeAuthorization("manage_finance");
  if (!user) return financeJson({ error: "Sign in required." }, 401);
  if (!allowed) return financeJson({ error: "Finance management access required." }, 403);
  const parsed = marginThresholdSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return financeJson({ error: firstIssue(parsed.error) }, 400);
  const before = await marginThreshold(supabase);
  const { error } = await supabase.from("site_settings").upsert({
    key: MARGIN_THRESHOLD_KEY, value: Number(parsed.data.margin_threshold_pct), category: "finance", public: false,
    description: "Finance: margin % below which bookings, tours, suppliers and destinations are flagged.",
    updated_by: user.id, updated_at: new Date().toISOString(),
  }, { onConflict: "key" });
  if (error) return financeDbError(error);
  await supabase.rpc("record_admin_audit", { action_name: "update", resource_name: "site_setting", resource_identifier: MARGIN_THRESHOLD_KEY, summary_text: `Margin flag threshold set to ${parsed.data.margin_threshold_pct}%`, before_value: { value: before }, after_value: { value: parsed.data.margin_threshold_pct } });
  return financeJson({ margin_threshold_pct: parsed.data.margin_threshold_pct });
}
