import { tours } from "@/data/tours";
import { calculateSenzoQuote, calculateTransferQuote } from "@/lib/transfer-quote";
import type { ParsedTransferRequest } from "@/lib/transfer-request";

type PricingInput = {
  type: "tour" | "transfer";
  tourName: string;
  tourSlug?: string;
  extras?: string[];
  selectedBoatOption?: string;
  extraQuantities?: Record<string, number>;
  transferRequired?: boolean;
  transferArea?: string;
  /** Present for the per-vehicle airport transfer product; absent for legacy `service` transfers. */
  transfer?: ParsedTransferRequest;
  adults: number;
  youth: number;
  infants: number;
  service: string;
  pickup: string;
  dropoff: string;
  passengers: number;
  travelBags: number;
  cartItems?: {
    tourSlug: string;
    date: string;
    time: string;
    extras: string[];
    adults: number;
    youth: number;
    infants: number;
    selectedBoatOption?: string;
    extraQuantities?: Record<string, number>;
    transferRequired?: boolean;
    transferArea?: string;
  }[];
};

const transferAreas = new Set(["Hurghada Airport", "Hurghada Hotels", "Senzo Mall", "Makadi Bay", "Sahl Hasheesh", "El Gouna", "Soma Bay"]);
const resortZones = new Set(["Makadi Bay", "Sahl Hasheesh", "El Gouna", "Soma Bay"]);

function wholeNumber(value: number, minimum: number, maximum: number) {
  return Number.isInteger(value) && value >= minimum && value <= maximum;
}

function calculateTourItem(input: Pick<PricingInput, "tourName" | "tourSlug" | "extras" | "adults" | "youth" | "infants" | "selectedBoatOption" | "extraQuantities" | "transferRequired" | "transferArea">) {
  const tour = tours.find((item) => item.slug === input.tourSlug) || tours.find((item) => item.title === input.tourName);
  if (!tour) return { error: "Choose a valid tour." as const };
  if (tour.listingStatus === "paused" || tour.listingStatus === "unlisted") return { error: "This tour is not accepting bookings yet." as const };
  if (!wholeNumber(input.adults, 1, 30) || !wholeNumber(input.youth, 0, 30) || !wholeNumber(input.infants, 0, 10)) {
    return { error: "Choose a valid number of travelers." as const };
  }

  const pricing = tour.participantPricing || { adults: Number(tour.price) };
  if (input.youth && pricing.youth === undefined && !tour.entrancePricing) return { error: "Youth pricing is not available for this tour." as const };
  if (input.infants && pricing.infants === undefined) return { error: "Infant pricing is not available for this tour." as const };
  const allowedExtras: Record<string, Record<string, { price: number; charge: "booking" | "adult" }>> = {
    "full-day-diving": { "diving-equipment": { price: 30, charge: "booking" } },
    "luxor-private-day-trip": { "tutankhamun-ticket": { price: 30, charge: "booking" } },
  };
  const selectedExtras = [...new Set(input.extras || [])];
  const extraPrices = allowedExtras[tour.slug] || {};
  if (selectedExtras.some((extra) => extraPrices[extra] === undefined)) return { error: "Choose valid optional extras." as const };
  const extrasTotal = selectedExtras.reduce((sum, extra) => {
    const option = extraPrices[extra];
    return sum + option.price * (option.charge === "adult" ? input.adults : 1);
  }, 0);
  const boat = tour.boatOptions?.find((option) => option.id === input.selectedBoatOption);
  if (tour.boatOptions?.length && !boat) return { error: "Choose a valid private boat." as const };
  const guests = input.adults + input.youth + input.infants;
  if (boat && guests > boat.capacity) return { error: `The selected boat accepts up to ${boat.capacity} passengers.` as const };
  const quantities = input.extraQuantities || {};
  if (Object.values(quantities).some((quantity) => !wholeNumber(quantity, 0, 30))) return { error: "Choose valid add-on quantities." as const };
  const allowedQuantityExtras = new Map((tour.bookingExtras || []).map((option) => [option.id, option]));
  if (Object.keys(quantities).some((id) => !allowedQuantityExtras.has(id))) return { error: "Choose valid quantity add-ons." as const };
  const quantityExtrasTotal = Object.entries(quantities).reduce((sum, [id, quantity]) => sum + (allowedQuantityExtras.get(id)?.price || 0) * quantity, 0);
  if (tour.requiresMarinaTransferChoice && input.transferRequired && !["Hurghada Hotels", "Makadi Bay", "Sahl Hasheesh", "El Gouna", "Soma Bay", "Safaga"].includes(input.transferArea || "")) return { error: "Choose a valid marina transfer area." as const };
  const entranceTotal = tour.entrancePricing ? input.adults * tour.entrancePricing.adults + input.youth * tour.entrancePricing.youth : 0;
  const participantTotal = boat
    ? boat.price + entranceTotal
    : tour.pricingMode === "per-booking"
    ? pricing.adults
    : input.adults * pricing.adults + input.youth * (pricing.youth ?? pricing.adults) + input.infants * (pricing.infants ?? 0);
  const amount = Math.round((participantTotal + extrasTotal + quantityExtrasTotal) * 100) / 100;
  const guestSummary = tour.pricingMode === "per-booking"
    ? `${guests} passenger${guests === 1 ? "" : "s"}${boat ? ` · ${boat.label}` : ""}`
    : `${input.adults} adult${input.adults === 1 ? "" : "s"}${pricing.youth !== undefined ? ` · ${input.youth} youth` : ""}${pricing.infants !== undefined ? ` · ${input.infants} infant${input.infants === 1 ? "" : "s"}` : ""}`;
  return { data: { amount, guests, guestSummary, tourName: tour.title, currency: tour.currency || "USD" } };
}

export function calculateBookingPrice(input: PricingInput) {
  if (input.type === "tour") {
    if (input.tourSlug === "multi-trip") {
      if (!input.cartItems || input.cartItems.length < 1) return { error: "Add at least one valid trip." as const };
      const pricedItems = [];
      for (const item of input.cartItems) {
        const result = calculateTourItem({ ...item, tourName: "" });
        if (!result.data) return { error: result.error };
        pricedItems.push({ ...result.data, date: item.date, time: item.time });
      }
      const amount = pricedItems.reduce((sum, item) => sum + item.amount, 0);
      const currencies = [...new Set(pricedItems.map((item) => item.currency))];
      if (currencies.length !== 1) return { error: "Trips with different base currencies must be booked separately." as const };
      const guests = pricedItems.reduce((sum, item) => sum + item.guests, 0);
      return { data: {
        amount,
        guests,
        guestSummary: `${input.cartItems.length} trips · ${guests} participant places`,
        tourName: `Multi-trip booking: ${pricedItems.map((item) => item.tourName).join(" + ")}`,
        price: `${currencies[0] === "EUR" ? "€" : "$"}${amount.toFixed(2)} combined total`, currency: currencies[0],
        items: pricedItems,
      } };
    }
    const result = calculateTourItem(input);
    if (!result.data) return result;
    return { data: { ...result.data, price: `${result.data.currency === "EUR" ? "€" : "$"}${result.data.amount.toFixed(2)} total` } };
  }

  if (input.transfer) {
    return priceAirportTransfer(input.transfer);
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

  const resortZone = resortZones.has(input.pickup) || resortZones.has(input.dropoff);

  if (isSenzo) {
    if (input.pickup !== "Senzo Mall" && input.dropoff !== "Senzo Mall") {
      return { error: "Senzo transfers must start or finish at Senzo Mall." as const };
    }
    const quote = calculateSenzoQuote({ passengers: input.passengers, travelBags: input.travelBags, resortZone });
    if (!quote.ok) {
      if (quote.reason === "bags_not_allowed") return { error: "Travel bags are not carried on the Senzo Mall transfer." as const };
      if (quote.reason === "group_exceeds_fleet") return { error: "Message us on WhatsApp to arrange a Senzo transfer for a group this size." as const };
      return { error: "Enter a valid number of passengers." as const };
    }
    const vehicleSummary = quote.allocatedVehicles
      .map((entry) => `${entry.count}× ${VEHICLE_NAMES[entry.vehicleClass] ?? entry.vehicleClass}`)
      .join(" + ");
    return {
      data: {
        amount: quote.total,
        guests: input.passengers,
        guestSummary: `${input.passengers} passenger${input.passengers === 1 ? "" : "s"} · ${vehicleSummary}`,
        tourName: "Senzo Mall one-way transfer",
        price: `$${quote.total.toFixed(2)} total — private vehicle${quote.vehicleCount === 1 ? "" : "s"}, not per person`,
        currency: "USD" as const,
      },
    };
  }

  if (isAirport && input.travelBags > (input.passengers <= 2 ? 2 : input.passengers * 2)) {
    return { error: "The selected vehicle cannot carry that many travel bags." as const };
  }

  const amount = 20 + (resortZone ? 7 : 0);
  return { data: { amount, guests: input.passengers, guestSummary: `${input.passengers} passenger${input.passengers === 1 ? "" : "s"}`, tourName: "Hurghada Airport one-way transfer", price: `$${amount.toFixed(2)} fixed one-way fare`, currency: "USD" } };
}

const ZONE_NAMES: Record<string, string> = {
  hurghada_city: "Hurghada City",
  el_ahyaa: "El Ahyaa / North Hurghada",
  sahl_hasheesh: "Sahl Hasheesh",
  makadi_bay: "Makadi Bay",
  el_gouna: "El Gouna",
  soma_bay: "Soma Bay",
  safaga: "Safaga",
  el_quseir: "El Quseir",
  port_ghalib: "Port Ghalib",
  marsa_alam: "Marsa Alam",
};

const VEHICLE_NAMES: Record<string, string> = {
  sedan: "Private Sedan",
  suv: "Private SUV",
  minivan: "Private Minivan",
  hiace: "Private Hiace / Van",
  minibus: "Private Minibus",
};

function transferJourneyName(request: ParsedTransferRequest) {
  const zoneName = request.zone ? ZONE_NAMES[request.zone] : "your accommodation";
  const airportSide = "Hurghada Airport";
  const label = request.direction === "hotel_to_airport"
    ? `${zoneName} → ${airportSide}`
    : request.direction === "hotel_to_hotel"
    ? `${request.pickupPlaceText || "Hotel"} → ${request.dropoffPlaceText || "Hotel"}`
    : `${airportSide} → ${zoneName}`;
  return `Private airport transfer: ${label}${request.tripType === "round_trip" ? " (round trip)" : ""}`;
}

/**
 * Authoritative fare for the per-vehicle airport transfer product. The browser
 * shows a live quote from the same `calculateTransferQuote`; this recomputes it
 * from the parsed inputs so a tampered payload cannot change the total.
 */
export function priceAirportTransfer(request: ParsedTransferRequest) {
  const quote = calculateTransferQuote(request.quoteInput);
  const tourName = transferJourneyName(request);
  const passengerBits = [
    `${request.adults} adult${request.adults === 1 ? "" : "s"}`,
    request.children ? `${request.children} child${request.children === 1 ? "" : "ren"}` : "",
    request.infants ? `${request.infants} infant${request.infants === 1 ? "" : "s"}` : "",
  ].filter(Boolean).join(" · ");

  if (quote.requiresManualConfirmation) {
    return {
      data: {
        amount: 0,
        guests: quote.totalPassengers,
        guestSummary: `${passengerBits} · quote on request`,
        tourName,
        price: "Quote requested — our team will confirm the vehicle and fare",
        currency: "USD" as const,
      },
    };
  }

  const vehicleSummary = quote.allocatedVehicles
    .map((entry) => `${entry.count}× ${VEHICLE_NAMES[entry.vehicleClass] ?? entry.vehicleClass}`)
    .join(" + ");

  return {
    data: {
      amount: quote.total,
      guests: quote.totalPassengers,
      guestSummary: `${passengerBits} · ${vehicleSummary}`,
      tourName,
      price: `$${quote.total.toFixed(2)} total — private vehicle${quote.vehicleCount === 1 ? "" : "s"}, not per person`,
      currency: "USD" as const,
    },
  };
}
