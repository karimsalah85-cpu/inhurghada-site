import { createHash } from "node:crypto";
import { z } from "zod";
import { commissionInvoiceSchema, type CommissionInvoice } from "./commission-invoice";
import { currencySchema } from "./schemas";
import { convertMinor, fromMinor, toMinor, type FinanceCurrency } from "./money";

export const monthlyCommissionSchema = z.object({
  period: z.string().regex(/^20\d{2}-(0[1-9]|1[0-2])$/),
  currency: currencySchema,
});
export class CommissionSourceError extends Error {
  readonly code = "23514";
}
export type CommissionLine = {
  id: string; trip_date: string; tour_name: string | null; guests: number;
  currency: FinanceCurrency; recognised_revenue: string | number;
  fx_locked: boolean; fx_rate_to_usd: string | number | null;
  supplier_fx_locked: boolean; supplier_cost_source: string;
  destination: string | null; reference: string;
};
export type CommissionBalance = { line_id: string; currency: FinanceCurrency; balance: string | number; obligation: string | number };

/** Current unpaid commission for trips in the selected month, not a month-end balance. */
export function buildMonthlyCommission(supplier: { id: string; name: string }, period: string, currency: FinanceCurrency,
  lines: CommissionLine[], balances: CommissionBalance[], generatedAt = new Date().toISOString()): CommissionInvoice {
  monthlyCommissionSchema.parse({ period, currency });
  const rows: CommissionInvoice["rows"] = [];
  const cities = new Set<string>();
  for (const line of [...lines].sort((a, b) => a.trip_date.localeCompare(b.trip_date) || a.id.localeCompare(b.id))) {
    if (!line.trip_date.startsWith(`${period}-`)) continue;
    if (currency !== "USD" && line.currency !== currency) continue;
    if (toMinor(line.recognised_revenue) === 0n && !balances.some(b => b.line_id === line.id && toMinor(b.balance) > 0n)) continue;
    if (line.supplier_cost_source === "none") throw new CommissionSourceError(`Set the supplier split for ${line.reference} before creating a statement.`);
    const balance = balances.find(b => b.line_id === line.id && b.currency === line.currency);
    if (!balance) {
      if (!line.fx_locked || !line.supplier_fx_locked) throw new CommissionSourceError(`Complete the exchange rates for ${line.reference} first.`);
      continue;
    }
    const due = toMinor(balance.balance);
    if (due <= 0n || toMinor(balance.obligation) <= 0n) continue;
    const crossCurrency = line.currency !== currency;
    if (crossCurrency && (!line.fx_locked || !line.supplier_fx_locked || !line.fx_rate_to_usd || Number(line.fx_rate_to_usd) <= 0)) {
      throw new CommissionSourceError(`A locked exchange rate is required for ${line.reference}.`);
    }
    const rate = crossCurrency ? String(line.fx_rate_to_usd) : "1";
    const commission = fromMinor(convertMinor(due, rate));
    const sales = fromMinor(convertMinor(toMinor(line.recognised_revenue), rate));
    if (toMinor(commission) === 0n) throw new CommissionSourceError(`The converted commission for ${line.reference} rounds to zero. Use its original currency.`);
    if (line.destination) cities.add(line.destination);
    rows.push({ date: line.trip_date, trip: (line.tour_name || "Trip").slice(0, 140), customers: Math.max(0, line.guests),
      ticketPrice: "0.00", commissionPercent: "0", lineId: line.id, bookingReference: line.reference,
      salesAmount: sales, commissionAmount: commission, nativeCurrency: line.currency,
      nativeCommission: fromMinor(due), exchangeRate: rate });
  }
  if (!rows.length) throw new CommissionSourceError("No unpaid supplier-collected commission for this month and currency.");
  if (rows.length > 1000) throw new CommissionSourceError("More than 1,000 outstanding trip entries. Create separate statements in the original currencies.");
  const city = cities.size === 1 ? [...cities][0].slice(0, 60) : "All destinations";
  const fingerprint = createHash("sha256").update(JSON.stringify({ supplierId: supplier.id, partner: supplier.name, period, currency, city, rows })).digest("hex");
  return commissionInvoiceSchema.parse({ partner: supplier.name, city, period, currency, rows, notes: "",
    source: { kind: "ledger", fingerprint, generatedAt } });
}

export function assertCurrentCommission(saved: CommissionInvoice, current: CommissionInvoice) {
  if (!saved.source || saved.source.fingerprint !== current.source?.fingerprint || JSON.stringify(saved.rows) !== JSON.stringify(current.rows)
    || saved.partner !== current.partner || saved.city !== current.city || saved.period !== current.period || saved.currency !== current.currency) {
    throw new CommissionSourceError("Finance has changed or this statement is not linked. Refresh the draft from finance and review it before sending.");
  }
}
