import { NextRequest } from "next/server";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { financeAuthorization, financeDbError, financeJson, isUuid } from "@/lib/finance/api";
import { firstIssue, partnerCostAddSchema } from "@/lib/finance/schemas";

/** Adds an extra partner (guide, driver, hotel ...) and their cost to one trip. */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasValidRequestOrigin(request)) return financeJson({ error: "Invalid origin." }, 403);
  const { id } = await context.params;
  if (!isUuid(id)) return financeJson({ error: "Invalid trip." }, 400);
  const { supabase, user, allowed } = await financeAuthorization("manage_finance");
  if (!user) return financeJson({ error: "Sign in required." }, 401);
  if (!allowed) return financeJson({ error: "Finance management access required." }, 403);
  const parsed = partnerCostAddSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return financeJson({ error: firstIssue(parsed.error) }, 400);
  const input = parsed.data;
  const { data, error } = await supabase.rpc("finance_add_partner_cost", {
    p_line_id: id, p_supplier_id: input.supplier_id, p_role: input.role, p_cost: input.cost, p_currency: input.cost === null ? null : input.currency,
    p_cancellation_fee: input.cancellation_fee, p_note: input.note,
  });
  if (error) return financeDbError(error);
  return financeJson({ partnerCost: data }, 201);
}
