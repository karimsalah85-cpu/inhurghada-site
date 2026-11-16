// A "date price" is the price_override on a tour_availability record: the adult price per person
// (or the whole-booking price on per-booking trips) for one tour on one date. The booking form,
// the cart and the server-side checkout total all read it through this file so they agree.

export type DatePriceSlot = { start_time?: string | null; price_override?: number | string | null };

/** Finds the price set for a tour on a date (and start time), if any. */
export type DatePriceLookup = (tourSlug: string, date: string, time?: string) => number | undefined;

type PricedTour = { boatOptions?: unknown[] | null; additionalPackages?: unknown[] | null; groupPricing?: unknown[] | null };

/**
 * A single price per date only fits trips that have a single price. Trips sold by boat, by
 * package or by group-size tier keep their normal prices on every date.
 */
export function supportsDatePrice(tour: PricedTour) {
  return !tour.boatOptions?.length && !tour.additionalPackages?.length && !tour.groupPricing?.length;
}

function hhmm(value: string | null | undefined) {
  const match = /^(\d{1,2}):(\d{2})/.exec(value || "");
  return match ? `${match[1].padStart(2, "0")}:${match[2]}` : null;
}

/** The price for a departure: a record for that exact start time wins over the whole-day record. */
export function pickDatePrice(slots: readonly DatePriceSlot[] | null | undefined, time?: string | null): number | undefined {
  const wanted = hhmm(time);
  let wholeDay: number | undefined;
  let timed: number | undefined;
  for (const slot of slots || []) {
    if (slot.price_override == null || slot.price_override === "") continue;
    const price = Number(slot.price_override);
    if (!Number.isFinite(price) || price <= 0) continue;
    const slotTime = hhmm(slot.start_time);
    if (!slotTime) wholeDay = price;
    else if (wanted && slotTime === wanted) timed = price;
  }
  return timed ?? wholeDay;
}

/**
 * Rates for a date with its own price. The date price replaces the adult rate; a child rate
 * keeps the same proportion to the adult rate that it has on a normal day.
 */
export function datePriceRates(normalAdult: number, normalYouth: number | undefined, datePrice: number | undefined) {
  if (datePrice === undefined) return { adult: normalAdult, youth: normalYouth };
  const youth = normalYouth === undefined ? undefined
    : normalAdult > 0 ? Math.round((normalYouth * datePrice / normalAdult) * 100) / 100
    : normalYouth;
  return { adult: datePrice, youth };
}

export const DATE_PRICE_UNSUPPORTED = "This trip is priced by boat, package or group size, so one price for the date cannot apply. Leave the price empty.";
