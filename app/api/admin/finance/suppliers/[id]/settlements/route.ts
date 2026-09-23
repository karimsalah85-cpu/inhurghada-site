import { NextRequest } from "next/server";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { financeAuthorization, financeDbError, financeJson, isUuid } from "@/lib/finance/api";
import { firstIssue, netSettlementSchema } from "@/lib/finance/schemas";

/** Nets the open balances of the selected bookings into one settlement. Idempotent by idempotency_key. */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasValidRequestOrigin(request)) return financeJson({ error: "Invalid origin." }, 403);
  const { id } = await context.params;
  if (!isUuid(id)) return financeJson({ error: "Invalid supplier." }, 400);
  const { supabase, user, allowed } = await financeAuthorization("manage_finance");
  if (!user) return financeJson({ error: "Sign in required." }, 401);
  if (!allowed) return financeJson({ error: "Finance management access required." }, 403);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const parsed = netSettlementSchema.safeParse({ ...body, supplier_id: id });
  if (!parsed.success) return financeJson({ error: firstIssue(parsed.error) }, 400);
  const { data, error } = await supabase.rpc("finance_post_net_settlement", {
    p_idempotency_key: parsed.data.idempotency_key, p_supplier_id: id, p_line_ids: parsed.data.line_ids,
    p_entry_date: parsed.data.entry_date, p_note: parsed.data.note,
  });
  if (error) return financeDbError(error);
  return financeJson({ settlement: data }, (data as { replayed?: boolean })?.replayed ? 200 : 201);
}
