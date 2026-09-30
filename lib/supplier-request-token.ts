import { createHmac, timingSafeEqual } from "node:crypto";
import { siteUrl } from "@/lib/seo";
import { signingSecret } from "@/lib/ticket-token";

/**
 * Signed links for supplier booking requests: /supplier/<token>.
 *
 * The token is `<request id, hex without dashes>.<signature>` — it names only
 * the request row, never booking data, so a forwarded link reveals nothing on
 * its own and the page always shows the live request. Signing reuses the
 * server-only ticket secret with its own domain prefix, so a ticket signature
 * can never be replayed as a supplier link (or the other way round). A link is
 * revoked by cancelling the request, not by rotating the token.
 */
const tokenPattern = /^([0-9a-f]{32})\.([A-Za-z0-9_-]{27})$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const sign = (compactId: string) =>
  createHmac("sha256", signingSecret()).update(`supplier-request-v1:${compactId}`).digest("base64url").slice(0, 27);

const compact = (id: string) => id.toLowerCase().replace(/-/g, "");
const expand = (hex: string) => `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;

export function createSupplierRequestToken(requestId: string) {
  if (!uuidPattern.test(requestId)) throw new Error("Invalid supplier request id.");
  const id = compact(requestId);
  return `${id}.${sign(id)}`;
}

/** Returns the request id for a genuine token, otherwise null. */
export function verifySupplierRequestToken(token: string | null | undefined): string | null {
  if (!token) return null;
  let value: string;
  try { value = decodeURIComponent(token).trim(); } catch { return null; }
  const match = tokenPattern.exec(value);
  if (!match) return null;
  const [, id, supplied] = match;
  let expected: string;
  try { expected = sign(id); } catch { return null; }
  const a = Buffer.from(supplied), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b) ? expand(id) : null;
}

export function supplierRequestUrl(requestId: string) {
  return new URL(`/supplier/${createSupplierRequestToken(requestId)}`, siteUrl).toString();
}
