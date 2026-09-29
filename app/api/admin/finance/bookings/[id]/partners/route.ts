import { NextRequest } from "next/server";
import { financeAuthorization, financeDbError, financeJson, isUuid } from "@/lib/finance/api";

/** Every trip on a booking with its main partner, extra partners and margin, plus the partners to choose from. */
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!isUuid(id)) return financeJson({ error: "Invalid booking." }, 400);
  const { supabase, user, allowed } = await financeAuthorization("view_finance");
  if (!user) return financeJson({ error: "Sign in required." }, 401);
  if (!allowed) return financeJson({ error: "Finance access required." }, 403);
  const [lines, partnerCosts, suppliers] = await Promise.all([
    supabase.from("booking_financial_lines")
      .select("id,line_no,tour_name,trip_date,currency,net_selling_price,outcome,included,supplier_id,supplier_cost,supplier_cost_currency,supplier_cost_source,supplier_cancellation_fee,collected_by,recognised_revenue,recognised_supplier_cost,extra_partner_cost_booking_ccy,margin_amount,margin_pct,margin_amount_usd,total_partner_cost_usd")
      .eq("booking_id", id).neq("outcome", "removed").order("line_no"),
    supabase.from("booking_line_partner_costs")
      .select("id,line_id,supplier_id,role,cost,currency,cancellation_fee,cost_source,status,removed_reason,note,recognised_cost,fx_locked,suppliers(name)")
      .eq("booking_id", id).order("created_at"),
    supabase.from("suppliers").select("id,name,type,active,default_currency").order("name"),
  ]);
  const error = lines.error || partnerCosts.error || suppliers.error;
  if (error) return financeDbError(error);
  const { allowed: canManage } = await financeAuthorization("manage_finance");
  return financeJson({ lines: lines.data, partnerCosts: partnerCosts.data, suppliers: suppliers.data, canManage });
}
