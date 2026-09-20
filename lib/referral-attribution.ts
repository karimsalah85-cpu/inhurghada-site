import { isValidReferralCode, REFERRAL_COOKIE_MAX_AGE_SECONDS, REFERRAL_COOKIE_NAME } from "@/lib/referral";

type StoredReferral = { code: string; capturedAt: number };

/** Captures ?ref=CODE on arrival and remembers it for 30 days, mirroring captureLandingAttribution's
 * pattern. Only a non-secret referral code is stored — never customer PII — matching the project's
 * "do not put sensitive information in the browser" convention for attribution data. */
export function captureReferralAttribution() {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("ref")?.trim().toUpperCase();
    if (code && isValidReferralCode(code)) {
      const stored: StoredReferral = { code, capturedAt: Date.now() };
      window.localStorage.setItem(REFERRAL_COOKIE_NAME, JSON.stringify(stored));
    }
  } catch {
    // Attribution persistence is optional; page rendering must continue.
  }
}

export function getStoredReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(REFERRAL_COOKIE_NAME);
    if (!raw) return null;
    const stored = JSON.parse(raw) as StoredReferral;
    if (!isValidReferralCode(stored.code)) return null;
    const ageSeconds = (Date.now() - stored.capturedAt) / 1000;
    if (ageSeconds > REFERRAL_COOKIE_MAX_AGE_SECONDS) {
      window.localStorage.removeItem(REFERRAL_COOKIE_NAME);
      return null;
    }
    return stored.code;
  } catch {
    return null;
  }
}
