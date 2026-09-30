import { createHmac, timingSafeEqual } from "node:crypto";
import { siteUrl } from "@/lib/seo";

/**
 * Per-trip ticket tokens printed as QR codes on confirmations.
 *
 * The QR carries only `<reference>~<trip index>~<signature>`, never the guest's
 * details: scanning it opens /ticket/<token>, which reads the live booking from
 * the database. That keeps tickets unforgeable, private if a photo is shared,
 * and always current when a pickup time or head count changes after booking.
 */
const referencePattern = /^[A-Z0-9][A-Z0-9-]{3,39}$/;
const tokenPattern = /^([A-Z0-9][A-Z0-9-]{3,39})~(\d{1,2})~([A-Za-z0-9_-]{22})$/;
export const maxTicketTrips = 20;

/** Server-only secret shared by ticket signatures and guide check-in credentials. */
export function signingSecret() {
  const explicit = process.env.TICKET_SIGNING_SECRET?.trim();
  if (explicit) return explicit;
  // Fall back to a key derived from the server-only service-role key so tickets
  // work without extra configuration; set TICKET_SIGNING_SECRET to decouple them.
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceKey) throw new Error("TICKET_SIGNING_SECRET is not configured.");
  return createHmac("sha256", serviceKey).update("daily-red-sea-ticket-v1").digest("hex");
}

const signature = (reference: string, tripIndex: number) =>
  createHmac("sha256", signingSecret()).update(`${reference}~${tripIndex}`).digest("base64url").slice(0, 22);

export function createTicketToken(reference: string, tripIndex = 0) {
  const normalized = reference.trim().toUpperCase();
  if (!referencePattern.test(normalized)) throw new Error("Invalid booking reference for a ticket.");
  if (!Number.isInteger(tripIndex) || tripIndex < 0 || tripIndex >= maxTicketTrips) throw new Error("Invalid ticket trip index.");
  return `${normalized}~${tripIndex}~${signature(normalized, tripIndex)}`;
}

export function verifyTicketToken(token: string | null | undefined): { reference: string; tripIndex: number } | null {
  if (!token) return null;
  const match = tokenPattern.exec(decodeURIComponent(token).trim());
  if (!match) return null;
  const [, reference, rawIndex, supplied] = match;
  const tripIndex = Number(rawIndex);
  if (tripIndex >= maxTicketTrips) return null;
  let expected: string;
  try { expected = signature(reference, tripIndex); } catch { return null; }
  const a = Buffer.from(supplied), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b) ? { reference, tripIndex } : null;
}

export function ticketUrl(reference: string, tripIndex = 0) {
  return new URL(`/ticket/${createTicketToken(reference, tripIndex)}`, siteUrl).toString();
}
