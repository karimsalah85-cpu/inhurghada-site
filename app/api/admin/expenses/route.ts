import { NextRequest, NextResponse } from "next/server";
import { getAdminAuthorization } from "@/lib/admin-permission";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { insertExpense, loadExpenseTypeKeys, normalizeExpensePayload } from "@/lib/admin-expense-write";

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  const { supabase, user, allowed } = await getAdminAuthorization("edit_expenses");
  if (!allowed) return json({ error: "Expense-editing permission required." }, 403);

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const normalized = normalizeExpensePayload(body, await loadExpenseTypeKeys(supabase));
  if ("error" in normalized) return json({ error: normalized.error }, normalized.status);

  const result = await insertExpense(supabase, normalized.value);
  if ("error" in result) return json({ error: result.error }, result.status);

  await supabase.rpc("record_admin_audit", {
    action_name: "create",
    resource_name: "expense",
    resource_identifier: result.expense.id,
    summary_text: `Created expense ${normalized.value.description}`,
    after_value: { ...result.expense, actor: user?.email },
  });
  return json(result.warning ? { expense: result.expense, warning: result.warning } : { expense: result.expense }, 201);
}
