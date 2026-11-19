/**
 * Hurghada Fair Price Index — what common tourist purchases should cost.
 *
 * Ranges are researched from 2026 travel guides, Numbeo and OTA listings and
 * reviewed by Daily Red Sea before publishing. `ripoffAbove` is an editorial
 * judgement, not an official tariff. Update `fairPricesReviewedOn` whenever a
 * number changes.
 */

export const fairPricesReviewedOn = "2026-11-19";

export type FairPriceCurrency = "USD" | "EUR" | "EGP";

export type FairPriceCategory = "arrival" | "transport" | "trips" | "food";

export type FairPriceItem = {
  id: string;
  category: FairPriceCategory;
  name: string;
  /** Who/what the price covers, e.g. "per person" or "per car". */
  unit: string;
  currency: FairPriceCurrency;
  fairMin: number;
  fairMax: number;
  /** Anything above this is flagged as a rip-off. Equal to fairMax for fixed official fees. */
  ripoffAbove: number;
  /** Official fixed fee: anything above fairMax is a rip-off, with no "a bit high" band. */
  fixed?: boolean;
  tip: string;
  /** Daily Red Sea tour that covers this purchase, shown with its live price. */
  tourSlug?: string;
};

export const fairPriceCategories: { id: FairPriceCategory; label: string }[] = [
  { id: "arrival", label: "Arrival essentials" },
  { id: "transport", label: "Taxis & transfers" },
  { id: "trips", label: "Boat trips, safaris & excursions" },
  { id: "food", label: "Drinks & everyday prices" },
];

export const fairPriceItems: FairPriceItem[] = [
  {
    id: "visa-on-arrival",
    category: "arrival",
    name: "Egypt visa on arrival (single entry)",
    unit: "per person",
    currency: "USD",
    fairMin: 30,
    fairMax: 30,
    ripoffAbove: 30,
    fixed: true,
    tip: "Buy it yourself at the bank counter before passport control, cash in US dollars. The online e-visa costs $25. Nobody needs to “help” you for a fee.",
  },
  {
    id: "tourist-sim",
    category: "arrival",
    name: "Tourist SIM card at the airport (30–40 GB)",
    unit: "per SIM",
    currency: "EGP",
    fairMin: 450,
    fairMax: 700,
    ripoffAbove: 1200,
    tip: "Buy only at the official Vodafone, Orange, Etisalat or WE counters after baggage claim, with your passport. Avoid SIMs sold in souvenir shops.",
  },
  {
    id: "airport-uber-central",
    category: "transport",
    name: "Airport → central Hurghada hotel by Uber or Careem",
    unit: "per car",
    currency: "EGP",
    fairMin: 150,
    fairMax: 300,
    ripoffAbove: 500,
    tip: "The app shows the price before you ride. Walk to the pickup zone outside arrivals and check the number plate.",
  },
  {
    id: "airport-taxi-central",
    category: "transport",
    name: "Airport → central Hurghada hotel by taxi or private car",
    unit: "per car",
    currency: "EGP",
    fairMin: 250,
    fairMax: 750,
    ripoffAbove: 1000,
    tip: "Agree the total price and currency before you get in, and confirm it is per car, not per person. Pre-booking fixes the price.",
    tourSlug: "hurghada-airport-transfer",
  },
  {
    id: "airport-taxi-makadi-sahl",
    category: "transport",
    name: "Airport → Makadi Bay or Sahl Hasheesh",
    unit: "per car",
    currency: "EGP",
    fairMin: 400,
    fairMax: 1250,
    ripoffAbove: 1800,
    tip: "These resorts are 20–40 minutes away. Prices quoted in euros at the taxi rank are usually the most inflated.",
    tourSlug: "hurghada-airport-transfer",
  },
  {
    id: "airport-taxi-el-gouna",
    category: "transport",
    name: "Airport → El Gouna",
    unit: "per car",
    currency: "EGP",
    fairMin: 500,
    fairMax: 1500,
    ripoffAbove: 2200,
    tip: "El Gouna is about 30–40 minutes north. Ride-hailing apps are often cheapest; confirm the drop-off gate for your hotel.",
    tourSlug: "hurghada-airport-transfer",
  },
  {
    id: "town-taxi",
    category: "transport",
    name: "Short taxi ride inside Hurghada (3–5 km)",
    unit: "per car",
    currency: "EGP",
    fairMin: 50,
    fairMax: 150,
    ripoffAbove: 300,
    tip: "Street taxis rarely use the meter. Agree the price first, or use Uber/Careem to see a fixed fare.",
  },
  {
    id: "orange-bay",
    category: "trips",
    name: "Orange Bay group boat trip with lunch",
    unit: "per adult",
    currency: "USD",
    fairMin: 20,
    fairMax: 40,
    ripoffAbove: 55,
    tip: "Most prices exclude the Giftun national park fee (about $5, cash on the day). Ask whether hotel pickup and lunch are included.",
    tourSlug: "orange-bay",
  },
  {
    id: "snorkeling-boat",
    category: "trips",
    name: "Snorkeling boat trip with lunch (2–3 reef stops)",
    unit: "per adult",
    currency: "USD",
    fairMin: 20,
    fairMax: 35,
    ripoffAbove: 50,
    tip: "Check that snorkel gear, lunch and hotel pickup are included, and that the boat carries life jackets in your size.",
    tourSlug: "full-day-snorkeling",
  },
  {
    id: "dolphin-house",
    category: "trips",
    name: "Dolphin House snorkeling trip",
    unit: "per adult",
    currency: "USD",
    fairMin: 25,
    fairMax: 45,
    ripoffAbove: 65,
    tip: "Dolphins are wild and never guaranteed. Be wary of anyone who “guarantees” swimming with them or charges extra to get closer.",
    tourSlug: "dolphin-house-snorkeling",
  },
  {
    id: "quad-safari",
    category: "trips",
    name: "Quad bike safari with camel ride (2–3 hours)",
    unit: "per adult",
    currency: "USD",
    fairMin: 15,
    fairMax: 30,
    ripoffAbove: 50,
    tip: "Ask whether the quad is shared or single, and whether dinner or a show is included — that explains most price differences.",
    tourSlug: "safari",
  },
  {
    id: "intro-dive",
    category: "trips",
    name: "Beginner intro dive by boat (no licence needed)",
    unit: "per person",
    currency: "USD",
    fairMin: 40,
    fairMax: 65,
    ripoffAbove: 90,
    tip: "Make sure an instructor stays with you in the water, and that equipment and the marine park fee are included.",
    tourSlug: "beginner-scuba-diving",
  },
  {
    id: "luxor-private-day",
    category: "trips",
    name: "Luxor private day trip from Hurghada (2 travellers)",
    unit: "per person",
    currency: "USD",
    fairMin: 150,
    fairMax: 220,
    ripoffAbove: 300,
    tip: "Confirm which entry tickets are included — the Valley of the Kings and special tombs are often extra.",
    tourSlug: "luxor-private-day-trip",
  },
  {
    id: "local-beer",
    category: "food",
    name: "Local beer (0.5 L) in a bar outside hotels",
    unit: "per beer",
    currency: "EGP",
    fairMin: 80,
    fairMax: 150,
    ripoffAbove: 300,
    tip: "Ask for the menu with prices before ordering. Hotel and nightclub prices are higher.",
  },
  {
    id: "shisha",
    category: "food",
    name: "Shisha in a café",
    unit: "per shisha",
    currency: "EGP",
    fairMin: 100,
    fairMax: 200,
    ripoffAbove: 400,
    tip: "Check whether service charge and tax are added to the bill.",
  },
  {
    id: "water",
    category: "food",
    name: "Bottled water (1.5 L) in a shop",
    unit: "per bottle",
    currency: "EGP",
    fairMin: 10,
    fairMax: 25,
    ripoffAbove: 50,
    tip: "Supermarkets print prices on the shelf. Kiosks near hotels often charge tourists double.",
  },
];

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

export function formatFairAmount(amount: number, currency: FairPriceCurrency) {
  const fractionDigits = currency === "EGP" || Number.isInteger(amount) ? 0 : 2;
  return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: fractionDigits, minimumFractionDigits: fractionDigits }).format(currency === "EGP" ? Math.round(amount) : amount);
}

export function formatFairRange(item: FairPriceItem) {
  if (item.fairMin === item.fairMax) return formatFairAmount(item.fairMin, item.currency);
  return `${formatFairAmount(item.fairMin, item.currency)} – ${formatFairAmount(item.fairMax, item.currency)}`;
}
