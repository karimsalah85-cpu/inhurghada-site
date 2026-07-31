import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { isAuthorizedAdmin } from "@/lib/admin-auth";

const tables = { content: "content_items", availability: "tour_availability", staff: "staff_members", notes: "customer_notes", templates: "communication_templates", settings: "site_settings", redirects: "redirect_rules" } as const;

export async function DELETE(_request: NextRequest, context: { params: Promise<{ resource: string; id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAuthorizedAdmin(user)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { resource, id } = await context.params;
  if (!Object.hasOwn(tables, resource)) return NextResponse.json({ error: "Unknown resource." }, { status: 400 });
  const table = tables[resource as keyof typeof tables];
  const key = resource === "settings" ? "key" : "id";
  const { data: before, error: readError } = await supabase.from(table).select("*").eq(key, id).single();
  if (readError) return NextResponse.json({ error: "Record not found." }, { status: 404 });
  const { error } = await supabase.from(table).delete().eq(key, id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await supabase.rpc("record_admin_audit", { action_name: "delete", resource_name: resource, resource_identifier: id, summary_text: `Deleted ${resource} record`, before_value: before });
  return NextResponse.json({ deleted: true }, { headers: { "Cache-Control": "private, no-store" } });
}
