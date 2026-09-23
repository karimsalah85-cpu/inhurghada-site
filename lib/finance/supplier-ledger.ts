import { convertMinor, formatMoney, fromMinor, toMinor, type FinanceCurrency } from "@/lib/finance/money";

/**
 * Pure supplier-ledger logic shared by the finance API, the admin screens and
 * statements. Balances follow the ledger sign convention: positive = the
 * supplier owes Daily Red Sea, negative = Daily Red Sea owes the supplier.
 */

export const LEDGER_ENTRY_TYPES = [
  "supplier_cost_payable", "commission_receivable", "payment_to_supplier",
  "commission_received_from_supplier", "net_settlement", "adjustment", "reversal",
] as const;
export type LedgerEntryType = typeof LEDGER_ENTRY_TYPES[number];

export const entryTypeLabels: Record<LedgerEntryType, string> = {
  supplier_cost_payable: "Supplier cost (we owe)",
  commission_receivable: "Commission due (supplier owes)",
  payment_to_supplier: "Payment to supplier",
  commission_received_from_supplier: "Commission received",
  net_settlement: "Net settlement",
  adjustment: "Adjustment",
  reversal: "Reversal",
};

export type LedgerEntry = {
  id: string;
  entry_no: number;
  supplier_id: string;
  booking_id: string | null;
  line_id: string | null;
  entry_type: LedgerEntryType;
  amount: string;
  currency: FinanceCurrency;
  amount_usd: string | null;
  entry_date: string;
  reverses_entry_id: string | null;
  settlement_id: string | null;
  is_automatic: boolean;
  note: string | null;
  created_by_email: string;
  created_at: string;
  booking_reference?: string | null;
};

export type LedgerRow = LedgerEntry & {
  /** Balance in this entry's currency after the entry, over the supplier's full history. */
  running_balance: string;
  /** True when a later entry reverses this one. */
  reversed: boolean;
};

const byLedgerOrder = (a: LedgerEntry, b: LedgerEntry) =>
  a.entry_date === b.entry_date ? a.entry_no - b.entry_no : a.entry_date < b.entry_date ? -1 : 1;

/** Chronological rows with a per-currency running balance, computed before any filtering. */
export function withRunningBalances(entries: LedgerEntry[]): LedgerRow[] {
  const reversed = new Set(entries.map((entry) => entry.reverses_entry_id).filter(Boolean));
  const totals = new Map<string, bigint>();
  return [...entries].sort(byLedgerOrder).map((entry) => {
    const total = (totals.get(entry.currency) ?? 0n) + toMinor(entry.amount);
    totals.set(entry.currency, total);
    return { ...entry, running_balance: fromMinor(total), reversed: reversed.has(entry.id) };
  });
}

export function balancesByCurrency(entries: Pick<LedgerEntry, "amount" | "currency" | "entry_date">[], options: { before?: string; through?: string } = {}) {
  const totals = new Map<FinanceCurrency, bigint>();
  for (const entry of entries) {
    if (options.before && entry.entry_date >= options.before) continue;
    if (options.through && entry.entry_date > options.through) continue;
    totals.set(entry.currency, (totals.get(entry.currency) ?? 0n) + toMinor(entry.amount));
  }
  return totals;
}

export type LatestRates = Partial<Record<FinanceCurrency, { usd_per_unit: string; rate_date: string }>>;

/**
 * Current USD value of per-currency balances at the latest known rates. A
 * supplier's balance is converted at today's rate, not at posting-date rates,
 * because it is what would change hands if settled now.
 */
export function usdBalance(balances: Map<FinanceCurrency, bigint>, rates: LatestRates) {
  let total = 0n;
  const missing: FinanceCurrency[] = [];
  for (const [currency, minor] of balances) {
    if (minor === 0n) continue;
    if (currency === "USD") { total += minor; continue; }
    const rate = rates[currency];
    if (!rate) { missing.push(currency); continue; }
    total += convertMinor(minor, rate.usd_per_unit);
  }
  return { usdMinor: total, missing };
}

export type BalanceLabel = { tone: "owes_us" | "we_owe" | "settled"; text: string };

export function balanceLabel(balances: Map<FinanceCurrency, bigint>, usdMinor: bigint): BalanceLabel {
  const open = [...balances.values()].some((minor) => minor !== 0n);
  if (!open) return { tone: "settled", text: "Settled" };
  if (usdMinor > 0n) return { tone: "owes_us", text: `Supplier owes us ${formatMoney(usdMinor)}` };
  if (usdMinor < 0n) return { tone: "we_owe", text: `We owe supplier ${formatMoney(-usdMinor)}` };
  // Open balances in several currencies that net to zero in USD at today's rates.
  return { tone: "settled", text: "Settled in USD (open per currency)" };
}

export type LedgerFilters = {
  from?: string;
  to?: string;
  type?: LedgerEntryType | "all";
  booking?: string;
  status?: "all" | "open" | "settled" | "reversed";
};

/** Filters rows for display. `openLines` holds line ids that still carry a balance with this supplier. */
export function filterLedger(rows: LedgerRow[], filters: LedgerFilters, openLines: Set<string>) {
  const booking = filters.booking?.trim().toLowerCase();
  return rows.filter((row) => {
    if (filters.from && row.entry_date < filters.from) return false;
    if (filters.to && row.entry_date > filters.to) return false;
    if (filters.type && filters.type !== "all" && row.entry_type !== filters.type) return false;
    if (booking && !(row.booking_reference || "").toLowerCase().includes(booking) && row.booking_id !== booking) return false;
    switch (filters.status) {
      case "reversed": return row.reversed || row.entry_type === "reversal";
      case "open": return Boolean(row.line_id && openLines.has(row.line_id)) && !row.reversed && row.entry_type !== "reversal";
      case "settled": return Boolean(row.line_id && !openLines.has(row.line_id));
      default: return true;
    }
  });
}

const csvCell = (value: string | number | null | undefined) => {
  const text = value === null || value === undefined ? "" : String(value);
  // Neutralise spreadsheet formula injection from free-text notes.
  const safe = /^[=+\-@\t\r]/.test(text) && !/^-?\d/.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export type StatementInput = {
  supplierName: string;
  from: string;
  to: string;
  generatedAt: string;
  entries: LedgerEntry[];
  rates: LatestRates;
};

export type Statement = {
  supplierName: string;
  from: string;
  to: string;
  generatedAt: string;
  opening: Map<FinanceCurrency, bigint>;
  closing: Map<FinanceCurrency, bigint>;
  closingUsd: ReturnType<typeof usdBalance>;
  label: BalanceLabel;
  rows: LedgerRow[];
};

export function buildStatement(input: StatementInput): Statement {
  const all = withRunningBalances(input.entries);
  const opening = balancesByCurrency(input.entries, { before: input.from });
  const closing = balancesByCurrency(input.entries, { through: input.to });
  const closingUsd = usdBalance(closing, input.rates);
  return {
    supplierName: input.supplierName, from: input.from, to: input.to, generatedAt: input.generatedAt,
    opening, closing, closingUsd, label: balanceLabel(closing, closingUsd.usdMinor),
    rows: all.filter((row) => row.entry_date >= input.from && row.entry_date <= input.to),
  };
}

const formatBalances = (balances: Map<FinanceCurrency, bigint>) =>
  [...balances].filter(([, minor]) => minor !== 0n).map(([currency, minor]) => formatMoney(minor, currency)).join(" · ") || formatMoney(0n);

export function statementCsv(statement: Statement) {
  const lines = [
    ["Daily Red Sea supplier statement"],
    ["Supplier", statement.supplierName],
    ["Period", `${statement.from} to ${statement.to}`],
    ["Generated", statement.generatedAt],
    ["Opening balance", formatBalances(statement.opening)],
    ["Closing balance", formatBalances(statement.closing)],
    ["Closing balance (USD at latest rates)", statement.label.text + (statement.closingUsd.missing.length ? ` (no rate for ${statement.closingUsd.missing.join(", ")})` : "")],
    ["Sign convention", "Positive = supplier owes Daily Red Sea; negative = Daily Red Sea owes supplier"],
    [],
    ["Date", "Entry", "Type", "Booking", "Note", "Currency", "Amount", "Balance", "Amount (USD at posting)", "Reversed"],
    ...statement.rows.map((row) => [
      row.entry_date, row.entry_no, entryTypeLabels[row.entry_type], row.booking_reference || "", row.note || "", row.currency,
      row.amount, row.running_balance, row.amount_usd ?? "pending", row.reversed ? "yes" : "",
    ]),
  ];
  return lines.map((cells) => cells.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

export { formatBalances };
