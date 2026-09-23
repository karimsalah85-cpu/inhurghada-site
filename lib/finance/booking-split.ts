import { fromMinor, toMinor, type FinanceCurrency } from '@/lib/finance/money';

/** The agreed split is separate from payments already recorded in the ledger. */
export function supplierCostFromSplit(net: string, cut: string, mode: 'drs_cut' | 'supplier_amount', currency: FinanceCurrency) {
  const total = toMinor(net);
  const amount = toMinor(cut);
  if (amount < 0n || amount > total) throw new Error('Enter an amount between zero and the booking net price.');
  return { mode: 'amount' as const, amount: fromMinor(mode === 'drs_cut' ? total - amount : amount), currency };
}
