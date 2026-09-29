import { NextRequest, NextResponse } from "next/server";
import { hasLivePermission } from "@/lib/admin-permission";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { normalizePartnerRecord } from "@/lib/partner-record";
import { createClient } from "@/utils/supabase/server";

const tables = { supplier: "suppliers", sales_person: "sales_people" } as const;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

// Partners carry financial history (costs, ledger entries, expenses), so they
// are deactivated with PATCH { active: false } and never deleted.
export async function DELETE() {
  return json({ error: "Partners are never deleted. Deactivate them instead." }, 405);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ type: string; id: string }> }) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  const { type, id } = await context.params;
  if (!Object.hasOwn(tables, type) || !uuidPattern.test(id)) return json({ error: "Invalid partner identifier." }, 400);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!(await hasLivePermission(supabase, user, "suppliers"))) return json({ error: "Unauthorized." }, 401);

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const partnerType = type as keyof typeof tables;
  let record: Record<string, unknown>;
  if (body && Object.keys(body).length === 1 && typeof body.active === "boolean") {
    record = { active: body.active };
  } else {
    const normalized = normalizePartnerRecord(partnerType, body);
    if ("error" in normalized) return json({ error: normalized.error }, 400);
    record = normalized.record;
  }

  const { data, error } = await supabase.from(tables[partnerType]).update(record).eq("id", id).select().single();
  if (error) return json({ error: `Could not update the ${type === "supplier" ? "partner" : "sales person"}.` }, 500);
  return json({ partner: data, type });
}
