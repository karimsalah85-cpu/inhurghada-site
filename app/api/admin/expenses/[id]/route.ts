import { NextRequest, NextResponse } from "next/server";
import { getAdminAuthorization } from "@/lib/admin-permission";
import { hasValidRequestOrigin } from "@/lib/request-origin";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  const { id } = await context.params;
  if (!uuidPattern.test(id)) return json({ error: "Invalid expense identifier." }, 400);
  const { supabase, user, allowed } = await getAdminAuthorization("edit_expenses");
  if (!allowed) return json({ error: "Expense-editing permission required." }, 403);
  const { data: before } = await supabase.from("expenses").select("*").eq("id", id).maybeSingle();
  if (!before) return json({ error: "Expense not found." }, 404);
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) return json({ error: "Could not delete the expense." }, 500);
  await supabase.rpc("record_admin_audit", { action_name: "delete", resource_name: "expense", resource_identifier: id, summary_text: `Deleted expense ${before.description}`, before_value: { ...before, actor: user?.email } });
  return json({ ok: true });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  const { id } = await context.params;
  if (!uuidPattern.test(id)) return json({ error: "Invalid expense identifier." }, 400);
  const { supabase, user, allowed } = await getAdminAuthorization("edit_expenses");
  if (!allowed) return json({ error: "Expense-editing permission required." }, 403);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const amount = Number(body?.amount);
  const description = String(body?.description || "").trim().slice(0, 200);
  const expenseDate = String(body?.expense_date || body?.date || "");
  if (description.length < 2 || !Number.isFinite(amount) || amount <= 0 || amount > 1_000_000 || !/^\d{4}-\d{2}-\d{2}$/.test(expenseDate)) return json({ error: "Enter a description, positive amount, and valid date." }, 400);
  const { data: before } = await supabase.from("expenses").select("*").eq("id", id).maybeSingle();
  if (!before) return json({ error: "Expense not found." }, 404);
  const update = { description, amount, expense_date: expenseDate, category: String(body?.category || "").trim().slice(0, 80) || null, currency: /^[A-Z]{3}$/.test(String(body?.currency || before.currency).toUpperCase()) ? String(body?.currency || before.currency).toUpperCase() : before.currency };
  const { data, error } = await supabase.from("expenses").update(update).eq("id", id).select().single();
  if (error) return json({ error: "Could not update the expense." }, 500);
  await supabase.rpc("record_admin_audit", { action_name: "update", resource_name: "expense", resource_identifier: id, summary_text: `Updated expense ${description}`, before_value: before, after_value: { ...data, actor: user?.email } });
  return json({ expense: data });
}
