import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fromMinor, toMinor, type FinanceCurrency } from "@/lib/finance/money";
import { computePnl, marginsBy } from "@/lib/finance/pnl";
import { expenseTypeLabels, marginThreshold, reportDirectExpenses, reportExpenses, reportLines } from "@/lib/finance/reporting-data";
import { supplierSummaries } from "@/lib/finance/supplier-data";

type Amount = string | number | null;
const cents = (value: Amount) => (value === null || value === undefined ? 0n : toMinor(value));
const sumField = <T,>(rows: T[], pick: (row: T) => Amount) => fromMinor(rows.reduce((total, row) => total + cents(pick(row)), 0n));

async function rows<T>(query: PromiseLike<{ data: T[] | null; error: { code?: string; message: string } | null }>) {
  const { data, error } = await query;
  if (error) throw Object.assign(new Error(error.message), { code: error.code });
  return data ?? [];
}

/** Everything on the reports dashboard for a date range, in USD. */
export async function financeDashboard(supabase: SupabaseClient, range: { from: string; to: string }) {
  const monthFrom = `${range.from.slice(0, 7)}-01`;
  const [lines, expenses, labels, threshold, cashFlow, cancellations, vat, partners, fx] = await Promise.all([
    reportLines(supabase, range, {}),
    reportExpenses(supabase, range),
    expenseTypeLabels(supabase),
    marginThreshold(supabase),
    rows(supabase.from("finance_cash_flow").select("*").gte("month", monthFrom).lte("month", range.to).order("month")),
    rows(supabase.from("finance_cancellation_impact").select("bookings,lost_sales_usd,retained_usd,partner_fees_usd,net_cost_usd,reason").gte("month", monthFrom).lte("month", range.to)),
    rows(supabase.from("finance_vat_summary").select("output_vat_usd,input_vat_usd,net_vat_usd").gte("month", monthFrom).lte("month", range.to)),
    supplierSummaries(supabase),
    rows(supabase.from("fx_rates").select("currency,units_per_usd,rate_date").order("rate_date", { ascending: false }).limit(60)),
  ]);

  const direct = await reportDirectExpenses(supabase, lines, range, {});
  const pnl = computePnl(lines, expenses, labels);
  const totals = Object.fromEntries(Object.entries(pnl.totals).map(([key, value]) => [key, fromMinor(value)]));

  // Partner balances: positive = the partner owes Daily Red Sea, negative = Daily Red Sea owes them.
  let weOwe = 0n; let owedToUs = 0n;
  for (const supplier of partners.suppliers) {
    const usd = toMinor(supplier.usd_balance);
    if (usd < 0n) weOwe -= usd; else owedToUs += usd;
  }
  const topOwed = partners.suppliers.filter((supplier) => toMinor(supplier.usd_balance) !== 0n)
    .sort((a, b) => Number(toMinor(a.usd_balance) - toMinor(b.usd_balance))).slice(0, 8)
    .map((supplier) => ({ id: supplier.id, name: supplier.name, usd_balance: supplier.usd_balance, balances: supplier.balances }));

  const latest: Partial<Record<FinanceCurrency, { units_per_usd: string; rate_date: string }>> = {};
  for (const rate of fx as { currency: FinanceCurrency; units_per_usd: Amount; rate_date: string }[]) {
    latest[rate.currency] ??= { units_per_usd: String(rate.units_per_usd), rate_date: rate.rate_date };
  }

  return {
    range,
    pnl: { totals, opex: pnl.opex.map((row) => ({ ...row, amount: fromMinor(row.amount) })), bookings: pnl.bookings, pending: pnl.pending },
    cashFlow: {
      months: cashFlow,
      cash_in_usd: sumField(cashFlow, (row: Record<string, Amount>) => row.cash_in_usd),
      cash_out_usd: sumField(cashFlow, (row: Record<string, Amount>) => row.cash_out_usd),
      net_cash_usd: sumField(cashFlow, (row: Record<string, Amount>) => row.net_cash_usd),
      usd_pending: cashFlow.reduce((total, row) => total + Number((row as Record<string, Amount>).usd_pending ?? 0), 0),
    },
    partners: { we_owe_usd: fromMinor(weOwe), owed_to_us_usd: fromMinor(owedToUs), top: topOwed, missing_rates: [...new Set(partners.suppliers.flatMap((supplier) => supplier.missing_rates))] },
    byTour: marginsBy("tour", lines, threshold, direct).sort((a, b) => Number(toMinor(b.net_sales) - toMinor(a.net_sales))),
    byDestination: marginsBy("destination", lines, threshold, direct).sort((a, b) => Number(toMinor(b.net_sales) - toMinor(a.net_sales))),
    cancellations: {
      bookings: cancellations.reduce((total, row) => total + Number((row as Record<string, Amount>).bookings ?? 0), 0),
      lost_sales_usd: sumField(cancellations, (row: Record<string, Amount>) => row.lost_sales_usd),
      retained_usd: sumField(cancellations, (row: Record<string, Amount>) => row.retained_usd),
      net_cost_usd: sumField(cancellations, (row: Record<string, Amount>) => row.net_cost_usd),
    },
    vat: {
      output_vat_usd: sumField(vat, (row: Record<string, Amount>) => row.output_vat_usd),
      input_vat_usd: sumField(vat, (row: Record<string, Amount>) => row.input_vat_usd),
      net_vat_usd: sumField(vat, (row: Record<string, Amount>) => row.net_vat_usd),
    },
    rates: latest,
    thresholdPct: threshold,
  };
}

export const TRANSACTION_COLUMNS = [
  ["occurred_on", "Date"], ["kind", "Type"], ["category", "Category"], ["reference", "Booking"], ["counterparty", "Guest / partner / vendor"],
  ["description", "Description"], ["currency", "Currency"], ["amount", "Amount"], ["fx_rate_to_usd", "USD per unit"], ["amount_usd", "Amount USD"],
  ["vat_amount", "VAT"], ["vat_usd", "VAT USD"], ["method", "Method / source"], ["is_cash", "Cash movement"], ["cash_effect_usd", "Cash effect USD (+ in / − out)"],
  ["is_reversal", "Reversal"], ["voided", "Voided"], ["created_by_email", "Recorded by"], ["recorded_at", "Recorded at"], ["source_table", "Source"], ["source_id", "Source id"],
] as const;

/** Every transaction in the range (by transaction date), oldest first, paging past the API row limit. */
export async function transactionsInRange(supabase: SupabaseClient, range: { from: string; to: string }) {
  const all: Record<string, unknown>[] = [];
  for (let offset = 0; ; offset += 1000) {
    const page = await rows(supabase.from("finance_transactions").select(TRANSACTION_COLUMNS.map(([key]) => key).join(","))
      .gte("occurred_on", range.from).lte("occurred_on", range.to)
      .order("occurred_on").order("recorded_at").order("source_id").range(offset, offset + 999)) as unknown as Record<string, unknown>[];
    all.push(...page);
    if (page.length < 1000) return all;
  }
}
