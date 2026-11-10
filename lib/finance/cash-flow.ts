import { fromMinor, toMinor } from "@/lib/finance/money";

export type CashMovement = { occurred_on: string; cash_effect_usd: string | number | null };
export type CashMonth = { month: string; cash_in_usd: string; cash_out_usd: string; net_cash_usd: string; usd_pending: number };

/** Cash movement by transaction date. Missing FX stays pending; reversals retain their signed effect. */
export function summarizeCashFlow(movements: CashMovement[], range: { from: string; to: string }): CashMonth[] {
  const months = new Map<string, { cashIn: bigint; cashOut: bigint; pending: number }>();
  const first = new Date(`${range.from.slice(0, 7)}-01T00:00:00Z`);
  for (const date = first; date.toISOString().slice(0, 10) <= range.to; date.setUTCMonth(date.getUTCMonth() + 1)) {
    months.set(date.toISOString().slice(0, 10), { cashIn: 0n, cashOut: 0n, pending: 0 });
  }
  for (const movement of movements) {
    if (movement.occurred_on < range.from || movement.occurred_on > range.to) continue;
    const month = months.get(`${movement.occurred_on.slice(0, 7)}-01`);
    if (!month) continue;
    if (movement.cash_effect_usd == null) { month.pending += 1; continue; }
    const amount = toMinor(movement.cash_effect_usd);
    if (amount >= 0n) month.cashIn += amount;
    else month.cashOut -= amount;
  }
  return [...months].map(([month, value]) => ({ month, cash_in_usd: fromMinor(value.cashIn), cash_out_usd: fromMinor(value.cashOut), net_cash_usd: fromMinor(value.cashIn - value.cashOut), usd_pending: value.pending }));
}
