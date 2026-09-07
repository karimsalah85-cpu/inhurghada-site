/**
 * Parses and normalises a raw airport-transfer booking payload into the typed
 * inputs the pricing domain needs. Shared by `booking-validation` (server) and
 * the transfer booking form (client) so there is exactly one shape.
 *
 * This never trusts a client-sent price: it only reads the *inputs*
 * (route, passengers, luggage, extras) and lets `calculateTransferQuote`
 * derive the fare.
 */

import {
  ALLOCATION_CONFIG,
  isTransferZoneKey,
  mapHotelToZone,
  type ChildSeatType,
  type OversizedItemType,
  type TransferDirection,
  type TransferTripType,
  type TransferZoneKey,
  type WheelchairRequirement,
} from "@/lib/transfer-config";
import { calculateTransferQuote, type TransferQuote, type TransferQuoteInput } from "@/lib/transfer-quote";

const OVERSIZED_TYPES = new Set<OversizedItemType>([
  "golf_bag",
  "kitesurf",
  "windsurf",
  "diving_equipment",
  "bicycle",
  "surfboard",
  "wheelchair",
  "baby_stroller",
  "other",
]);
const CHILD_SEAT_TYPES: ChildSeatType[] = ["infant", "child", "booster"];
const DIRECTIONS = new Set<TransferDirection>(["airport_to_hotel", "hotel_to_airport", "hotel_to_hotel"]);
const WHEELCHAIR_VALUES = new Set<WheelchairRequirement>(["none", "folding_manual", "powered_or_fixed"]);

function whole(value: unknown, min: number, max: number): number {
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed) || parsed < min) return min;
  return Math.min(parsed, max);
}

function text(value: unknown, maxLength: number): string {
  return String(value ?? "").trim().slice(0, maxLength);
}

export type ParsedTransferRequest = {
  tripType: TransferTripType;
  direction: TransferDirection;
  zone: TransferZoneKey | null;
  zoneResolvedFrom: "explicit" | "hotel" | "unmapped";
  adults: number;
  children: number;
  infants: number;
  largeBags: number;
  cabinBags: number;
  oversizedItems: { type: OversizedItemType; quantity: number; note?: string }[];
  childSeats: Partial<Record<ChildSeatType, number>>;
  childSeatsRequested: boolean;
  wheelchair: WheelchairRequirement;
  hotelName: string;
  pickupPlaceText: string;
  dropoffPlaceText: string;
  flightNumber: string;
  returnFlightNumber: string;
  returnDate: string;
  returnTime: string;
  quoteInput: TransferQuoteInput;
};

export function parseTransferRequest(body: Record<string, unknown>): { data: ParsedTransferRequest } | { error: string } {
  const tripType: TransferTripType = body.tripType === "round_trip" ? "round_trip" : "one_way";
  const direction: TransferDirection = DIRECTIONS.has(body.direction as TransferDirection)
    ? (body.direction as TransferDirection)
    : "airport_to_hotel";

  const adults = whole(body.adults, 0, ALLOCATION_CONFIG.maxAdults);
  const children = whole(body.children, 0, ALLOCATION_CONFIG.maxChildren);
  const infants = whole(body.infants, 0, ALLOCATION_CONFIG.maxInfants);
  if (adults < 1) return { error: "At least one adult must travel on the transfer." };

  const largeBags = whole(body.largeBags, 0, ALLOCATION_CONFIG.maxLargeBags);
  const cabinBags = whole(body.cabinBags, 0, ALLOCATION_CONFIG.maxCabinBags);

  const hotelName = text(body.hotelName ?? body.hotel, 200);
  const pickupPlaceText = text(body.pickupPlaceText ?? body.pickup, 200);
  const dropoffPlaceText = text(body.dropoffPlaceText ?? body.dropoff, 200);

  let zone: TransferZoneKey | null = null;
  let zoneResolvedFrom: ParsedTransferRequest["zoneResolvedFrom"] = "unmapped";
  if (isTransferZoneKey(body.zone)) {
    zone = body.zone;
    zoneResolvedFrom = "explicit";
  } else if (direction !== "hotel_to_hotel") {
    const mapped = mapHotelToZone(hotelName || pickupPlaceText || dropoffPlaceText);
    if (mapped) {
      zone = mapped;
      zoneResolvedFrom = "hotel";
    }
  }

  const rawOversized = Array.isArray(body.oversizedItems) ? body.oversizedItems.slice(0, 12) : [];
  const oversizedItems = rawOversized
    .map((entry) => {
      const item = entry && typeof entry === "object" && !Array.isArray(entry) ? (entry as Record<string, unknown>) : {};
      const type = item.type as OversizedItemType;
      if (!OVERSIZED_TYPES.has(type)) return null;
      const quantity = whole(item.quantity, 0, 20);
      if (quantity < 1) return null;
      const note = type === "other" ? text(item.note, 120) : "";
      return { type, quantity, ...(note ? { note } : {}) };
    })
    .filter((item): item is { type: OversizedItemType; quantity: number; note?: string } => item !== null);

  const rawSeats = body.childSeats && typeof body.childSeats === "object" && !Array.isArray(body.childSeats)
    ? (body.childSeats as Record<string, unknown>)
    : {};
  const childSeats: Partial<Record<ChildSeatType, number>> = {};
  for (const seatType of CHILD_SEAT_TYPES) {
    const quantity = whole(rawSeats[seatType], 0, 20);
    if (quantity > 0) childSeats[seatType] = quantity;
  }
  const childSeatsRequested = Object.keys(childSeats).length > 0;

  const wheelchair: WheelchairRequirement = WHEELCHAIR_VALUES.has(body.wheelchair as WheelchairRequirement)
    ? (body.wheelchair as WheelchairRequirement)
    : "none";

  const quoteInput: TransferQuoteInput = {
    direction,
    zone,
    tripType,
    adults,
    children,
    infants,
    largeBags,
    cabinBags,
    oversizedItems: oversizedItems.map(({ type, quantity }) => ({ type, quantity })),
    childSeats,
    wheelchair,
  };

  return {
    data: {
      tripType,
      direction,
      zone,
      zoneResolvedFrom,
      adults,
      children,
      infants,
      largeBags,
      cabinBags,
      oversizedItems,
      childSeats,
      childSeatsRequested,
      wheelchair,
      hotelName,
      pickupPlaceText,
      dropoffPlaceText,
      flightNumber: text(body.flightNumber ?? body.flight, 20),
      returnFlightNumber: text(body.returnFlightNumber, 20),
      returnDate: text(body.returnDate, 10),
      returnTime: text(body.returnTime, 5),
      quoteInput,
    },
  };
}

export function quoteTransferRequest(parsed: ParsedTransferRequest): TransferQuote {
  return calculateTransferQuote(parsed.quoteInput);
}
