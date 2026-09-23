import { NextRequest } from "next/server";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { financeAuthorization, financeDbError, financeJson, isUuid } from "@/lib/finance/api";
import { firstIssue, lineUpdateSchema } from "@/lib/finance/schemas";

/** Updates a booking's financial line: who collected the payment, fees, refunds, supplier cost, no-show. */
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasValidRequestOrigin(request)) return financeJson({ error: "Invalid origin." }, 403);
  const { id } = await context.params;
  if (!isUuid(id)) return financeJson({ error: "Invalid booking line." }, 400);
  const { supabase, user, allowed } = await financeAuthorization("manage_finance");
  if (!user) return financeJson({ error: "Sign in required." }, 401);
  if (!allowed) return financeJson({ error: "Finance management access required." }, 403);
  const body = await request.json().catch(() => null);
  const parsed = lineUpdateSchema.safeParse(body);
  if (!parsed.success) return financeJson({ error: firstIssue(parsed.error) }, 400);
  const { data, error } = await supabase.rpc("finance_update_line", { p_line_id: id, p_changes: parsed.data });
  if (error) return financeDbError(error);
  return financeJson({ line: data });
}
