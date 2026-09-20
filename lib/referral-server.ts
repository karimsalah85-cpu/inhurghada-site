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
  const payload = `${customerKey}.${expires}`;
  const signature = createHmac("sha256", tokenSecret()).update(payload).digest("hex");
  return Buffer.from(`${payload}.${signature}`).toString("base64url");
}

export function verifyRedemptionToken(token: string | undefined, customerKey: string) {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [key, expiresRaw, signature] = decoded.split(".");
    if (!key || !expiresRaw || !signature) return false;
    const expires = Number(expiresRaw);
    if (!Number.isFinite(expires) || Date.now() > expires) return false;
    if (key !== customerKey) return false;
    const expected = createHmac("sha256", tokenSecret()).update(`${key}.${expiresRaw}`).digest("hex");
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
