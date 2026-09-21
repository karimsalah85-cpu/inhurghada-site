"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Gift } from "lucide-react";
import { localePath, type Locale } from "@/lib/i18n";
import { referralCopy, referralProgramCopy } from "@/lib/referral-i18n";
import { trackEvent } from "@/lib/analytics";

/** Public explanation only: private balances and personal links require verification. */
export default function ReferralProgramInfo({ locale, compact = false }: { locale: Locale; compact?: boolean }) {
  const copy = referralProgramCopy[locale];
  useEffect(() => { trackEvent("referral_program_viewed", { placement: compact ? "booking" : "website" }); }, [compact]);
  return <aside dir={locale === "ar" ? "rtl" : "ltr"} className="rounded-2xl border border-line bg-ocean-tint p-5 sm:p-6">
    <h2 className="flex items-center gap-2 text-lg font-black text-ocean-dark"><Gift size={20} aria-hidden="true" />{referralCopy[locale].heading}</h2>
    {compact ? <p className="mt-2 text-sm text-muted">{copy.locked}</p> : <>
      <h3 className="mt-3 text-sm font-bold text-ink">{copy.howItWorks}</h3>
      <ol className="mt-2 list-decimal space-y-2 ps-5 text-sm text-muted"><li>{copy.stepOne}</li><li>{copy.stepTwo}</li><li>{copy.stepThree}</li></ol>
    </>}
    <p className="mt-3 text-xs leading-5 text-muted">{copy.terms}</p>
    <Link href={localePath(locale, "/referrals")} className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-ocean-dark px-4 py-2 text-sm font-bold text-ocean-dark">{copy.viewRewards}</Link>
  </aside>;
}
