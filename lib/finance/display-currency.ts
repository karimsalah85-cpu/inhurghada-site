import { convertMinor, fromMinor, toMinor } from "@/lib/finance/money";

/**
 * Reports are kept in USD. For viewing, a USD amount can be shown in another
 * currency at a chosen rate ("1 USD = rate units"), e.g. the latest stored
 * rate or one the owner types in. Exact cent math, rounded half away from zero.
 */
export function usdToDisplay(amountUsd: string | number | null | undefined, unitsPerUsd: string): string | null {
  if (amountUsd === null || amountUsd === undefined || amountUsd === "") return null;
  return fromMinor(convertMinor(toMinor(amountUsd), normalizeRate(unitsPerUsd)));
}

/** "50", "50.1234" -> canonical rate text; throws on anything that is not a positive number with ≤ 10 decimals. */
export function normalizeRate(rate: string): string {
  const text = String(rate).trim();
  if (!/^\d{1,10}(\.\d{1,10})?$/.test(text) || Number(text) <= 0) throw new RangeError(`Not a valid rate: ${rate}`);
  return text;
}

export function isValidRate(rate: string) {
  try { normalizeRate(rate); return true; } catch { return false; }
}
