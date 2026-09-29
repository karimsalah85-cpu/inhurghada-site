import { NextRequest, NextResponse } from "next/server";
import { hasLivePermission } from "@/lib/admin-permission";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { normalizePartnerRecord } from "@/lib/partner-record";
import { createClient } from "@/utils/supabase/server";

const tables = { supplier: "suppliers", sales_person: "sales_people" } as const;
type PartnerType = keyof typeof tables;
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const type = String(body?.type || "") as PartnerType;
  if (!Object.hasOwn(tables, type)) return json({ error: "Choose supplier or sales person." }, 400);

  // Suppliers can also be created inline while assigning one to a booking, so
  // booking editors are allowed to add them; sales people stay supplier-scoped.
  const canManage = (await hasLivePermission(supabase, user, "suppliers"))
    || (type === "supplier" && (await hasLivePermission(supabase, user, "bookings")));
  if (!canManage) return json({ error: "Unauthorized." }, 401);
  const normalized = normalizePartnerRecord(type, body);
  if ("error" in normalized) return json({ error: normalized.error }, 400);
  const record = normalized.record;

  const { data, error } = await supabase.from(tables[type]).insert(record).select().single();
  if (error && error.code === "PGRST205") return json({ error: "The admin database migration must be applied before suppliers and sales people can be created." }, 503);
  if (error) return json({ error: `Could not create the ${type === "supplier" ? "supplier" : "sales person"}.` }, 500);
  return json({ partner: data, type }, 201);
}
