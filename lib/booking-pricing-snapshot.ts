export type ParticipantCounts = { adults: number; youth: number; infants: number };
export type PricingLine = {
  kind: "adults" | "youth" | "infants" | "booking" | "vehicle" | "extra" | "entrance";
  label?: string;
  quantity: number;
  unitPrice: number;
  total: number;
};
export type PricingTrip = {
  name: string;
  date?: string;
  time?: string;
  participants: ParticipantCounts | null;
  guests: number;
  lines: PricingLine[];
};
export type BookingPricingSnapshot = {
  version: 1;
  currency: string;
  subtotal: number;
  pending: boolean;
  trips: PricingTrip[];
};

export const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
export function pricingLine(kind: PricingLine["kind"], quantity: number, unitPrice: number, label?: string): PricingLine {
  return { kind, quantity, unitPrice, total: roundMoney(quantity * unitPrice), ...(label ? { label } : {}) };
}

/** Treat missing, newer or inconsistent historical snapshots as unavailable. */
export function readPricingSnapshot(value: unknown, currency: string, subtotal: number | null): BookingPricingSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const snapshot = value as BookingPricingSnapshot;
  if (snapshot.version !== 1 || snapshot.currency !== currency.toUpperCase() || typeof snapshot.pending !== "boolean"
    || !Number.isFinite(snapshot.subtotal) || snapshot.subtotal < 0 || !Array.isArray(snapshot.trips) || !snapshot.trips.length
    || subtotal === null || Math.abs(snapshot.subtotal - subtotal) > 0.011) return null;
  let total = 0;
  for (const trip of snapshot.trips) {
    if (!trip || typeof trip.name !== "string" || !Number.isInteger(trip.guests) || trip.guests < 1 || !Array.isArray(trip.lines)) return null;
    if (trip.participants !== null && !validParticipantCounts(trip.participants, trip.guests)) return null;
    for (const line of trip.lines) {
      if (!line || !["adults", "youth", "infants", "booking", "vehicle", "extra", "entrance"].includes(line.kind)
        || (line.label !== undefined && typeof line.label !== "string")
        || !Number.isInteger(line.quantity) || line.quantity < 1 || !Number.isFinite(line.unitPrice) || line.unitPrice < 0
        || !Number.isFinite(line.total) || Math.abs(roundMoney(line.quantity * line.unitPrice) - line.total) > 0.011) return null;
      total += line.total;
    }
  }
  return Math.abs(roundMoney(total) - snapshot.subtotal) <= 0.011 ? snapshot : null;
}

export function validParticipantCounts(value: unknown, guests?: number | null): value is ParticipantCounts {
  if (!value || typeof value !== "object") return false;
  const counts = value as ParticipantCounts;
  return [counts.adults, counts.youth, counts.infants].every(n => Number.isInteger(n) && n >= 0)
    && counts.adults + counts.youth + counts.infants > 0
    && (guests == null || counts.adults + counts.youth + counts.infants === guests);
}

/** Only parse the server-generated multi-trip prefix, never the customer note. */
export function historicalTripParticipants(notes: string | null | undefined) {
  const prefix = (notes || "").split("Customer note:")[0].trim();
  const trips: { name: string; date: string; time: string; participants: ParticipantCounts }[] = [];
  for (const block of prefix.split("\n\n")) {
    const match = block.match(/^\d+\. ([^\n]+)\nDate: (\d{4}-\d{2}-\d{2})\nTime: ([^\n]*)\nTravelers: (\d+) adults?(?: · (\d+) youth)?(?: · (\d+) infants?)?\nTrip total: [^\n]+$/);
    if (!match) return [];
    const participants = { adults: Number(match[4]), youth: Number(match[5] || 0), infants: Number(match[6] || 0) };
    if (!validParticipantCounts(participants)) return [];
    trips.push({ name: match[1], date: match[2], time: match[3], participants });
  }
  return trips;
}
