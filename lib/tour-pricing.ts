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

type PricedBy = Pick<Tour, "boatOptions" | "groupPricing" | "additionalPackages" | "priceUnit">;

/**
 * Whether the admin trip editor's price fields decide what guests pay. True for trips with one
 * adult/child/infant price. Trips priced per boat, per group-size tier, per package or per
 * vehicle are charged from tables the editor has no fields for, so a price typed there would
 * only change the advertised figure and disagree with checkout.
 */
export function adminCanEditPrice(tour: PricedBy | undefined) {
  return Boolean(tour) && !tour!.boatOptions?.length && !tour!.groupPricing?.length && !tour!.additionalPackages?.length && tour!.priceUnit !== "per vehicle";
}

/** Boat id → prices, and group tier (its `minTravelers`) → price per person, as typed in the admin trip editor. */
export type AdminBoatPrices = Record<string, { price?: number; extraHourPrice?: number }>;
export type AdminGroupPrices = Record<string, number>;

const money = (value: unknown) => {
  const amount = typeof value === "string" && value.trim() === "" ? NaN : Number(value);
  return value != null && Number.isFinite(amount) && amount > 0 && amount <= 1_000_000 ? Math.round(amount * 100) / 100 : undefined;
};

/** Keeps only usable entries: positive amounts for boats and tiers that exist on the trip. */
export function cleanAdminPriceTables(tour: Pick<Tour, "boatOptions" | "groupPricing"> | undefined, raw: { adminBoatPrices?: unknown; adminGroupPrices?: unknown }) {
  const boats: AdminBoatPrices = {};
  const boatInput = (raw.adminBoatPrices && typeof raw.adminBoatPrices === "object" ? raw.adminBoatPrices : {}) as Record<string, { price?: unknown; extraHourPrice?: unknown } | undefined>;
  for (const option of tour?.boatOptions || []) {
    const price = money(boatInput[option.id]?.price);
    const extraHourPrice = option.extraHourPrice === undefined ? undefined : money(boatInput[option.id]?.extraHourPrice);
    if (price !== undefined || extraHourPrice !== undefined) boats[option.id] = { ...(price !== undefined ? { price } : {}), ...(extraHourPrice !== undefined ? { extraHourPrice } : {}) };
  }
  const groups: AdminGroupPrices = {};
  const groupInput = (raw.adminGroupPrices && typeof raw.adminGroupPrices === "object" ? raw.adminGroupPrices : {}) as Record<string, unknown>;
  for (const tier of tour?.groupPricing || []) {
    const price = money(groupInput[String(tier.minTravelers)]);
    if (price !== undefined) groups[String(tier.minTravelers)] = price;
  }
  return { adminBoatPrices: boats, adminGroupPrices: groups };
}

/**
 * Applies boat and group-size prices set in the admin trip editor on top of the tables in code.
 * The boats, their capacities and the group-size steps stay as coded; only the amounts change,
 * and anything left empty keeps its coded price.
 */
export function applyAdminPriceTables<T extends Pick<Tour, "boatOptions" | "groupPricing">>(tour: T, body: { adminBoatPrices?: unknown; adminGroupPrices?: unknown }): T {
  const { adminBoatPrices, adminGroupPrices } = cleanAdminPriceTables(tour, body);
  if (!Object.keys(adminBoatPrices).length && !Object.keys(adminGroupPrices).length) return tour;
  return {
    ...tour,
    boatOptions: tour.boatOptions?.map((option) => ({ ...option, ...adminBoatPrices[option.id] })),
    groupPricing: tour.groupPricing?.map((tier) => ({ ...tier, pricePerPerson: adminGroupPrices[String(tier.minTravelers)] ?? tier.pricePerPerson })),
  };
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
      ...pkg, ...translated.additionalPackages?.[index], price: pkg.price, youthPrice: pkg.youthPrice,
    })),
  };
}
