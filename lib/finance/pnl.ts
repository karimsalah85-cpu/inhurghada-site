import { toCsv } from "@/lib/finance/csv";
import { fromMinor, percentOf, toMinor } from "@/lib/finance/money";

/**
 * Management P&L in USD on an accrual basis: trip revenue and trip costs are
 * recognised on the trip date (booking_financial_lines, already converted at
 * the trip-date rate), operating expenses on the invoice date (expenses,
 * converted at the invoice-date rate, voided excluded). All math is integer
 * cents. Records whose USD value is still pending are left out and counted,
 * never guessed.
 */

export type PnlLine = {
  line_id: string;
  booking_id: string;
  reference: string;
  trip_date: string | null;
  tour_slug: string | null;
  tour_name: string | null;
  destination: string | null;
  product_line: string;
  supplier_id: string | null;
  supplier_name: string | null;
  outcome: string;
  gross_usd: string | null;
  discount_usd: string | null;
  refund_usd: string | null;
  net_sales_usd: string | null;
  supplier_cost_usd: string | null;
  agent_commission_usd: string | null;
  payment_fees_usd: string | null;
  margin_amount_usd: string | null;
};

export type PnlExpense = {
  id: string;
  description: string;
  expense_date: string;
  expense_type: string;
  category: string | null;
  vendor: string | null;
  source: string;
  amount: string;
  currency: string;
  amount_usd: string | null;
  supplier_id: string | null;
  booking_id: string | null;
};

const LINE_USD_FIELDS = ["gross_usd", "discount_usd", "refund_usd", "net_sales_usd", "supplier_cost_usd", "agent_commission_usd", "payment_fees_usd", "margin_amount_usd"] as const;
export const lineIsConverted = (line: PnlLine) => LINE_USD_FIELDS.every((field) => line[field] !== null && line[field] !== undefined);

const sum = <T,>(rows: T[], pick: (row: T) => string | null) => rows.reduce((total, row) => total + toMinor(pick(row) ?? "0"), 0n);

export type PnlTotals = {
  gross: bigint; discounts: bigint; refunds: bigint; net_sales: bigint; supplier_costs: bigint; gross_profit: bigint;
  agent_commissions: bigint; payment_fees: bigint; contribution: bigint; drs_net_revenue: bigint; opex: bigint; net_profit: bigint;
};

export type OpexCategory = { key: string; label: string; amount: bigint; count: number };

export type PnlResult = {
  totals: PnlTotals;
  opex: OpexCategory[];
  bookings: number;
  pending: { lines: number; expenses: number };
};

export function computePnl(lines: PnlLine[], expenses: PnlExpense[], expenseTypeLabels: Record<string, string>): PnlResult {
  const converted = lines.filter(lineIsConverted);
  const convertedExpenses = expenses.filter((expense) => expense.amount_usd !== null);
  const gross = sum(converted, (line) => line.gross_usd);
  const discounts = sum(converted, (line) => line.discount_usd);
  const refunds = sum(converted, (line) => line.refund_usd);
  const net_sales = sum(converted, (line) => line.net_sales_usd);
  const supplier_costs = sum(converted, (line) => line.supplier_cost_usd);
  const agent_commissions = sum(converted, (line) => line.agent_commission_usd);
  const payment_fees = sum(converted, (line) => line.payment_fees_usd);
  const gross_profit = net_sales - supplier_costs;
  const contribution = gross_profit - agent_commissions - payment_fees;

  const byCategory = new Map<string, OpexCategory>();
  for (const expense of convertedExpenses) {
    const key = expense.expense_type || "other";
    const entry = byCategory.get(key) ?? { key, label: expenseTypeLabels[key] || key.replace(/_/g, " "), amount: 0n, count: 0 };
    entry.amount += toMinor(expense.amount_usd!);
    entry.count += 1;
    byCategory.set(key, entry);
  }
  const opex = [...byCategory.values()].sort((a, b) => (b.amount > a.amount ? 1 : b.amount < a.amount ? -1 : a.label.localeCompare(b.label)));
  const opexTotal = opex.reduce((total, category) => total + category.amount, 0n);

  return {
    totals: {
      gross, discounts, refunds, net_sales, supplier_costs, gross_profit, agent_commissions, payment_fees, contribution,
      drs_net_revenue: gross_profit, opex: opexTotal, net_profit: contribution - opexTotal,
    },
    opex,
    bookings: new Set(converted.map((line) => line.booking_id)).size,
    pending: { lines: lines.length - converted.length, expenses: expenses.length - convertedExpenses.length },
  };
}

export type StatementRow = {
  key: string;
  label: string;
  /** "amount" rows carry money; costs are shown with a minus sign. */
  kind: "revenue" | "cost" | "subtotal" | "percent";
  current: string | null;
  previous: string | null;
  /** Absolute change for money rows, percentage points for percent rows. */
  change: string | null;
  drill: string | null;
  indent?: boolean;
};

type RowSpec = { key: string; label: string; kind: StatementRow["kind"]; value: (result: PnlResult) => bigint | string | null; drill?: string | null; indent?: boolean };

const money = (pick: (totals: PnlTotals) => bigint) => (result: PnlResult) => pick(result.totals);
const ratio = (part: (totals: PnlTotals) => bigint, whole: (totals: PnlTotals) => bigint) => (result: PnlResult) => percentOf(part(result.totals), whole(result.totals));

function opexSpecs(current: PnlResult, previous: PnlResult | null): RowSpec[] {
  const labels = new Map<string, string>();
  for (const category of [...current.opex, ...(previous?.opex ?? [])]) if (!labels.has(category.key)) labels.set(category.key, category.label);
  return [...labels].map(([key, label]) => ({
    key: `opex:${key}`, label, kind: "cost" as const, indent: true, drill: `opex:${key}`,
    value: (result: PnlResult) => result.opex.find((category) => category.key === key)?.amount ?? 0n,
  }));
}

function build(specs: RowSpec[], current: PnlResult, previous: PnlResult | null): StatementRow[] {
  return specs.map((spec) => {
    const now = spec.value(current);
    const before = previous ? spec.value(previous) : null;
    const text = (value: bigint | string | null) => (value === null ? null : typeof value === "bigint" ? fromMinor(value) : value);
    let change: string | null = null;
    if (previous && now !== null && before !== null) {
      change = typeof now === "bigint" && typeof before === "bigint" ? fromMinor(now - before) : fromMinor(toMinor(String(now)) - toMinor(String(before)));
    }
    return { key: spec.key, label: spec.label, kind: spec.kind, current: text(now), previous: text(before), change, drill: spec.drill ?? null, indent: spec.indent };
  });
}

/** Gross view: the full booking value flowing through Daily Red Sea. */
export function grossView(current: PnlResult, previous: PnlResult | null) {
  return build([
    { key: "gross", label: "Gross booking value", kind: "revenue", value: money((t) => t.gross), drill: "gross" },
    { key: "discounts", label: "Discounts", kind: "cost", value: money((t) => t.discounts), drill: "discounts", indent: true },
    { key: "refunds", label: "Refunds", kind: "cost", value: money((t) => t.refunds), drill: "refunds", indent: true },
    { key: "net_sales", label: "Net sales", kind: "subtotal", value: money((t) => t.net_sales), drill: "net_sales" },
    { key: "supplier_costs", label: "Cost of trips (supplier costs)", kind: "cost", value: money((t) => t.supplier_costs), drill: "supplier_costs", indent: true },
    { key: "gross_profit", label: "Gross profit", kind: "subtotal", value: money((t) => t.gross_profit), drill: "gross_profit" },
    { key: "gross_margin_pct", label: "Gross margin %", kind: "percent", value: ratio((t) => t.gross_profit, (t) => t.net_sales) },
    { key: "agent_commissions", label: "Agent / partner commissions", kind: "cost", value: money((t) => t.agent_commissions), drill: "agent_commissions", indent: true },
    { key: "payment_fees", label: "Payment / processor fees", kind: "cost", value: money((t) => t.payment_fees), drill: "payment_fees", indent: true },
    { key: "contribution", label: "Contribution after selling costs", kind: "subtotal", value: money((t) => t.contribution), drill: "contribution" },
    ...opexSpecs(current, previous),
    { key: "opex", label: "Total operating expenses", kind: "cost", value: money((t) => t.opex), drill: "opex" },
    { key: "net_profit", label: "Net profit", kind: "subtotal", value: money((t) => t.net_profit) },
    { key: "net_margin_pct", label: "Net margin % (of net sales)", kind: "percent", value: ratio((t) => t.net_profit, (t) => t.net_sales) },
  ], current, previous);
}

/** Net revenue view: only what Daily Red Sea earns (commission over supplier cost). */
export function netRevenueView(current: PnlResult, previous: PnlResult | null) {
  return build([
    { key: "drs_net_revenue", label: "DRS net revenue (commission earned)", kind: "revenue", value: money((t) => t.drs_net_revenue), drill: "gross_profit" },
    { key: "agent_commissions", label: "Agent / partner commissions", kind: "cost", value: money((t) => t.agent_commissions), drill: "agent_commissions", indent: true },
    { key: "payment_fees", label: "Payment / processor fees", kind: "cost", value: money((t) => t.payment_fees), drill: "payment_fees", indent: true },
    { key: "contribution", label: "Net commission after selling costs", kind: "subtotal", value: money((t) => t.contribution), drill: "contribution" },
    { key: "contribution_pct", label: "Kept of commission %", kind: "percent", value: ratio((t) => t.contribution, (t) => t.drs_net_revenue) },
    ...opexSpecs(current, previous),
    { key: "opex", label: "Total operating expenses", kind: "cost", value: money((t) => t.opex), drill: "opex" },
    { key: "net_profit", label: "Net profit", kind: "subtotal", value: money((t) => t.net_profit) },
    { key: "net_margin_pct", label: "Net margin % (of DRS net revenue)", kind: "percent", value: ratio((t) => t.net_profit, (t) => t.drs_net_revenue) },
  ], current, previous);
}

export type TrendPoint = { month: string; net_sales: string; costs: string; net_profit: string };

/** Monthly net sales, all costs (trip, selling and operating) and net profit, one row per month in range. */
export function monthlyTrend(lines: PnlLine[], expenses: PnlExpense[], from: string, to: string): TrendPoint[] {
  const months: string[] = [];
  for (let cursor = new Date(`${from.slice(0, 7)}-01T00:00:00Z`); cursor.toISOString().slice(0, 7) <= to.slice(0, 7); cursor.setUTCMonth(cursor.getUTCMonth() + 1)) {
    months.push(cursor.toISOString().slice(0, 7));
  }
  return months.map((month) => {
    const result = computePnl(lines.filter((line) => line.trip_date?.startsWith(month)), expenses.filter((expense) => expense.expense_date.startsWith(month)), {});
    const t = result.totals;
    return { month, net_sales: fromMinor(t.net_sales), costs: fromMinor(t.supplier_costs + t.agent_commissions + t.payment_fees + t.opex), net_profit: fromMinor(t.net_profit) };
  });
}

export function previousPeriod(from: string, to: string) {
  const day = 86_400_000;
  const start = Date.parse(`${from}T00:00:00Z`);
  const length = Math.round((Date.parse(`${to}T00:00:00Z`) - start) / day) + 1;
  const previousTo = new Date(start - day);
  const previousFrom = new Date(start - day * length);
  return { from: previousFrom.toISOString().slice(0, 10), to: previousTo.toISOString().slice(0, 10) };
}

export type DrillRow = { kind: "line"; line: PnlLine; amount: string } | { kind: "expense"; expense: PnlExpense; amount: string };

const lineDrill: Record<string, (line: PnlLine) => bigint> = {
  gross: (line) => toMinor(line.gross_usd!),
  discounts: (line) => toMinor(line.discount_usd!),
  refunds: (line) => toMinor(line.refund_usd!),
  net_sales: (line) => toMinor(line.net_sales_usd!),
  supplier_costs: (line) => toMinor(line.supplier_cost_usd!),
  gross_profit: (line) => toMinor(line.net_sales_usd!) - toMinor(line.supplier_cost_usd!),
  agent_commissions: (line) => toMinor(line.agent_commission_usd!),
  payment_fees: (line) => toMinor(line.payment_fees_usd!),
  contribution: (line) => toMinor(line.margin_amount_usd!),
};

/** The bookings or expenses behind one P&L line, largest first. Rows sum to the statement figure. */
export function drilldown(key: string, lines: PnlLine[], expenses: PnlExpense[]): DrillRow[] | null {
  if (key === "opex" || key.startsWith("opex:")) {
    const type = key === "opex" ? null : key.slice(5);
    return expenses
      .filter((expense) => expense.amount_usd !== null && (type === null || (expense.expense_type || "other") === type))
      .map((expense) => ({ kind: "expense" as const, expense, amount: fromMinor(toMinor(expense.amount_usd!)) }))
      .sort((a, b) => Number(toMinor(b.amount) - toMinor(a.amount)));
  }
  const pick = lineDrill[key];
  if (!pick) return null;
  return lines.filter(lineIsConverted)
    .map((line) => ({ kind: "line" as const, line, amount: fromMinor(pick(line)) }))
    .filter((row) => row.amount !== "0.00")
    .sort((a, b) => Number(toMinor(b.amount) - toMinor(a.amount)));
}

export type MarginGroup = "booking" | "tour" | "supplier" | "destination";
export type MarginRow = {
  key: string; label: string; bookings: number; net_sales: string; margin: string; margin_pct: string | null;
  flag: "negative" | "below_threshold" | null;
};

const groupKey: Record<MarginGroup, (line: PnlLine) => [string, string]> = {
  booking: (line) => [line.booking_id, line.reference],
  tour: (line) => [line.tour_slug || line.tour_name || "unknown", line.tour_name || line.tour_slug || "Unknown tour"],
  supplier: (line) => [line.supplier_id || "none", line.supplier_name || "No supplier assigned"],
  destination: (line) => [line.destination || "unassigned", line.destination ? line.destination.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Unassigned"],
};

/**
 * Margin (after supplier cost, agent commission and payment fees) per group,
 * in USD. Flags negative margins and margins below the threshold percentage.
 */
export function marginsBy(group: MarginGroup, lines: PnlLine[], thresholdPct: string): MarginRow[] {
  const threshold = toMinor(thresholdPct);
  const groups = new Map<string, { label: string; bookings: Set<string>; net: bigint; margin: bigint }>();
  for (const line of lines.filter(lineIsConverted)) {
    const [key, label] = groupKey[group](line);
    const entry = groups.get(key) ?? { label, bookings: new Set<string>(), net: 0n, margin: 0n };
    entry.bookings.add(line.booking_id);
    entry.net += toMinor(line.net_sales_usd!);
    entry.margin += toMinor(line.margin_amount_usd!);
    groups.set(key, entry);
  }
  return [...groups].map(([key, entry]) => {
    const pct = percentOf(entry.margin, entry.net);
    const flag = entry.margin < 0n ? "negative" as const : pct !== null && toMinor(pct) < threshold ? "below_threshold" as const : null;
    return { key, label: entry.label, bookings: entry.bookings.size, net_sales: fromMinor(entry.net), margin: fromMinor(entry.margin), margin_pct: pct, flag };
  }).sort((a, b) => Number(toMinor(a.margin) - toMinor(b.margin)));
}

const signed = (row: StatementRow, value: string | null) =>
  value === null ? "" : row.kind === "cost" && value !== "0.00" ? `-${value.replace(/^-/, "")}` : value;

export function pnlCsv(input: { from: string; to: string; previous: { from: string; to: string } | null; filters: string; gross: StatementRow[]; net: StatementRow[]; pending: PnlResult["pending"] }) {
  const header = ["Line", "Current (USD)", ...(input.previous ? ["Previous (USD)", "Change"] : [])];
  const section = (title: string, rows: StatementRow[]) => [
    [title], header,
    ...rows.map((row) => [row.label, row.kind === "percent" ? (row.current ?? "") + (row.current ? "%" : "") : signed(row, row.current),
      ...(input.previous ? [row.kind === "percent" ? (row.previous ? `${row.previous}%` : "") : signed(row, row.previous), row.change ?? ""] : [])]),
    [],
  ];
  return toCsv([
    ["Daily Red Sea management P&L (USD, accrual by trip date) - management reporting, not a statutory accounting statement"],
    ["Period", `${input.from} to ${input.to}`],
    ...(input.previous ? [["Compared with", `${input.previous.from} to ${input.previous.to}`]] : []),
    ["Filters", input.filters || "none (operating expenses are always company-wide)"],
    ["Excluded until USD rate is final", `${input.pending.lines} booking lines, ${input.pending.expenses} expenses`],
    [],
    ...section("Gross view", input.gross),
    ...section("Net revenue view", input.net),
  ]);
}
