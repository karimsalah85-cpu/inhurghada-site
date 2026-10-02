import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildMonthlyCommission, CommissionSourceError, monthlyCommissionSchema, type CommissionBalance, type CommissionLine } from "./monthly-commission";
import { toMinor, type FinanceCurrency } from "./money";

export async function loadMonthlyCommission(db: SupabaseClient, supplierId: string, period: string, currency: FinanceCurrency) {
  monthlyCommissionSchema.parse({ period, currency });
  const supplier = await db.from("suppliers").select("id,name").eq("id", supplierId).maybeSingle();
  if (supplier.error) throw supplier.error;
  if (!supplier.data) throw new CommissionSourceError("Supplier not found.");
  const start = `${period}-01`;
  const end = new Date(Date.UTC(Number(period.slice(0, 4)), Number(period.slice(5, 7)), 1)).toISOString().slice(0, 10);
  const lines: CommissionLine[] = [];
  for (let offset = 0; ; offset += 500) {
    const result = await db.from("booking_financial_lines")
      .select("id,trip_date,tour_name,guests,currency,recognised_revenue,fx_locked,fx_rate_to_usd,supplier_fx_locked,supplier_cost_source,destination,booking_financials(reference)")
      .eq("supplier_id", supplierId).eq("collected_by", "supplier").eq("included", true)
      .gte("trip_date", start).lt("trip_date", end).order("id").range(offset, offset + 499);
    if (result.error) throw result.error;
    for (const row of result.data || []) {
      const parent = Array.isArray(row.booking_financials) ? row.booking_financials[0] : row.booking_financials;
      lines.push({ ...row, currency: row.currency as FinanceCurrency, reference: parent?.reference || row.id });
    }
    if ((result.data?.length || 0) < 500) break;
  }
  // Unallocated receipts cannot safely reduce a particular monthly invoice.
  const unallocated = new Map<string, bigint>();
  for (let offset = 0; ; offset += 500) {
    const credits = await db.from("supplier_ledger").select("amount,currency").eq("supplier_id", supplierId).is("line_id", null).order("entry_no").range(offset, offset + 499);
    if (credits.error) throw credits.error;
    for (const entry of credits.data || []) unallocated.set(entry.currency, (unallocated.get(entry.currency) || 0n) + toMinor(entry.amount));
    if ((credits.data?.length || 0) < 500) break;
  }
  if ([...unallocated].some(([ccy, amount]) => (currency === "USD" || ccy === currency) && amount < 0n)) {
    throw new CommissionSourceError("Allocate the supplier's unlinked payments or credits to bookings before creating a commission statement.");
  }
  const balances: CommissionBalance[] = [];
  for (let offset = 0; offset < lines.length; offset += 100) {
    const result = await db.from("supplier_line_balances").select("line_id,currency,balance,obligation")
      .eq("supplier_id", supplierId).in("line_id", lines.slice(offset, offset + 100).map(l => l.id));
    if (result.error) throw result.error;
    balances.push(...(result.data || []) as CommissionBalance[]);
  }
  if (balances.some(b => (currency === "USD" || b.currency === currency) && toMinor(b.balance) < 0n)) {
    throw new CommissionSourceError("This month includes booking credits. Reconcile those credits in the supplier ledger before requesting commission payment.");
  }
  // A supplier acting as both collecting partner and extra cost partner needs net settlement,
  // not a document labelling the combined balance as pure commission.
  for (let offset = 0; offset < lines.length; offset += 100) {
    const extra = await db.from("booking_line_partner_costs").select("id").eq("supplier_id", supplierId).eq("status", "active")
      .in("line_id", lines.slice(offset, offset + 100).map(l => l.id)).limit(1);
    if (extra.error) throw extra.error;
    if (extra.data?.length) throw new CommissionSourceError("This supplier also has extra partner costs on these trips. Use the net supplier statement to reconcile them first.");
  }
  return buildMonthlyCommission(supplier.data, period, currency, lines, balances);
}
