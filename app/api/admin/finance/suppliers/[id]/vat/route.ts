import { NextRequest } from "next/server";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { financeAuthorization, financeDbError, financeJson, isUuid } from "@/lib/finance/api";
import { firstIssue, partnerVatStatusSchema } from "@/lib/finance/schemas";

/** Sets a partner's VAT status (not registered / VAT included / VAT on top), optionally re-applied to their trips from a date. */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasValidRequestOrigin(request)) return financeJson({ error: "Invalid origin." }, 403);
  const { id } = await context.params;
  if (!isUuid(id)) return financeJson({ error: "Invalid partner." }, 400);
  const { supabase, user, allowed } = await financeAuthorization("manage_finance");
  if (!user) return financeJson({ error: "Sign in required." }, 401);
  if (!allowed) return financeJson({ error: "Finance management access required." }, 403);
  const parsed = partnerVatStatusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return financeJson({ error: firstIssue(parsed.error) }, 400);
  const { data, error } = await supabase.rpc("finance_set_partner_vat_status", {
    p_supplier_id: id, p_status: parsed.data.vat_status, p_apply_from: parsed.data.apply_from,
  });
  if (error) return financeDbError(error);
  return financeJson({ result: data });
}
