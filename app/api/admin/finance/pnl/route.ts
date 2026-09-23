import { NextRequest } from "next/server";
import { financeAuthorization, financeDbError, financeJson } from "@/lib/finance/api";
import { computePnl, grossView, monthlyTrend, netRevenueView, pnlCsv, previousPeriod } from "@/lib/finance/pnl";
import { firstIssue } from "@/lib/finance/schemas";
import { describeFilters, expenseTypeLabels, parseReportQuery, reportExpenses, reportFilterOptions, reportLines } from "@/lib/finance/reporting-data";

/** Management P&L (USD, accrual by trip date): both views, optional previous-period comparison, monthly trend. ?format=csv exports. */
export async function GET(request: NextRequest) {
  const { supabase, user, allowed } = await financeAuthorization("view_finance");
  if (!user) return financeJson({ error: "Sign in required." }, 401);
  if (!allowed) return financeJson({ error: "Finance access required." }, 403);
  const parsed = parseReportQuery(request.nextUrl.searchParams);
  if (!parsed.success) return financeJson({ error: firstIssue(parsed.error) }, 400);
  const query = parsed.data;
  const previous = query.compare ? previousPeriod(query.from, query.to) : null;
  try {
    const [lines, expenses, labels, options, previousLines, previousExpenses] = await Promise.all([
      reportLines(supabase, query, query), reportExpenses(supabase, query), expenseTypeLabels(supabase), reportFilterOptions(supabase),
      previous ? reportLines(supabase, previous, query) : Promise.resolve(null),
      previous ? reportExpenses(supabase, previous) : Promise.resolve(null),
    ]);
    const current = computePnl(lines, expenses, labels);
    const before = previousLines && previousExpenses ? computePnl(previousLines, previousExpenses, labels) : null;
    const gross = grossView(current, before);
    const net = netRevenueView(current, before);
    const filters = describeFilters(query, { supplier: options.suppliers.find((supplier) => supplier.id === query.supplier)?.name });
    if (request.nextUrl.searchParams.get("format") === "csv") {
      return new Response(pnlCsv({ from: query.from, to: query.to, previous, filters, gross, net, pending: current.pending }), {
        headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="pnl-${query.from}-to-${query.to}.csv"`, "Cache-Control": "private, no-store" },
      });
    }
    return financeJson({
      configured: true, query, previous, filters, gross, net, options,
      trend: monthlyTrend(lines, expenses, query.from, query.to),
      bookings: current.bookings, pending: current.pending,
    });
  } catch (error) {
    return financeDbError(error);
  }
}
