import { NextRequest, NextResponse } from "next/server";
import { getAdminAuthorization } from "@/lib/admin-permission";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { loadExpenseTypeKeys, normalizeExpensePayload } from "@/lib/admin-expense-write";

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
  // Same validation as create; classification fields are only changed when the form sends them.
  const normalized = normalizeExpensePayload(body, await loadExpenseTypeKeys(supabase));
  if ("error" in normalized) return json({ error: normalized.error }, normalized.status);
  const value = normalized.value;
  const { data: before } = await supabase.from("expenses").select("*").eq("id", id).maybeSingle();
  if (!before) return json({ error: "Expense not found." }, 404);
  if (before.voided_at) return json({ error: "A voided expense cannot be edited." }, 409);
  const sent = (key: string) => Boolean(body && Object.hasOwn(body, key));
  const update: Record<string, unknown> = {
    description: value.description, amount: value.amount, expense_date: value.date, category: value.category || null,
    ...(sent("currency") ? { currency: value.currency } : {}),
    ...(sent("expense_type") ? { expense_type: value.expenseType } : {}),
    ...(sent("supplier_id") ? { supplier_id: value.supplierId } : {}),
    ...(sent("sales_person_id") ? { sales_person_id: value.salesPersonId } : {}),
    ...(sent("booking_id") ? { booking_id: value.bookingId } : {}),
    ...(sent("vendor") ? { vendor: value.vendor } : {}),
    ...(sent("invoice_number") ? { invoice_number: value.invoiceNumber } : {}),
  };
  const { data, error } = await supabase.from("expenses").update(update).eq("id", id).select().single();
  if (error?.code === "23505") return json({ error: "An expense with this vendor and invoice number is already recorded." }, 409);
  if (error) return json({ error: "Could not update the expense." }, 500);
  await supabase.rpc("record_admin_audit", { action_name: "update", resource_name: "expense", resource_identifier: id, summary_text: `Updated expense ${value.description}`, before_value: before, after_value: { ...data, actor: user?.email } });
  return json({ expense: data });
}
