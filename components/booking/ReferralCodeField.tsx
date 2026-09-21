"use client";
import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { referralCopy } from "@/lib/referral-i18n";
import { getStoredReferralCode } from "@/lib/referral-attribution";
import { isValidReferralCode } from "@/lib/referral";

export function useReferralCode() {
  const [code, setCode] = useState("");
  useEffect(() => {
    const stored = getStoredReferralCode();
    const update = window.setTimeout(() => { if (stored) setCode(stored); }, 0);
    return () => window.clearTimeout(update);
  }, []);
  return { code, setCode, valid: !code || isValidReferralCode(code.toUpperCase()) };
}

/** Manual referral-code entry, shown alongside the promo code field. A code carried in from a
 * shared link is pre-filled; the actual discount is always computed server-side at submission. */
export default function ReferralCodeField({ referral, locale, disabled = false }: { referral: ReturnType<typeof useReferralCode>; locale: Locale; disabled?: boolean }) {
  const copy = referralCopy[locale];
  return <div className="rounded-2xl border border-line p-4">
    <label className="block text-sm font-bold text-ink">{copy.checkoutCodeLabel}
      <input dir="ltr" value={referral.code} maxLength={36} disabled={disabled} onChange={(event) => referral.setCode(event.target.value.toUpperCase())} placeholder="DRS-XXXXXX" autoComplete="off" className="mt-2 w-full rounded-xl border border-line px-3 py-3 uppercase"/>
    </label>
    <p className="mt-2 text-xs text-muted">{copy.checkoutHint}</p>
    {!referral.valid ? <p role="alert" className="mt-2 text-sm text-rose-700">{copy.invalidCode}</p> : null}
    {referral.code ? <button type="button" disabled={disabled} onClick={() => referral.setCode("")} className="mt-3 rounded-lg border border-line px-4 py-2 text-sm font-semibold">{copy.checkoutRemove}</button> : null}
  </div>;
}
