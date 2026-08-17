import { NextRequest, NextResponse } from "next/server";
import { hasAdminPermission } from "@/lib/admin-auth";
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
  if (!hasAdminPermission(user, "suppliers")) return json({ error: "Unauthorized." }, 401);
  const { error } = await supabase.from(tables[type as keyof typeof tables]).delete().eq("id", id);
  if (error) return json({ error: "Could not delete this record." }, 500);
  return json({ ok: true });
}
