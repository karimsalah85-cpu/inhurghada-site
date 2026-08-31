import { NextRequest, NextResponse } from "next/server";
import { getAdminAuthorization } from "@/lib/admin-permission";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { createAdminClient } from "@/utils/supabase/admin";
import { insertExpense, loadExpenseTypeKeys, normalizeExpensePayload } from "@/lib/admin-expense-write";

const BUCKET = "expense-invoices";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!uuidPattern.test(id)) return json({ error: "Invalid invoice identifier." }, 400);
  const { supabase, allowed } = await getAdminAuthorization("view_expenses");
  if (!allowed) return json({ error: "Expense-viewing permission required." }, 403);

  const { data: invoice } = await supabase
    .from("expense_invoices")
    .select("file_path")
    .eq("id", id)
    .maybeSingle();
  if (!invoice) return json({ error: "Invoice not found." }, 404);

  const admin = createAdminClient();
  if (!admin) return json({ error: "Storage is not configured on this server." }, 503);
  const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(invoice.file_path, 300);
  if (error || !data) return json({ error: "Could not open the invoice file." }, 500);
  return json({ url: data.signedUrl });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  const { id } = await context.params;
  if (!uuidPattern.test(id)) return json({ error: "Invalid invoice identifier." }, 400);
  const { supabase, user, allowed } = await getAdminAuthorization("edit_expenses");
  if (!allowed) return json({ error: "Expense-editing permission required." }, 403);

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const action = String(body?.action || "");

  const { data: invoice } = await supabase.from("expense_invoices").select("*").eq("id", id).maybeSingle();
  if (!invoice) return json({ error: "Invoice not found." }, 404);
  if (invoice.status !== "pending") return json({ error: "This invoice has already been reviewed." }, 409);

  if (action === "reject") {
    const { data, error } = await supabase
      .from("expense_invoices")
      .update({ status: "rejected", reviewed_at: new Date().toISOString(), reviewed_by: user?.email || null })
      .eq("id", id)
      .eq("status", "pending")
      .select()
      .single();
    if (error) return json({ error: "Could not discard the invoice." }, 500);
    await supabase.rpc("record_admin_audit", {
      action_name: "update",
      resource_name: "expense_invoice",
      resource_identifier: id,
      summary_text: `Discarded invoice ${invoice.file_name}`,
      before_value: invoice,
      after_value: { ...data, actor: user?.email },
    });
    return json({ invoice: data });
  }

  if (action === "post") {
    const normalized = normalizeExpensePayload(body, await loadExpenseTypeKeys(supabase));
    if ("error" in normalized) return json({ error: normalized.error }, normalized.status);

    const result = await insertExpense(supabase, normalized.value);
    if ("error" in result) return json({ error: result.error }, result.status);

    const { data, error } = await supabase
      .from("expense_invoices")
      .update({
        status: "posted",
        expense_id: result.expense.id,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.email || null,
      })
      .eq("id", id)
      .eq("status", "pending")
      .select()
      .single();
    if (error) {
      console.error("Expense invoice post link failed", { code: error.code, message: error.message });
      return json({ expense: result.expense, warning: "Expense saved, but the invoice could not be marked as posted." }, 201);
    }
    await supabase.rpc("record_admin_audit", {
      action_name: "create",
      resource_name: "expense",
      resource_identifier: result.expense.id,
      summary_text: `Posted expense ${normalized.value.description} from invoice ${invoice.file_name}`,
      after_value: { ...result.expense, invoice_id: id, actor: user?.email },
    });
    return json(
      result.warning
        ? { expense: result.expense, invoice: data, warning: result.warning }
        : { expense: result.expense, invoice: data },
      201,
    );
  }

  return json({ error: "Unknown action." }, 400);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  const { id } = await context.params;
  if (!uuidPattern.test(id)) return json({ error: "Invalid invoice identifier." }, 400);
  const { supabase, user, allowed } = await getAdminAuthorization("edit_expenses");
  if (!allowed) return json({ error: "Expense-editing permission required." }, 403);

  const { data: before } = await supabase.from("expense_invoices").select("*").eq("id", id).maybeSingle();
  if (!before) return json({ error: "Invoice not found." }, 404);

  const admin = createAdminClient();
  if (admin) {
    const { error: storageError } = await admin.storage.from(BUCKET).remove([before.file_path]);
    if (storageError) console.error("Expense invoice file delete failed", { message: storageError.message });
  }

  const { error } = await supabase.from("expense_invoices").delete().eq("id", id);
  if (error) return json({ error: "Could not delete the invoice." }, 500);

  await supabase.rpc("record_admin_audit", {
    action_name: "delete",
    resource_name: "expense_invoice",
    resource_identifier: id,
    summary_text: `Deleted invoice ${before.file_name}`,
    before_value: { ...before, actor: user?.email },
  });
  return json({ ok: true });
}
