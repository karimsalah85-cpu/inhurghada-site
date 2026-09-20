"use client";
import { useState } from "react";
import { Check, Copy, Gift, MessageCircle } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { referralCopy } from "@/lib/referral-i18n";
import { referralLink } from "@/lib/referral";
import { trackEvent } from "@/lib/analytics";

type VerifiedState = {
  referralCode: string | null;
  balanceUnits: number;
  qualifiedReferrals: number;
  pendingReferrals: number;
  redemptionToken: string | null;
};

export default function ReferralDashboard({ locale }: { locale: Locale }) {
  const copy = referralCopy[locale];
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState<VerifiedState | null>(null);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  async function requestCode() {
    setBusy(true); setError("");
    try {
      await fetch("/api/referral/verify/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, phone }) });
      setCodeSent(true);
    } finally { setBusy(false); }
  }

  async function confirmCode() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/referral/verify/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, phone, code: otp }) });
      const data = await response.json();
      if (!response.ok || !data.verified) throw new Error(data.error || copy.invalidCode);
      setVerified(data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : copy.invalidCode);
    } finally { setBusy(false); }
  }

  const link = verified?.referralCode && typeof window !== "undefined" ? referralLink(window.location.origin, verified.referralCode) : "";
  const availablePercent = (verified?.balanceUnits || 0) * 5;
  const maxUsable = Math.min(15, availablePercent);
  const pendingPercent = (verified?.pendingReferrals || 0) * 5;

  function copyValue(value: string, kind: "code" | "link") {
    navigator.clipboard?.writeText(value).then(() => { setCopied(kind); setTimeout(() => setCopied(null), 2000); });
  }

  function shareWhatsapp() {
    trackEvent("referral_shared", { channel: "whatsapp" });
    window.open(`https://wa.me/?text=${encodeURIComponent(`${copy.whatsappMessage} ${link}`)}`, "_blank", "noopener,noreferrer");
  }

  function prepareForCheckout() {
    if (!verified || !verified.redemptionToken) return;
    try {
      window.sessionStorage.setItem("drs_referral_redemption", JSON.stringify({
        units: Math.min(3, verified.balanceUnits),
        token: verified.redemptionToken,
      }));
    } catch { /* sessionStorage may be unavailable; checkout still works without auto-apply */ }
    trackEvent("referral_reward_redeemed", { percent: maxUsable });
    window.location.href = "/booking";
  }

  return <section dir={locale === "ar" ? "rtl" : "ltr"} className="mx-auto max-w-2xl px-4 py-10">
    <div className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-center gap-2 text-ocean-dark"><Gift size={22}/><h1 className="text-2xl font-black">{copy.heading}</h1></div>
      <p className="mt-2 text-sm leading-6 text-muted">{copy.tagline}</p>

      {!verified ? <div className="mt-6 space-y-4">
        <p className="text-sm text-muted">{copy.verifyIntro}</p>
        <label className="block text-sm font-bold text-ink">{copy.emailOrPhoneLabel}
          <input type="text" value={email || phone} onChange={(event) => { const value = event.target.value; if (value.includes("@")) { setEmail(value); setPhone(""); } else { setPhone(value); setEmail(""); } }} className="mt-2 w-full rounded-xl border border-line px-3 py-3"/>
        </label>
        {!codeSent ? (
          <button type="button" disabled={busy || (!email && !phone)} onClick={() => void requestCode()} className="rounded-lg bg-ocean-dark px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{copy.sendCode}</button>
        ) : <>
          <p role="status" className="text-xs text-muted">{copy.codeSentNotice}</p>
          <label className="block text-sm font-bold text-ink">{copy.enterCodeLabel}
            <input dir="ltr" inputMode="numeric" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} className="mt-2 w-40 rounded-xl border border-line px-3 py-3 text-center tracking-widest"/>
          </label>
          <button type="button" disabled={busy || otp.length !== 6} onClick={() => void confirmCode()} className="rounded-lg bg-ocean-dark px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{copy.verify}</button>
        </>}
        {error ? <p role="alert" className="text-sm text-rose-700">{error}</p> : null}
      </div> : <div className="mt-6 space-y-5">
        {verified.referralCode ? <>
          <div className="rounded-2xl bg-ocean-tint p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-ocean-dark">{copy.yourCode}</p>
            <p dir="ltr" className="mt-1 text-2xl font-black text-ink">{verified.referralCode}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => copyValue(verified.referralCode!, "code")} className="flex items-center gap-1 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold">{copied === "code" ? <Check size={16}/> : <Copy size={16}/>} {copied === "code" ? copy.copied : copy.copyCode}</button>
              <button type="button" onClick={() => copyValue(link, "link")} className="flex items-center gap-1 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold">{copied === "link" ? <Check size={16}/> : <Copy size={16}/>} {copied === "link" ? copy.copied : copy.copyLink}</button>
              <button type="button" onClick={shareWhatsapp} className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white"><MessageCircle size={16}/> {copy.shareWhatsapp}</button>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-line p-3"><dt className="text-muted">{copy.available}</dt><dd className="text-xl font-black text-ink">{availablePercent}%</dd></div>
            <div className="rounded-xl border border-line p-3"><dt className="text-muted">{copy.maxPerBooking}</dt><dd className="text-xl font-black text-ink">{maxUsable}%</dd></div>
            <div className="rounded-xl border border-line p-3"><dt className="text-muted">{copy.pending}</dt><dd className="text-xl font-black text-ink">{pendingPercent}%</dd></div>
            <div className="rounded-xl border border-line p-3"><dt className="text-muted">{copy.qualified}</dt><dd className="text-xl font-black text-ink">{verified.qualifiedReferrals}</dd></div>
          </dl>
          {maxUsable > 0 ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-bold text-emerald-900">{copy.applyPrompt(maxUsable)}</p>
            <button type="button" disabled={!verified.redemptionToken} onClick={prepareForCheckout} className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{copy.applyButton}</button>
          </div> : <p className="text-sm text-muted">{copy.noRewardsYet}</p>}
        </> : null}
      </div>}
    </div>
  </section>;
}
