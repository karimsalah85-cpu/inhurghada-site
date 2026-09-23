import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fromMinor, type FinanceCurrency } from "@/lib/finance/money";
import {
  balanceLabel, balancesByCurrency, usdBalance, withRunningBalances,
  type LatestRates, type LedgerEntry,
} from "@/lib/finance/supplier-ledger";

/**
 * Supplier finance reads. Always called with the signed-in user's client so
 * row-level security (view_finance) applies on top of the route checks.
 */

const MISSING = new Set(["42P01", "42703", "42883", "PGRST200", "PGRST202", "PGRST205"]);

export class FinanceNotConfiguredError extends Error {
  constructor() { super("The finance database migrations have not been applied yet."); }
}

function check<T>(result: { data: T | null; error: { code?: string; message: string } | null }): T {
  if (result.error) {
    if (MISSING.has(result.error.code || "")) throw new FinanceNotConfiguredError();
    throw new Error(result.error.message);
  }
  return result.data as T;
}

export async function latestRates(supabase: SupabaseClient): Promise<LatestRates> {
  const rows = check(await supabase.from("fx_rates").select("currency,usd_per_unit,rate_date").order("rate_date", { ascending: false }).limit(60));
  const rates: LatestRates = {};
  for (const row of rows as { currency: FinanceCurrency; usd_per_unit: string; rate_date: string }[]) {
    rates[row.currency] ??= { usd_per_unit: String(row.usd_per_unit), rate_date: row.rate_date };
  }
  return rates;
}

type BalanceRow = { supplier_id: string; currency: FinanceCurrency; balance: string; usd_pending_entries: number; last_entry_date: string | null };

export async function supplierSummaries(supabase: SupabaseClient) {
  const [suppliers, balances, rates, errors] = await Promise.all([
    supabase.from("suppliers").select("id,name,type,active,default_currency").order("name"),
    supabase.from("supplier_balances").select("supplier_id,currency,balance,usd_pending_entries,last_entry_date"),
    latestRates(supabase),
    supabase.from("finance_sync_errors").select("id,booking_id,context,message,created_at").is("resolved_at", null).order("created_at", { ascending: false }).limit(20),
  ]);
  const balanceRows = check(balances) as BalanceRow[];
  return {
    rates,
    syncErrors: check(errors),
    suppliers: (check(suppliers) as { id: string; name: string; type: string; active: boolean; default_currency: string }[]).map((supplier) => {
      const own = balanceRows.filter((row) => row.supplier_id === supplier.id);
      const byCurrency = balancesByCurrency(own.map((row) => ({ amount: String(row.balance), currency: row.currency, entry_date: "" })));
      const usd = usdBalance(byCurrency, rates);
      return {
        ...supplier,
        balances: own.filter((row) => Number(row.balance) !== 0).map((row) => ({ currency: row.currency, balance: String(row.balance) })),
        usd_balance: fromMinor(usd.usdMinor),
        missing_rates: usd.missing,
        label: balanceLabel(byCurrency, usd.usdMinor),
        last_entry_date: own.reduce<string | null>((latest, row) => (row.last_entry_date && (!latest || row.last_entry_date > latest) ? row.last_entry_date : latest), null),
      };
    }),
  };
}

export type SupplierBookingRow = {
  line_id: string;
  booking_id: string;
  reference: string;
  line_no: number;
  trip_date: string | null;
  tour_name: string | null;
  guests: number;
  currency: FinanceCurrency;
  net_selling_price: string;
  collected_by: "daily_red_sea" | "supplier";
  collection_status: "not_collected" | "partial" | "collected";
  collected_amount: string;
  outcome: string;
  included: boolean;
  margin_amount: string | null;
  margin_pct: string | null;
  margin_amount_usd: string | null;
  margin_pct_usd: string | null;
  current_supplier: boolean;
  ledger_state: string | null;
  supplier_cost_paid_status: string | null;
  commission_received_status: string | null;
  /** This supplier's open balances on the line, per currency. */
  balances: { currency: FinanceCurrency; balance: string }[];
};

export async function supplierDetail(supabase: SupabaseClient, supplierId: string) {
  type Supplier = { id: string; name: string; type: string; contact_name: string | null; phone: string | null; email: string | null; default_currency: string; active: boolean };
  const supplier = check(await supabase.from("suppliers").select("id,name,type,contact_name,phone,email,default_currency,active").eq("id", supplierId).maybeSingle()) as Supplier | null;
  if (!supplier) return null;

  const [entriesResult, lineBalancesResult, currentLinesResult, rates] = await Promise.all([
    supabase.from("supplier_ledger").select("*").eq("supplier_id", supplierId).order("entry_date").order("entry_no").limit(10000),
    supabase.from("supplier_line_balances").select("line_id,currency,balance").eq("supplier_id", supplierId),
    supabase.from("booking_financial_lines").select("id").eq("supplier_id", supplierId).limit(5000),
    latestRates(supabase),
  ]);
  const entries = check(entriesResult) as LedgerEntry[];
  const lineBalances = check(lineBalancesResult) as { line_id: string; currency: FinanceCurrency; balance: string }[];
  const lineIds = [...new Set([
    ...(check(currentLinesResult) as { id: string }[]).map((row) => row.id),
    ...lineBalances.map((row) => row.line_id),
  ])];

  const lines: SupplierBookingRow[] = [];
  const references = new Map<string, string>();
  for (let index = 0; index < lineIds.length; index += 200) {
    const chunk = lineIds.slice(index, index + 200);
    const [lineRows, statusRows] = await Promise.all([
      supabase.from("booking_financial_lines").select("id,booking_id,line_no,trip_date,tour_name,guests,currency,net_selling_price,collected_by,collection_status,collected_amount,outcome,included,supplier_id,margin_amount,margin_pct,margin_amount_usd,margin_pct_usd,booking_financials(reference)").in("id", chunk),
      supabase.from("booking_financial_line_status").select("line_id,ledger_state,supplier_cost_paid_status,commission_received_status").in("line_id", chunk),
    ]);
    const statuses = new Map((check(statusRows) as { line_id: string; ledger_state: string; supplier_cost_paid_status: string; commission_received_status: string }[]).map((row) => [row.line_id, row]));
    for (const row of check(lineRows) as (Record<string, unknown> & { id: string; booking_id: string; supplier_id: string | null; booking_financials: { reference: string } | { reference: string }[] | null })[]) {
      const header = Array.isArray(row.booking_financials) ? row.booking_financials[0] : row.booking_financials;
      const reference = header?.reference || row.booking_id.slice(0, 8);
      references.set(row.booking_id, reference);
      const current = row.supplier_id === supplierId;
      const status = current ? statuses.get(row.id) : undefined;
      lines.push({
        line_id: row.id, booking_id: row.booking_id, reference, line_no: row.line_no as number,
        trip_date: row.trip_date as string | null, tour_name: row.tour_name as string | null, guests: row.guests as number,
        currency: row.currency as FinanceCurrency, net_selling_price: String(row.net_selling_price),
        collected_by: row.collected_by as SupplierBookingRow["collected_by"], collection_status: row.collection_status as SupplierBookingRow["collection_status"],
        collected_amount: String(row.collected_amount), outcome: row.outcome as string, included: row.included as boolean,
        margin_amount: row.margin_amount === null ? null : String(row.margin_amount), margin_pct: row.margin_pct === null ? null : String(row.margin_pct),
        margin_amount_usd: row.margin_amount_usd === null ? null : String(row.margin_amount_usd), margin_pct_usd: row.margin_pct_usd === null ? null : String(row.margin_pct_usd),
        current_supplier: current,
        ledger_state: status?.ledger_state ?? null,
        supplier_cost_paid_status: status?.supplier_cost_paid_status ?? null,
        commission_received_status: status?.commission_received_status ?? null,
        balances: lineBalances.filter((balance) => balance.line_id === row.id && Number(balance.balance) !== 0).map(({ currency, balance }) => ({ currency, balance: String(balance) })),
      });
    }
  }
  lines.sort((a, b) => (b.trip_date || "").localeCompare(a.trip_date || "") || a.reference.localeCompare(b.reference) || a.line_no - b.line_no);

  const withReferences = entries.map((entry) => ({ ...entry, amount: String(entry.amount), amount_usd: entry.amount_usd === null ? null : String(entry.amount_usd), booking_reference: entry.booking_id ? references.get(entry.booking_id) ?? null : null }));
  const byCurrency = balancesByCurrency(withReferences);
  const usd = usdBalance(byCurrency, rates);
  return {
    supplier,
    rates,
    entries: withReferences,
    ledger: withRunningBalances(withReferences),
    lines,
    openLineIds: [...new Set(lineBalances.filter((row) => Number(row.balance) !== 0).map((row) => row.line_id))],
    balances: [...byCurrency].filter(([, minor]) => minor !== 0n).map(([currency, minor]) => ({ currency, balance: fromMinor(minor) })),
    usd_balance: fromMinor(usd.usdMinor),
    missing_rates: usd.missing,
    label: balanceLabel(byCurrency, usd.usdMinor),
  };
}
