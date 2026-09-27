import type { Tour } from "@/data/tours";
import { groupRate } from "@/lib/group-pricing";

/** Keep advertised and primary package rates aligned with the booking calculator. */
export function normalizeTourPricing(tour: Tour): Tour {
  if (tour.additionalPackages?.length) return tour;
  const adult = groupRate(tour.groupPricing, tour.groupSize?.min ?? 1)
    ?? tour.participantPricing?.adults ?? Number(tour.price);
  if (!Number.isFinite(adult)) return tour;
  // Private boats advertise the boat fare; island entrance is an explicit extra.
  const price = tour.boatOptions?.[0]?.price ?? adult;
  return { ...tour, price: Number(tour.price) === price ? tour.price : String(price), packagePrice: tour.packagePrice === undefined ? undefined : Number(tour.packagePrice) === price ? tour.packagePrice : String(price) };
}

/** A CMS price-only edit must not inherit an older adult rate from the fallback. */
export function mergeTourPricing(fallback: Tour | undefined, body: Partial<Tour>): Partial<Tour> {
  if (body.participantPricing || body.price === undefined) return body;
  const adult = Number(body.price);
  if (!Number.isFinite(adult)) return body;
  return { ...body, participantPricing: { ...fallback?.participantPricing, adults: adult } };
}

/** Translations may change package names, but may never restore an older price. */
export function preserveTourPrices(source: Tour, translated: Tour): Tour {
  return {
    ...translated,
    price: source.price, packagePrice: source.packagePrice, originalPrice: source.originalPrice,
    currency: source.currency, participantPricing: source.participantPricing,
    groupPricing: source.groupPricing, groupSize: source.groupSize,
    additionalPackages: source.additionalPackages?.map((pkg, index) => ({
      ...pkg, ...translated.additionalPackages?.[index], price: pkg.price,
    })),
  };
}
