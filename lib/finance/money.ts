/**
 * Finance money math in integer minor units (cents) using bigint. Amounts
 * cross the API boundary as decimal strings ("123.45"); numeric columns come
 * back from Postgres as strings as well, so floats never touch a sum.
 */
export const FINANCE_CURRENCIES = ["USD", "EUR", "GBP", "EGP", "SAR"] as const;
export type FinanceCurrency = typeof FINANCE_CURRENCIES[number];
export const REPORTING_CURRENCY: FinanceCurrency = "USD";

export function isFinanceCurrency(value: unknown): value is FinanceCurrency {
  return typeof value === "string" && (FINANCE_CURRENCIES as readonly string[]).includes(value);
}

const decimalPattern = /^(-)?(\d+)(?:\.(\d{1,2}))?$/;

/** Parses "12", "12.3", "-12.34" (or a Postgres numeric string such as "12.3400") into cents. Throws on anything else. */
export function toMinor(value: string | number | bigint): bigint {
  if (typeof value === "bigint") return value * 100n;
  const text = typeof value === "number" ? numberToDecimal(value) : value.trim().replace(/(\.\d{2})0+$/, "$1");
  const match = decimalPattern.exec(text);
  if (!match) throw new RangeError(`Not a money amount: ${value}`);
  const cents = BigInt(match[2]) * 100n + BigInt((match[3] || "").padEnd(2, "0") || "0");
  return match[1] ? -cents : cents;
}

function numberToDecimal(value: number) {
  if (!Number.isFinite(value)) throw new RangeError(`Not a money amount: ${value}`);
  const fixed = value.toFixed(2);
  if (Math.abs(Number(fixed) - value) > 1e-9) throw new RangeError(`More than two decimals: ${value}`);
  return fixed;
}

/** Formats cents back into a plain decimal string ("-1234.50"). */
export function fromMinor(cents: bigint): string {
  const negative = cents < 0n;
  const absolute = negative ? -cents : cents;
  return `${negative ? "-" : ""}${absolute / 100n}.${(absolute % 100n).toString().padStart(2, "0")}`;
}

export function sumMinor(values: Iterable<string | number | bigint | null | undefined>): bigint {
  let total = 0n;
  for (const value of values) if (value !== null && value !== undefined && value !== "") total += toMinor(value);
  return total;
}

/**
 * Converts cents with a decimal rate string (usd_per_unit, up to 12 decimals),
 * rounding half away from zero exactly like Postgres round(numeric, 2).
 */
export function convertMinor(cents: bigint, rate: string): bigint {
  const match = /^(\d+)(?:\.(\d{1,12}))?$/.exec(rate.trim());
  if (!match) throw new RangeError(`Not a rate: ${rate}`);
  const scale = 10n ** 12n;
  const scaledRate = BigInt(match[1]) * scale + BigInt((match[2] || "").padEnd(12, "0"));
  const product = cents * scaledRate;
  const negative = product < 0n;
  const absolute = negative ? -product : product;
  const rounded = (absolute + scale / 2n) / scale;
  return negative ? -rounded : rounded;
}

/** Percentage of `part` over `whole` with two decimals, or null when whole is zero. */
export function percentOf(part: bigint, whole: bigint): string | null {
  if (whole === 0n) return null;
  // Twice the value in basis points, truncated; then round half away from zero.
  const doubled = (part * 20000n) / whole;
  return fromMinor(doubled >= 0n ? (doubled + 1n) / 2n : (doubled - 1n) / 2n);
}

export function formatMoney(amount: string | bigint, currency: FinanceCurrency = REPORTING_CURRENCY) {
  const decimal = typeof amount === "bigint" ? fromMinor(amount) : fromMinor(toMinor(amount));
  const [whole, fraction] = decimal.replace("-", "").split(".");
  const symbol = new Intl.NumberFormat("en", { style: "currency", currency, currencyDisplay: "narrowSymbol" })
    .formatToParts(0).find((part) => part.type === "currency")?.value || currency;
  return `${decimal.startsWith("-") ? "-" : ""}${symbol}${Number(whole).toLocaleString("en")}.${fraction}`;
}
