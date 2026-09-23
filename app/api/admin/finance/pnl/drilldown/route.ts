import { NextRequest } from "next/server";
import { financeAuthorization, financeDbError, financeJson } from "@/lib/finance/api";
import { drilldown } from "@/lib/finance/pnl";
import { firstIssue } from "@/lib/finance/schemas";
import { parseReportQuery, reportExpenses, reportLines } from "@/lib/finance/reporting-data";

const LIMIT = 500;

/** The bookings or expenses behind one P&L line (?key=net_sales, opex:google_ads, ...), with the same filters. */
export async function GET(request: NextRequest) {
  const { supabase, user, allowed } = await financeAuthorization("view_finance");
  if (!user) return financeJson({ error: "Sign in required." }, 401);
  if (!allowed) return financeJson({ error: "Finance access required." }, 403);
  const params = new URLSearchParams(request.nextUrl.searchParams);
  const key = params.get("key") || "";
  params.delete("key");
  if (!/^(gross|discounts|refunds|net_sales|supplier_costs|gross_profit|agent_commissions|payment_fees|contribution|opex|opex:[a-z0-9_]{1,40})$/.test(key)) {
    return financeJson({ error: "Unknown P&L line." }, 400);
  }
  const parsed = parseReportQuery(params);
  if (!parsed.success) return financeJson({ error: firstIssue(parsed.error) }, 400);
  try {
    const isExpense = key.startsWith("opex");
    const rows = drilldown(key, isExpense ? [] : await reportLines(supabase, parsed.data, parsed.data), isExpense ? await reportExpenses(supabase, parsed.data) : []) || [];
    return financeJson({ key, total: rows.length, truncated: rows.length > LIMIT, rows: rows.slice(0, LIMIT) });
  } catch (error) {
    return financeDbError(error);
  }
}
