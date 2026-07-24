import { tours } from "@/data/tours";

type PricingInput = {
  type: "tour" | "transfer";
  tourName: string;
  tourSlug?: string;
  extras?: string[];
  adults: number;
  youth: number;
  infants: number;
  service: string;
  pickup: string;
  dropoff: string;
  passengers: number;
  travelBags: number;
};

const transferAreas = new Set(["Hurghada Airport", "Hurghada Hotels", "Senzo Mall", "Makadi Bay", "Sahl Hasheesh", "El Gouna", "Soma Bay"]);
const resortZones = new Set(["Makadi Bay", "Sahl Hasheesh", "El Gouna", "Soma Bay"]);

function wholeNumber(value: number, minimum: number, maximum: number) {
  return Number.isInteger(value) && value >= minimum && value <= maximum;
}

export function calculateBookingPrice(input: PricingInput) {
  if (input.type === "tour") {
    const tour = tours.find((item) => item.slug === input.tourSlug) || tours.find((item) => item.title === input.tourName);
    if (!tour) return { error: "Choose a valid tour." as const };
    if (!wholeNumber(input.adults, 1, 30) || !wholeNumber(input.youth, 0, 30) || !wholeNumber(input.infants, 0, 10)) {
      return { error: "Choose a valid number of travelers." as const };
    }

    const pricing = tour.participantPricing || { adults: Number(tour.price) };
    if (input.youth && pricing.youth === undefined) return { error: "Youth pricing is not available for this tour." as const };
    if (input.infants && pricing.infants === undefined) return { error: "Infant pricing is not available for this tour." as const };
    const allowedExtras: Record<string, Record<string, number>> = {
      "full-day-diving": { "diving-equipment": 30 },
      "luxor-private-day-trip": { "tutankhamun-ticket": 30 },
    };
    const selectedExtras = [...new Set(input.extras || [])];
    const extraPrices = allowedExtras[tour.slug] || {};
    if (selectedExtras.some((extra) => extraPrices[extra] === undefined)) return { error: "Choose valid optional extras." as const };
    const extrasTotal = selectedExtras.reduce((sum, extra) => sum + extraPrices[extra], 0);
    const amount = input.adults * pricing.adults + input.youth * (pricing.youth ?? pricing.adults) + input.infants * (pricing.infants ?? 0) + extrasTotal;
    const guests = input.adults + input.youth + input.infants;
    const guestSummary = `${input.adults} adult${input.adults === 1 ? "" : "s"}${pricing.youth !== undefined ? ` · ${input.youth} youth` : ""}${pricing.infants !== undefined ? ` · ${input.infants} infant${input.infants === 1 ? "" : "s"}` : ""}`;

    return { data: { amount, guests, guestSummary, tourName: tour.title, price: `$${amount.toFixed(2)} total` } };
  }

  if (!wholeNumber(input.passengers, 1, 30) || !wholeNumber(input.travelBags, 0, 60)) {
    return { error: "Enter valid passenger and bag counts." as const };
  }
  if (!transferAreas.has(input.pickup) || !transferAreas.has(input.dropoff) || input.pickup === input.dropoff) {
    return { error: "Choose a valid transfer route." as const };
  }

  const isAirport = input.service === "airport";
  const isSenzo = input.service === "senzo";
  if (!isAirport && !isSenzo) return { error: "Choose a valid transfer service." as const };
  if (isAirport && input.pickup !== "Hurghada Airport" && input.dropoff !== "Hurghada Airport") {
    return { error: "Airport transfers must start or finish at Hurghada Airport." as const };
  }
  if (isSenzo && input.pickup !== "Senzo Mall" && input.dropoff !== "Senzo Mall") {
    return { error: "Senzo transfers must start or finish at Senzo Mall." as const };
  }
  if (isSenzo && (input.passengers > 4 || input.travelBags !== 0)) {
    return { error: "Senzo transfers allow up to 4 passengers and no travel bags." as const };
  }
  if (isAirport && input.travelBags > (input.passengers <= 2 ? 2 : input.passengers * 2)) {
    return { error: "The selected vehicle cannot carry that many travel bags." as const };
  }

  const amount = (isAirport ? 20 : 10) + (resortZones.has(input.pickup) || resortZones.has(input.dropoff) ? 7 : 0);
  const tourName = isAirport ? "Hurghada Airport one-way transfer" : "Senzo Mall one-way transfer";
  return { data: { amount, guests: input.passengers, guestSummary: `${input.passengers} passenger${input.passengers === 1 ? "" : "s"}`, tourName, price: `$${amount.toFixed(2)} fixed one-way fare` } };
}
