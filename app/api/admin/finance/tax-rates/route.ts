import { NextRequest } from "next/server";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { financeAuthorization, financeDbError, financeJson } from "@/lib/finance/api";
import { firstIssue, taxRateCreateSchema } from "@/lib/finance/schemas";

/** Every VAT rate set up, newest first. */
export async function GET() {
  const { supabase, user, allowed } = await financeAuthorization("view_finance");
  if (!user) return financeJson({ error: "Sign in required." }, 401);
  if (!allowed) return financeJson({ error: "Finance access required." }, 403);
  const { data, error } = await supabase.from("tax_rates").select("*").order("effective_from", { ascending: false }).order("code");
  if (error) return financeDbError(error);
  const { allowed: canManage } = await financeAuthorization("manage_finance");
  return financeJson({ taxRates: data, canManage });
}

/** Adds a VAT rate. Its percent, code, kind and start date can never change afterwards. */
export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return financeJson({ error: "Invalid origin." }, 403);
  const { supabase, user, allowed } = await financeAuthorization("manage_finance");
  if (!user) return financeJson({ error: "Sign in required." }, 401);
  if (!allowed) return financeJson({ error: "Finance management access required." }, 403);
  const parsed = taxRateCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return financeJson({ error: firstIssue(parsed.error) }, 400);
  const input = parsed.data;
  const { data, error } = await supabase.rpc("finance_create_tax_rate", {
    p_code: input.code, p_name: input.name, p_rate_percent: input.rate_percent, p_applies_to: input.applies_to,
    p_effective_from: input.effective_from, p_effective_to: input.effective_to,
    p_default_for_sales: input.default_for_sales, p_default_for_purchases: input.default_for_purchases, p_note: input.note,
  });
  if (error?.code === "23505") return financeJson({ error: `A rate with code ${input.code} already exists.` }, 409);
  if (error) return financeDbError(error);
  return financeJson({ taxRate: data }, 201);
}
