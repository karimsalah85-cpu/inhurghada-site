/**
 * Hurghada Fair Price Index — what common tourist purchases should cost.
 *
 * Ranges are researched from 2026 travel guides, Numbeo and OTA listings and
 * reviewed by Daily Red Sea before publishing. `ripoffAbove` is an editorial
 * judgement, not an official tariff. Update `fairPricesReviewedOn` whenever a
 * number changes. Visitor-facing wording lives in lib/fair-prices-i18n.ts.
 */

export const fairPricesReviewedOn = "2026-11-19";

/** Egypt's single-entry visa rises from $30 to $33 (ETAA circular 173/2026). */
export const visaFeeBeforeIncreaseUsd = 30;
export const visaFeeAfterIncreaseUsd = 33;
/** 2027-01-01 00:00 in Cairo (UTC+2). */
export const visaFeeIncreaseAt = Date.UTC(2026, 11, 31, 22, 0, 0);

export function visaFeeHasIncreased(now: Date) {
  return now.getTime() >= visaFeeIncreaseAt;
}

export function visaFeeUsd(now: Date) {
  return visaFeeHasIncreased(now) ? visaFeeAfterIncreaseUsd : visaFeeBeforeIncreaseUsd;
}

export type FairPriceCurrency = "USD" | "EUR" | "EGP";

export type FairPriceCategory = "arrival" | "transport" | "trips" | "food";

export const fairPriceCategoryIds: FairPriceCategory[] = ["arrival", "transport", "trips", "food"];

export type FairPriceItemId =
  | "visa-on-arrival"
  | "tourist-sim"
  | "airport-uber-central"
  | "airport-taxi-central"
  | "airport-taxi-makadi-sahl"
  | "airport-taxi-el-gouna"
  | "town-taxi"
  | "orange-bay"
  | "snorkeling-boat"
  | "dolphin-house"
  | "quad-safari"
  | "intro-dive"
  | "luxor-private-day"
  | "local-beer"
  | "shisha"
  | "water";

export type FairPriceItem = {
  id: FairPriceItemId;
  category: FairPriceCategory;
  currency: FairPriceCurrency;
  fairMin: number;
  fairMax: number;
  /** Anything above this is flagged as a rip-off. Equal to fairMax for fixed official fees. */
  ripoffAbove: number;
  /** Official fixed fee: anything above fairMax is a rip-off, with no "a bit high" band. */
  fixed?: boolean;
  /** Daily Red Sea tour that covers this purchase, shown with its live price. */
  tourSlug?: string;
};

export const fairPriceItems: FairPriceItem[] = [
  { id: "visa-on-arrival", category: "arrival", currency: "USD", fairMin: visaFeeBeforeIncreaseUsd, fairMax: visaFeeBeforeIncreaseUsd, ripoffAbove: visaFeeBeforeIncreaseUsd, fixed: true },
  { id: "tourist-sim", category: "arrival", currency: "EGP", fairMin: 450, fairMax: 700, ripoffAbove: 1200 },
  { id: "airport-uber-central", category: "transport", currency: "EGP", fairMin: 150, fairMax: 300, ripoffAbove: 500 },
  { id: "airport-taxi-central", category: "transport", currency: "EGP", fairMin: 250, fairMax: 750, ripoffAbove: 1000, tourSlug: "hurghada-airport-transfer" },
  { id: "airport-taxi-makadi-sahl", category: "transport", currency: "EGP", fairMin: 400, fairMax: 1250, ripoffAbove: 1800, tourSlug: "hurghada-airport-transfer" },
  { id: "airport-taxi-el-gouna", category: "transport", currency: "EGP", fairMin: 500, fairMax: 1500, ripoffAbove: 2200, tourSlug: "hurghada-airport-transfer" },
  { id: "town-taxi", category: "transport", currency: "EGP", fairMin: 50, fairMax: 150, ripoffAbove: 300 },
  { id: "orange-bay", category: "trips", currency: "USD", fairMin: 20, fairMax: 40, ripoffAbove: 55, tourSlug: "orange-bay" },
  { id: "snorkeling-boat", category: "trips", currency: "USD", fairMin: 20, fairMax: 35, ripoffAbove: 50, tourSlug: "full-day-snorkeling" },
  { id: "dolphin-house", category: "trips", currency: "USD", fairMin: 25, fairMax: 45, ripoffAbove: 65, tourSlug: "dolphin-house-snorkeling" },
  { id: "quad-safari", category: "trips", currency: "USD", fairMin: 15, fairMax: 30, ripoffAbove: 50, tourSlug: "safari" },
  { id: "intro-dive", category: "trips", currency: "USD", fairMin: 40, fairMax: 65, ripoffAbove: 90, tourSlug: "beginner-scuba-diving" },
  { id: "luxor-private-day", category: "trips", currency: "USD", fairMin: 150, fairMax: 220, ripoffAbove: 300, tourSlug: "luxor-private-day-trip" },
  { id: "local-beer", category: "food", currency: "EGP", fairMin: 80, fairMax: 150, ripoffAbove: 300 },
  { id: "shisha", category: "food", currency: "EGP", fairMin: 100, fairMax: 200, ripoffAbove: 400 },
  { id: "water", category: "food", currency: "EGP", fairMin: 10, fairMax: 25, ripoffAbove: 50 },
];

/** The index as it applies on `now` — the visa fee switches automatically on 1 January 2027. */
export function fairPriceItemsAt(now: Date): FairPriceItem[] {
  const visaFee = visaFeeUsd(now);
  return fairPriceItems.map((item) => item.id === "visa-on-arrival" ? { ...item, fairMin: visaFee, fairMax: visaFee, ripoffAbove: visaFee } : item);
}

export type ExchangeRates = Record<FairPriceCurrency, number>;

/** Units of each currency per 1 USD; matches the /api/exchange-rates fallback. */
export const fallbackFairPriceRates: ExchangeRates = { USD: 1, EUR: 0.862503, EGP: 50.924246 };

export function convertAmount(amount: number, from: FairPriceCurrency, to: FairPriceCurrency, rates: ExchangeRates) {
  if (from === to) return amount;
  return (amount / rates[from]) * rates[to];
}

export type FairPriceVerdict = "below" | "fair" | "high" | "ripoff";

export function fairPriceVerdict(item: FairPriceItem, amount: number, currency: FairPriceCurrency, rates: ExchangeRates): FairPriceVerdict {
  const value = convertAmount(amount, currency, item.currency, rates);
  // Small tolerance so a rounded conversion of an exact fixed fee still reads as fair.
  const tolerance = item.currency === "EGP" ? 1 : 0.01;
  if (value > item.fairMax + tolerance) {
    if (item.fixed || value > item.ripoffAbove + tolerance) return "ripoff";
    return "high";
  }
  if (!item.fixed && value < item.fairMin - tolerance) return "below";
  return "fair";
}

export function formatFairAmount(amount: number, currency: FairPriceCurrency, intlLocale = "en") {
  const fractionDigits = currency === "EGP" || Number.isInteger(amount) ? 0 : 2;
  return new Intl.NumberFormat(intlLocale, { style: "currency", currency, currencyDisplay: "narrowSymbol", maximumFractionDigits: fractionDigits, minimumFractionDigits: fractionDigits }).format(currency === "EGP" ? Math.round(amount) : amount);
}

export function formatFairRange(item: FairPriceItem, intlLocale = "en") {
  if (item.fairMin === item.fairMax) return formatFairAmount(item.fairMin, item.currency, intlLocale);
  return `${formatFairAmount(item.fairMin, item.currency, intlLocale)} – ${formatFairAmount(item.fairMax, item.currency, intlLocale)}`;
}
