import { NextRequest, NextResponse } from "next/server";
import { hasLivePermission } from "@/lib/admin-permission";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { createClient } from "@/utils/supabase/server";

const tables = { supplier: "suppliers", sales_person: "sales_people" } as const;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

export async function DELETE(request: NextRequest, context: { params: Promise<{ type: string; id: string }> }) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  const { type, id } = await context.params;
  if (!Object.hasOwn(tables, type) || !uuidPattern.test(id)) return json({ error: "Invalid partner identifier." }, 400);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!(await hasLivePermission(supabase, user, "suppliers"))) return json({ error: "Unauthorized." }, 401);
  const { error } = await supabase.from(tables[type as keyof typeof tables]).delete().eq("id", id);
  if (error) return json({ error: "Could not delete this record." }, 500);
  return json({ ok: true });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ type: string; id: string }> }) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  const { type, id } = await context.params;
  if (!Object.hasOwn(tables, type) || !uuidPattern.test(id)) return json({ error: "Invalid partner identifier." }, 400);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!(await hasLivePermission(supabase, user, "suppliers"))) return json({ error: "Unauthorized." }, 401);

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const name = String(body?.name || "").trim().slice(0, 120);
  const phone = String(body?.phone || "").trim().slice(0, 40) || null;
  const email = String(body?.email || "").trim().toLowerCase().slice(0, 160) || null;
  const notes = String(body?.notes || "").trim().slice(0, 500) || null;
  if (name.length < 2 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return json({ error: "Enter a valid name and email address." }, 400);

  const record: Record<string, unknown> = { name, phone, email, notes };
  if (type === "supplier") {
    record.contact_name = String(body?.contact_name || "").trim().slice(0, 120) || null;
    const supplierType = String(body?.supplier_type || "").trim().toLowerCase();
    if (["boat", "driver", "guide", "other"].includes(supplierType)) record.type = supplierType;
  }
  if (type === "sales_person") {
    const commission = body?.commission_percent === "" || body?.commission_percent == null ? null : Number(body.commission_percent);
    if (commission !== null && (!Number.isFinite(commission) || commission < 0 || commission > 100)) return json({ error: "Commission must be between 0 and 100%." }, 400);
    record.commission_percent = commission;
  }

  const { data, error } = await supabase.from(tables[type as keyof typeof tables]).update(record).eq("id", id).select().single();
  if (error) return json({ error: `Could not update the ${type === "supplier" ? "supplier" : "sales person"}.` }, 500);
  return json({ partner: data, type });
}
