import { NextRequest } from "next/server";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { financeAuthorization, financeDbError, financeJson } from "@/lib/finance/api";
import { firstIssue, transactionTaxSchema } from "@/lib/finance/schemas";

/** Sets or clears the VAT rate on one trip sale, main partner cost, extra partner cost or expense. */
export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return financeJson({ error: "Invalid origin." }, 403);
  const { supabase, user, allowed } = await financeAuthorization("manage_finance");
  if (!user) return financeJson({ error: "Sign in required." }, 401);
  if (!allowed) return financeJson({ error: "Finance management access required." }, 403);
  const parsed = transactionTaxSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return financeJson({ error: firstIssue(parsed.error) }, 400);
  const { target, id, tax_rate_id } = parsed.data;
  const { data, error } = await supabase.rpc("finance_set_transaction_tax", { p_target: target, p_id: id, p_tax_rate_id: tax_rate_id });
  if (error) return financeDbError(error);
  return financeJson({ tax: data });
}
