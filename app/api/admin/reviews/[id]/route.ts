import { NextRequest, NextResponse } from "next/server";
import { hasLivePermission } from "@/lib/admin-permission";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { createClient } from "@/utils/supabase/server";

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!(await hasLivePermission(supabase, user, "content"))) return json({ error: "Unauthorized." }, 401);

  const { id } = await context.params;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const status = body?.status;
  if (status !== "approved" && status !== "rejected") return json({ error: "Status must be approved or rejected." }, 400);

  const { data: before, error: readError } = await supabase.from("reviews").select("*").eq("id", id).single();
  if (readError) return json({ error: "Review not found." }, 404);

  const { data, error } = await supabase
    .from("reviews")
    .update({ status, moderated_by: user!.id, moderated_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return json({ error: error.message }, 400);

  await supabase.rpc("record_admin_audit", { action_name: "update", resource_name: "review", resource_identifier: id, summary_text: `${status === "approved" ? "Approved" : "Rejected"} a trip review`, before_value: before, after_value: data });
  return json({ review: data });
}
