import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { createClient } from "@/utils/supabase/server";

const tables = { supplier: "suppliers", sales_person: "sales_people" } as const;
type PartnerType = keyof typeof tables;
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAuthorizedAdmin(user)) return json({ error: "Unauthorized." }, 401);

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const type = String(body?.type || "") as PartnerType;
  if (!Object.hasOwn(tables, type)) return json({ error: "Choose supplier or sales person." }, 400);
  const name = String(body?.name || "").trim().slice(0, 120);
  const phone = String(body?.phone || "").trim().slice(0, 40) || null;
  const email = String(body?.email || "").trim().toLowerCase().slice(0, 160) || null;
  const notes = String(body?.notes || "").trim().slice(0, 500) || null;
  if (name.length < 2 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return json({ error: "Enter a valid name and email address." }, 400);

  const record: Record<string, unknown> = { name, phone, email, notes };
  if (type === "supplier") record.contact_name = String(body?.contact_name || "").trim().slice(0, 120) || null;
  if (type === "sales_person") {
    const commission = body?.commission_percent === "" || body?.commission_percent == null ? null : Number(body.commission_percent);
    if (commission !== null && (!Number.isFinite(commission) || commission < 0 || commission > 100)) return json({ error: "Commission must be between 0 and 100%." }, 400);
    record.commission_percent = commission;
  }

  const { data, error } = await supabase.from(tables[type]).insert(record).select().single();
  if (error) return json({ error: `Could not create the ${type === "supplier" ? "supplier" : "sales person"}.` }, 500);
  return json({ partner: data, type }, 201);
}
