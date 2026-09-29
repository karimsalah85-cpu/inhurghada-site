import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { DEFAULT_EXPENSE_TYPES } from "@/lib/admin-expense-write";
import { FinanceNotConfiguredError } from "@/lib/finance/supplier-data";
import { idSchema, isoDateSchema } from "@/lib/finance/schemas";
import type { DirectExpense, PnlExpense, PnlLine } from "@/lib/finance/pnl";
import { fromMinor, toMinor } from "@/lib/finance/money";

const MISSING = new Set(["42P01", "42703", "42883", "PGRST200", "PGRST202", "PGRST205"]);
const PAGE = 1000; // PostgREST max_rows

function fail(error: { code?: string; message: string }): never {
  if (MISSING.has(error.code || "")) throw new FinanceNotConfiguredError();
  throw new Error(error.message);
}

const today = () => new Date().toISOString().slice(0, 10);
const optionalText = z.string().trim().max(120).optional().transform((value) => value || undefined);

/** Query string of every report: date range (default: month to date), comparison, and trip filters. */
export const reportQuerySchema = z.object({
  from: isoDateSchema.optional(),
  to: isoDateSchema.optional(),
  compare: z.enum(["0", "1"]).optional().transform((value) => value === "1"),
  destination: optionalText,
  tour: optionalText,
  supplier: idSchema.optional(),
  product_line: optionalText,
}).transform((query) => {
  const to = query.to ?? today();
  return { ...query, to, from: query.from ?? `${to.slice(0, 8)}01` };
}).refine((query) => query.from <= query.to, "The start date must be on or before the end date.")
  .refine((query) => Date.parse(query.to) - Date.parse(query.from) <= 5 * 366 * 86_400_000, "Choose a range of at most five years.");
export type ReportQuery = z.output<typeof reportQuerySchema>;

export function parseReportQuery(params: URLSearchParams) {
  return reportQuerySchema.safeParse(Object.fromEntries([...params].filter(([, value]) => value !== "")));
}

export const describeFilters = (query: ReportQuery, names: { supplier?: string } = {}) => [
  query.destination && `destination ${query.destination}`, query.tour && `tour ${query.tour}`,
  query.supplier && `supplier ${names.supplier || query.supplier}`, query.product_line && `product line ${query.product_line}`,
].filter(Boolean).join("; ");

type LineRow = Omit<PnlLine, "reference" | "supplier_name"> & {
  booking_financials: { reference: string } | { reference: string }[] | null;
  suppliers: { name: string } | { name: string }[] | null;
};
const one = <T,>(value: T | T[] | null) => (Array.isArray(value) ? value[0] ?? null : value);
const text = (value: unknown) => (value === null || value === undefined ? null : String(value));

/** Recognised booking lines with a trip date in range (accrual basis), filtered by trip dimensions. */
export async function reportLines(supabase: SupabaseClient, range: { from: string; to: string }, query: Partial<ReportQuery>): Promise<PnlLine[]> {
  const rows: PnlLine[] = [];
  for (let offset = 0; ; offset += PAGE) {
    let request = supabase.from("booking_financial_lines")
      .select("line_id:id,booking_id,trip_date,tour_slug,tour_name,destination,product_line,supplier_id,outcome,gross_usd,discount_usd,refund_usd,net_sales_usd,vat_usd:sales_tax_usd,supplier_cost_usd:partner_cost_ex_vat_usd,agent_commission_usd,payment_fees_usd,margin_amount_usd:margin_ex_vat_usd,booking_financials(reference),suppliers(name)")
      .eq("included", true).gte("trip_date", range.from).lte("trip_date", range.to)
      .order("trip_date").order("id").range(offset, offset + PAGE - 1);
    if (query.destination) request = request.eq("destination", query.destination);
    if (query.tour) request = request.eq("tour_slug", query.tour);
    if (query.supplier) request = request.eq("supplier_id", query.supplier);
    if (query.product_line) request = request.eq("product_line", query.product_line);
    const { data, error } = await request;
    if (error) fail(error);
    for (const row of (data || []) as unknown as LineRow[]) {
      rows.push({
        line_id: row.line_id, booking_id: row.booking_id, reference: one(row.booking_financials)?.reference || row.booking_id.slice(0, 8),
        trip_date: row.trip_date, tour_slug: row.tour_slug, tour_name: row.tour_name, destination: row.destination, product_line: row.product_line,
        supplier_id: row.supplier_id, supplier_name: one(row.suppliers)?.name ?? null, outcome: row.outcome,
        gross_usd: text(row.gross_usd), discount_usd: text(row.discount_usd), refund_usd: text(row.refund_usd), net_sales_usd: text(row.net_sales_usd),
        supplier_cost_usd: text(row.supplier_cost_usd), agent_commission_usd: text(row.agent_commission_usd), payment_fees_usd: text(row.payment_fees_usd),
        margin_amount_usd: text(row.margin_amount_usd), vat_usd: text(row.vat_usd),
      });
    }
    if (!data || data.length < PAGE) return rows;
  }
}

/**
 * Expenses linked to the bookings in the report (whatever their date) and to
 * a tour (expense date in range, matching the tour / destination filters), in
 * USD excluding deductible VAT. Supplier-filtered reports only use booking links.
 */
export async function reportDirectExpenses(supabase: SupabaseClient, lines: PnlLine[], range: { from: string; to: string }, query: Partial<ReportQuery>): Promise<DirectExpense[]> {
  const columns = "id,booking_id,tour_slug,amount,amount_usd,tax_amount,tax_usd";
  const found: Record<string, unknown>[] = [];
  const bookingIds = [...new Set(lines.map((line) => line.booking_id))];
  for (let index = 0; index < bookingIds.length; index += 200) {
    const { data, error } = await supabase.from("expenses").select(columns).is("voided_at", null).in("booking_id", bookingIds.slice(index, index + 200));
    if (error) fail(error);
    found.push(...(data || []));
  }
  let dims = new Map<string, { tour_name: string; destination: string | null }>();
  if (!query.supplier) {
    for (let offset = 0; ; offset += PAGE) {
      const { data, error } = await supabase.from("expenses").select(columns).is("voided_at", null).not("tour_slug", "is", null)
        .gte("expense_date", range.from).lte("expense_date", range.to).order("id").range(offset, offset + PAGE - 1);
      if (error) fail(error);
      found.push(...(data || []));
      if (!data || data.length < PAGE) break;
    }
    const { data } = await supabase.from("finance_tour_dimensions").select("tour_slug,tour_name,destination");
    dims = new Map((data || []).map((row) => [String(row.tour_slug), { tour_name: String(row.tour_name), destination: row.destination === null ? null : String(row.destination) }]));
  }
  const text = (value: unknown) => (value === null || value === undefined ? null : String(value));
  return found.flatMap((row) => {
    const tour = text(row.tour_slug);
    const dim = tour ? dims.get(tour) : undefined;
    if (tour && ((query.tour && query.tour !== tour) || (query.destination && query.destination !== dim?.destination) || query.product_line)) return [];
    const vatMissing = row.tax_usd === null && Number(row.tax_amount ?? 0) !== 0;
    const amount = row.amount_usd === null || vatMissing ? null : fromMinor(toMinor(String(row.amount_usd)) - toMinor(String(row.tax_usd ?? 0)));
    return [{ id: String(row.id), booking_id: text(row.booking_id), tour_slug: tour, tour_name: dim?.tour_name ?? null, destination: dim?.destination ?? null, amount_ex_vat_usd: amount }];
  });
}

/** Non-voided expenses with an invoice date in range. Operating expenses are company-wide and never trip-filtered. */
export async function reportExpenses(supabase: SupabaseClient, range: { from: string; to: string }): Promise<PnlExpense[]> {
  const rows: PnlExpense[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await supabase.from("expenses")
      .select("id,description,expense_date,expense_type,category,vendor,source,amount,currency,amount_usd,supplier_id,booking_id")
      .is("voided_at", null).gte("expense_date", range.from).lte("expense_date", range.to)
      .order("expense_date").order("id").range(offset, offset + PAGE - 1);
    if (error) fail(error);
    for (const row of (data || []) as Record<string, unknown>[]) {
      rows.push({
        id: String(row.id), description: String(row.description), expense_date: String(row.expense_date), expense_type: String(row.expense_type || "other"),
        category: text(row.category), vendor: text(row.vendor), source: String(row.source || "manual"), amount: String(row.amount), currency: String(row.currency),
        amount_usd: text(row.amount_usd), supplier_id: text(row.supplier_id), booking_id: text(row.booking_id),
      });
    }
    if (!data || data.length < PAGE) return rows;
  }
}

export async function expenseTypeLabels(supabase: SupabaseClient) {
  const labels: Record<string, string> = Object.fromEntries(DEFAULT_EXPENSE_TYPES.map((type) => [type.key, type.label]));
  const { data } = await supabase.from("expense_types").select("key,label");
  for (const row of data || []) labels[String(row.key)] = String(row.label);
  return labels;
}

/** Choices for the destination / tour / supplier / product-line filters. */
export async function reportFilterOptions(supabase: SupabaseClient) {
  const [dimensions, suppliers] = await Promise.all([
    supabase.from("finance_tour_dimensions").select("tour_slug,tour_name,destination,product_line").order("tour_name"),
    supabase.from("suppliers").select("id,name").order("name"),
  ]);
  if (dimensions.error) fail(dimensions.error);
  if (suppliers.error) fail(suppliers.error);
  const rows = (dimensions.data || []) as { tour_slug: string; tour_name: string; destination: string | null; product_line: string }[];
  return {
    destinations: [...new Set(rows.map((row) => row.destination).filter((value): value is string => Boolean(value)))].sort(),
    productLines: [...new Set([...rows.map((row) => row.product_line), "transfer"])].sort(),
    tours: rows.map((row) => ({ slug: row.tour_slug, name: row.tour_name })),
    suppliers: (suppliers.data || []) as { id: string; name: string }[],
  };
}

export const MARGIN_THRESHOLD_KEY = "finance_margin_threshold_pct";
export const DEFAULT_MARGIN_THRESHOLD = "15";

/** Margin % below which bookings, tours, suppliers and destinations are flagged (site setting, default 15%). */
export async function marginThreshold(supabase: SupabaseClient) {
  const { data } = await supabase.from("site_settings").select("value").eq("key", MARGIN_THRESHOLD_KEY).maybeSingle();
  const value = data?.value;
  const text = typeof value === "number" || typeof value === "string" ? String(value) : "";
  return /^\d{1,3}(\.\d{1,2})?$/.test(text) && Number(text) <= 100 ? text : DEFAULT_MARGIN_THRESHOLD;
}

export const marginThresholdSchema = z.object({
  margin_threshold_pct: z.union([z.string(), z.number()]).transform((value, context) => {
    const text = String(value).trim();
    if (!/^\d{1,3}(\.\d{1,2})?$/.test(text) || Number(text) > 100) {
      context.addIssue({ code: "custom", message: "Enter a percentage between 0 and 100 (up to 2 decimals)." });
      return z.NEVER;
    }
    return text;
  }),
});
