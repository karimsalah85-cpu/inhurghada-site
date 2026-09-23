import { NextRequest } from "next/server";
import { financeAuthorization, financeDbError, financeJson } from "@/lib/finance/api";
import { toCsv } from "@/lib/finance/csv";
import { marginsBy, type MarginGroup } from "@/lib/finance/pnl";
import { firstIssue } from "@/lib/finance/schemas";
import { describeFilters, marginThreshold, parseReportQuery, reportFilterOptions, reportLines } from "@/lib/finance/reporting-data";

const groups: MarginGroup[] = ["booking", "tour", "supplier", "destination"];

/** Margin per booking / tour / supplier / destination (USD), with negative and below-threshold flags. ?format=csv exports. */
export async function GET(request: NextRequest) {
  const { supabase, user, allowed } = await financeAuthorization("view_finance");
  if (!user) return financeJson({ error: "Sign in required." }, 401);
  if (!allowed) return financeJson({ error: "Finance access required." }, 403);
  const params = new URLSearchParams(request.nextUrl.searchParams);
  const group = (params.get("group") || "booking") as MarginGroup;
  if (!groups.includes(group)) return financeJson({ error: "Group by booking, tour, supplier or destination." }, 400);
  const format = params.get("format");
  for (const key of ["group", "format"]) params.delete(key);
  const parsed = parseReportQuery(params);
  if (!parsed.success) return financeJson({ error: firstIssue(parsed.error) }, 400);
  const query = parsed.data;
  try {
    const [lines, threshold, options] = await Promise.all([reportLines(supabase, query, query), marginThreshold(supabase), reportFilterOptions(supabase)]);
    const rows = marginsBy(group, lines, threshold);
    const pending = lines.length - lines.filter((line) => line.margin_amount_usd !== null && line.net_sales_usd !== null).length;
    if (format === "csv") {
      const filters = describeFilters(query, { supplier: options.suppliers.find((supplier) => supplier.id === query.supplier)?.name });
      const csv = toCsv([
        ["Daily Red Sea margins (USD, accrual by trip date) - management reporting"],
        ["Period", `${query.from} to ${query.to}`], ["Grouped by", group], ["Filters", filters || "none"], ["Flag threshold", `${threshold}%`],
        [],
        ["Name", "Bookings", "Net sales (USD)", "Margin (USD)", "Margin %", "Flag"],
        ...rows.map((row) => [row.label, row.bookings, row.net_sales, row.margin, row.margin_pct === null ? "" : `${row.margin_pct}%`, row.flag ?? ""]),
      ]);
      return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="margins-by-${group}-${query.from}-to-${query.to}.csv"`, "Cache-Control": "private, no-store" } });
    }
    return financeJson({ configured: true, query, group, threshold, rows, pending, options });
  } catch (error) {
    return financeDbError(error);
  }
}
