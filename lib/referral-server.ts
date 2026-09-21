import { createHash, createHmac, randomInt, timingSafeEqual } from "node:crypto";

export function generateOtp() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashOtp(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

const REDEMPTION_TOKEN_TTL_MS = 30 * 60 * 1000;

function tokenSecret() {
  const secret = process.env.REFERRAL_TOKEN_SECRET;
  if (!secret) throw new Error("REFERRAL_TOKEN_SECRET is not configured.");
  return secret;
}

/** A short-lived, server-signed proof that a customer verified ownership of an email/phone via OTP. */
export function signRedemptionToken(customerKey: string) {
  const expires = Date.now() + REDEMPTION_TOKEN_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ version: 1, customerKey, expires })).toString("base64url");
  const signature = createHmac("sha256", tokenSecret()).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

export function verifyRedemptionToken(token: string | undefined, customerKey: string) {
  if (!token) return false;
  try {
    if (token.length > 2048) return false;
    const parts = token.split(".");
    if (parts.length !== 2) return false;
    const [payload, signature] = parts;
    if (!/^[a-f0-9]{64}$/.test(signature)) return false;
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (claims.version !== 1 || claims.customerKey !== customerKey) return false;
    if (!Number.isSafeInteger(claims.expires) || Date.now() >= claims.expires || claims.expires > Date.now() + REDEMPTION_TOKEN_TTL_MS) return false;
    const expected = createHmac("sha256", tokenSecret()).update(payload).digest("hex");
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
