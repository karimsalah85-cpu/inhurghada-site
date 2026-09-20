/** Isomorphic referral helpers — safe to import from client components. Server-only crypto
 * (OTP hashing, redemption token signing) lives in lib/referral-server.ts instead. */

/** Mirrors the SQL referral_customer_key() function: normalized email, else digits-only phone. */
export function referralCustomerKey(email?: string | null, phone?: string | null) {
  const normalizedEmail = (email || "").trim().toLowerCase();
  if (normalizedEmail) return normalizedEmail;
  const digitsOnly = (phone || "").replace(/\D/g, "");
  return digitsOnly || null;
}

export function referralLink(origin: string, code: string) {
  const url = new URL("/", origin);
  url.searchParams.set("ref", code);
  return url.toString();
}

export const REFERRAL_COOKIE_NAME = "drs_ref";
export const REFERRAL_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
export const referralCodePattern = /^DRS-[A-Z0-9]{6}$/;

export function isValidReferralCode(value: unknown): value is string {
  return typeof value === "string" && referralCodePattern.test(value);
}

/** 1 reward unit = 5 percentage points; at most 3 units (15%) redeemable on a single booking. */
export function availablePercentFromUnits(units: number) {
  return Math.max(0, units) * 5;
}

export function redeemableUnits(balanceUnits: number) {
  return Math.max(0, Math.min(3, balanceUnits));
}
