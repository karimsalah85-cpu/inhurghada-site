import { NextRequest } from "next/server";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { financeAuthorization, financeDbError, financeJson, isUuid } from "@/lib/finance/api";
import { firstIssue, ledgerEntrySchema } from "@/lib/finance/schemas";

/** Records a payment to the supplier, commission received from the supplier, or an adjustment. */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasValidRequestOrigin(request)) return financeJson({ error: "Invalid origin." }, 403);
  const { id } = await context.params;
  if (!isUuid(id)) return financeJson({ error: "Invalid supplier." }, 400);
  const { supabase, user, allowed } = await financeAuthorization("manage_finance");
  if (!user) return financeJson({ error: "Sign in required." }, 401);
  if (!allowed) return financeJson({ error: "Finance management access required." }, 403);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const parsed = ledgerEntrySchema.safeParse({ ...body, supplier_id: id });
  if (!parsed.success) return financeJson({ error: firstIssue(parsed.error) }, 400);
  const entry = parsed.data;
  const { data, error } = await supabase.rpc("finance_post_supplier_entry", {
    p_supplier_id: id, p_entry_type: entry.entry_type, p_amount: entry.amount, p_currency: entry.currency,
    p_entry_date: entry.entry_date, p_line_id: entry.line_id, p_note: entry.note,
  });
  if (error) return financeDbError(error);
  return financeJson({ entry: data }, 201);
}
