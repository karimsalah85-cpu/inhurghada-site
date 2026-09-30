import { createHmac, timingSafeEqual } from "node:crypto";
import { siteUrl } from "@/lib/seo";
import { signingSecret } from "@/lib/ticket-token";

/**
 * Signed waiver links: /waiver/<token>.
 *
 * The token is `<booking reference>.<expiry, unix seconds in base 36>.<signature>`
 * — it carries no guest data, and the page always reads the live booking. It
 * reuses the server-only ticket secret (TICKET_SIGNING_SECRET, or a key derived
 * from the service-role key) with its own domain prefix, so a ticket or supplier
 * signature can never be replayed as a waiver link.
 *
 * Expiry: two days after the service date (so late signers on the day are
 * fine), or 60 days from now when the date is not known yet.
 */
const referencePattern = /^[A-Z0-9][A-Z0-9-]{3,39}$/;
const tokenPattern = /^([A-Z0-9][A-Z0-9-]{3,39})\.([0-9a-z]{5,8})\.([A-Za-z0-9_-]{27})$/;

const sign = (reference: string, expiry: string) =>
  createHmac("sha256", signingSecret()).update(`waiver-v1:${reference}.${expiry}`).digest("base64url").slice(0, 27);

export function waiverExpiry(serviceDate: string | null | undefined, now = new Date()) {
  const date = serviceDate && /^\d{4}-\d{2}-\d{2}$/.test(serviceDate) ? Date.parse(`${serviceDate}T23:59:59Z`) : Number.NaN;
  const expiresAt = Number.isNaN(date) ? now.getTime() + 60 * 86_400_000 : date + 2 * 86_400_000;
  return new Date(Math.floor(expiresAt / 1000) * 1000);
}

export function createWaiverToken(reference: string, expiresAt: Date) {
  const normalized = reference.trim().toUpperCase();
  if (!referencePattern.test(normalized)) throw new Error("Invalid booking reference for a waiver.");
  const expiry = Math.floor(expiresAt.getTime() / 1000).toString(36);
  return `${normalized}.${expiry}.${sign(normalized, expiry)}`;
}

export type VerifiedWaiverToken = { reference: string; expiresAt: Date; expired: boolean };

/** Returns the booking reference for a genuine token (flagging expiry), otherwise null. */
export function verifyWaiverToken(token: string | null | undefined, now = new Date()): VerifiedWaiverToken | null {
  if (!token) return null;
  let value: string;
  try { value = decodeURIComponent(token).trim(); } catch { return null; }
  const match = tokenPattern.exec(value);
  if (!match) return null;
  const [, reference, expiry, supplied] = match;
  let expected: string;
  try { expected = sign(reference, expiry); } catch { return null; }
  const a = Buffer.from(supplied), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const expiresAt = new Date(parseInt(expiry, 36) * 1000);
  return { reference, expiresAt, expired: expiresAt.getTime() < now.getTime() };
}

export function waiverUrl(reference: string, serviceDate: string | null | undefined, now = new Date()) {
  return new URL(`/waiver/${createWaiverToken(reference, waiverExpiry(serviceDate, now))}`, siteUrl).toString();
}

/** Stores only a keyed hash of the signer's IP, never the raw address. */
export function hashIp(ip: string) {
  return createHmac("sha256", signingSecret()).update(`waiver-ip-v1:${ip}`).digest("hex");
}
