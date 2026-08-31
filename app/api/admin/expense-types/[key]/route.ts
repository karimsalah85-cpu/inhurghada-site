import { NextRequest, NextResponse } from "next/server";
import { getAdminAuthorization } from "@/lib/admin-permission";
import { hasValidRequestOrigin } from "@/lib/request-origin";

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

const keyPattern = /^[a-z0-9_]{2,40}$/;

export async function PATCH(request: NextRequest, context: { params: Promise<{ key: string }> }) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  const { key } = await context.params;
  if (!keyPattern.test(key)) return json({ error: "Invalid expense type." }, 400);
  const { supabase, user, allowed } = await getAdminAuthorization("edit_expenses");
  if (!allowed) return json({ error: "Expense-editing permission required." }, 403);

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const label = String(body?.label || "").trim().slice(0, 80);
  if (label.length < 2) return json({ error: "Enter an expense type name of at least two letters." }, 400);

  const { data: before } = await supabase.from("expense_types").select("*").eq("key", key).maybeSingle();
  if (!before) return json({ error: "Expense type not found." }, 404);
  if (before.is_system) return json({ error: "Built-in expense types cannot be renamed." }, 409);

  const { data, error } = await supabase.from("expense_types").update({ label }).eq("key", key).select().single();
  if (error) return json({ error: "Could not rename the expense type." }, 500);

  await supabase.rpc("record_admin_audit", {
    action_name: "update",
    resource_name: "expense_type",
    resource_identifier: key,
    summary_text: `Renamed expense type to ${label}`,
    before_value: before,
    after_value: { ...data, actor: user?.email },
  });
  return json({ type: data });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ key: string }> }) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  const { key } = await context.params;
  if (!keyPattern.test(key)) return json({ error: "Invalid expense type." }, 400);
  const { supabase, user, allowed } = await getAdminAuthorization("edit_expenses");
  if (!allowed) return json({ error: "Expense-editing permission required." }, 403);

  const { data: before } = await supabase.from("expense_types").select("*").eq("key", key).maybeSingle();
  if (!before) return json({ error: "Expense type not found." }, 404);
  if (before.is_system) return json({ error: "Built-in expense types cannot be removed." }, 409);

  const { error } = await supabase.from("expense_types").delete().eq("key", key);
  if (error) return json({ error: "Could not remove the expense type." }, 500);

  await supabase.rpc("record_admin_audit", {
    action_name: "delete",
    resource_name: "expense_type",
    resource_identifier: key,
    summary_text: `Removed expense type ${before.label}`,
    before_value: { ...before, actor: user?.email },
  });
  return json({ ok: true });
}
