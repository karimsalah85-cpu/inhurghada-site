import type { SupabaseClient } from "@supabase/supabase-js";
import { FINANCE_CURRENCIES, type FinanceCurrency } from "@/lib/finance/money";

/**
 * Daily FX snapshots for finance reporting, from free, keyless sources:
 *  - open.er-api.com (the site's existing exchange-rate source) for today's rates;
 *  - the free currency-api on jsDelivr for exact historical dates.
 * Rates are stored as units per USD. Admin overrides (source "manual") are
 * never overwritten. There is deliberately no hardcoded fallback: a missing
 * rate stays visible as a provisional record instead of a made-up number.
 */
export type ForeignCurrency = Exclude<FinanceCurrency, "USD">;
export const FOREIGN_CURRENCIES = FINANCE_CURRENCIES.filter((currency): currency is ForeignCurrency => currency !== "USD");
export type RateSnapshot = { date: string; source: "open_er_api" | "currency_api"; unitsPerUsd: Record<ForeignCurrency, string> };

type Fetch = typeof fetch;

function rateText(value: unknown): string | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0 || value >= 1e10) return null;
  return value.toFixed(10).replace(/0+$/, "").replace(/\.$/, "");
}

function collect(read: (currency: ForeignCurrency) => unknown) {
  const unitsPerUsd = {} as Record<ForeignCurrency, string>;
  for (const currency of FOREIGN_CURRENCIES) {
    const rate = rateText(read(currency));
    if (!rate) throw new Error(`Rate source is missing a valid ${currency} rate.`);
    unitsPerUsd[currency] = rate;
  }
  return unitsPerUsd;
}

export function parseOpenErApi(payload: unknown): RateSnapshot {
  const data = payload as { result?: string; time_last_update_unix?: number; rates?: Record<string, unknown> };
  if (data?.result !== "success" || !data.rates || typeof data.time_last_update_unix !== "number") {
    throw new Error("open.er-api returned an unexpected response.");
  }
  return {
    date: new Date(data.time_last_update_unix * 1000).toISOString().slice(0, 10),
    source: "open_er_api",
    unitsPerUsd: collect((currency) => data.rates?.[currency]),
  };
}

export function parseCurrencyApi(payload: unknown, expectedDate: string): RateSnapshot {
  const data = payload as { date?: string; usd?: Record<string, unknown> };
  if (!data?.usd || data.date !== expectedDate) throw new Error(`currency-api returned no rates for ${expectedDate}.`);
  return { date: expectedDate, source: "currency_api", unitsPerUsd: collect((currency) => data.usd?.[currency.toLowerCase()]) };
}

async function getJson(fetchImpl: Fetch, url: string) {
  const response = await fetchImpl(url, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`${new URL(url).hostname} responded ${response.status}.`);
  return response.json() as Promise<unknown>;
}

export async function fetchLatestRates(fetchImpl: Fetch = fetch) {
  return parseOpenErApi(await getJson(fetchImpl, "https://open.er-api.com/v6/latest/USD"));
}

export async function fetchHistoricalRates(date: string, fetchImpl: Fetch = fetch) {
  const urls = [
    `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/v1/currencies/usd.min.json`,
    `https://${date}.currency-api.pages.dev/v1/currencies/usd.min.json`,
  ];
  let lastError: unknown;
  for (const url of urls) {
    try {
      return parseCurrencyApi(await getJson(fetchImpl, url), date);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`No historical rates for ${date}.`);
}

/** Inserts a snapshot, skipping currencies that already have a manual override (or any rate, unless replace is set). */
export async function storeSnapshot(supabase: SupabaseClient, snapshot: RateSnapshot, options: { replaceAutomatic: boolean }) {
  const { data: existing, error } = await supabase.from("fx_rates").select("currency,source").eq("rate_date", snapshot.date);
  if (error) throw error;
  const keep = new Set((existing || [])
    .filter((row) => row.source === "manual" || !options.replaceAutomatic)
    .map((row) => row.currency as string));
  const rows = FOREIGN_CURRENCIES.filter((currency) => !keep.has(currency)).map((currency) => ({
    rate_date: snapshot.date, currency, units_per_usd: snapshot.unitsPerUsd[currency], source: snapshot.source, fetched_at: new Date().toISOString(),
  }));
  if (!rows.length) return 0;
  const { error: upsertError } = await supabase.from("fx_rates").upsert(rows, { onConflict: "rate_date,currency" });
  if (upsertError) throw upsertError;
  return rows.length;
}

export type FxSyncResult = {
  status: "ok" | "partial" | "not_migrated" | "error";
  latestDate: string | null;
  backfilledDates: string[];
  refreshed: { lines: number; expenses: number } | null;
  errors: string[];
};

const MISSING_RELATION = new Set(["42P01", "PGRST205", "PGRST202"]);

/**
 * Daily job: store today's rates, backfill the exact dates provisional
 * records need (past dates only, a bounded number per run), then re-convert
 * every provisional record.
 */
export async function syncFxRates(supabase: SupabaseClient, options: { fetchImpl?: Fetch; today?: string; maxBackfill?: number } = {}): Promise<FxSyncResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const today = options.today ?? new Date().toISOString().slice(0, 10);
  const result: FxSyncResult = { status: "ok", latestDate: null, backfilledDates: [], refreshed: null, errors: [] };

  try {
    const latest = await fetchLatestRates(fetchImpl);
    await storeSnapshot(supabase, latest, { replaceAutomatic: true });
    result.latestDate = latest.date;
  } catch (error) {
    if (MISSING_RELATION.has((error as { code?: string })?.code || "")) return { ...result, status: "not_migrated" };
    result.errors.push(`Latest rates: ${error instanceof Error ? error.message : String(error)}`);
  }

  const [lines, expenses, known] = await Promise.all([
    supabase.from("booking_financial_lines").select("trip_date").or("fx_locked.eq.false,supplier_fx_locked.eq.false").not("trip_date", "is", null).lte("trip_date", today).limit(2000),
    supabase.from("expenses").select("expense_date").eq("fx_locked", false).is("voided_at", null).lte("expense_date", today).limit(2000),
    supabase.from("fx_rates").select("rate_date,currency").gte("rate_date", "2000-01-01").limit(20000),
  ]);
  const readError = lines.error || expenses.error || known.error;
  if (readError) {
    if (MISSING_RELATION.has(readError.code || "")) return { ...result, status: "not_migrated" };
    result.errors.push(`Reading provisional records: ${readError.message}`);
    return { ...result, status: "error" };
  }
  const complete = new Map<string, number>();
  for (const row of known.data || []) complete.set(row.rate_date, (complete.get(row.rate_date) || 0) + 1);
  const needed = [...new Set([...(lines.data || []).map((row) => row.trip_date as string), ...(expenses.data || []).map((row) => row.expense_date as string)])]
    .filter((date) => (complete.get(date) || 0) < FOREIGN_CURRENCIES.length)
    .sort()
    .slice(0, options.maxBackfill ?? 31);
  for (const date of needed) {
    try {
      await storeSnapshot(supabase, await fetchHistoricalRates(date, fetchImpl), { replaceAutomatic: false });
      result.backfilledDates.push(date);
    } catch (error) {
      result.errors.push(`Rates for ${date}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const { data: refreshed, error: refreshError } = await supabase.rpc("finance_refresh_unlocked_fx");
  if (refreshError) result.errors.push(`Re-converting provisional records: ${refreshError.message}`);
  else result.refreshed = refreshed as FxSyncResult["refreshed"];

  if (result.errors.length) result.status = result.latestDate || result.backfilledDates.length ? "partial" : "error";
  return result;
}
