"use client";
import { useEffect, useState } from "react";
import { Check, Copy, Gift, MessageCircle } from "lucide-react";
import { localePath, type Locale } from "@/lib/i18n";
import { referralCopy, referralProgramCopy, referralRemainingCopy } from "@/lib/referral-i18n";
import { trackEvent } from "@/lib/analytics";

type VerifiedState = {
  qualified: boolean;
  referralCode: string | null;
  balanceUnits: number;
  qualifiedReferrals: number;
  pendingReferrals: number;
  redemptionToken: string | null;
};

export default function ReferralDashboard({ locale }: { locale: Locale }) {
  const copy = referralCopy[locale];
  const program = referralProgramCopy[locale];
  useEffect(() => { trackEvent("referral_program_viewed", { placement: "dashboard" }); }, []);
  const [email, setEmail] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState<VerifiedState | null>(null);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  async function requestCode() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/referral/verify/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, locale }) });
      if (!response.ok) throw new Error(program.requestError);
      setOtp("");
      setCodeSent(true);
    } catch { setError(program.requestError); } finally { setBusy(false); }
  }

  async function confirmCode() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/referral/verify/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code: otp }) });
      const data = await response.json();
      if (!response.ok || !data.verified) throw new Error(copy.invalidCode);
      setVerified(data);
    } catch {
      setError(copy.invalidCode);
    } finally { setBusy(false); }
  }

  const link = verified?.qualified && verified.referralCode && typeof window !== "undefined"
    ? new URL(`${localePath(locale)}?ref=${encodeURIComponent(verified.referralCode)}`, window.location.origin).toString() : "";
  const availablePercent = (verified?.balanceUnits || 0) * 5;
  const maxUsable = Math.min(15, availablePercent);
  const pendingPercent = (verified?.pendingReferrals || 0) * 5;

  async function copyValue(value: string, kind: "code" | "link") {
    setError("");
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      trackEvent("referral_link_copied", { format: kind });
      setTimeout(() => setCopied(null), 2000);
    } catch { setError(program.copyError); }
  }

  function shareWhatsapp() {
    trackEvent("referral_shared_whatsapp", { placement: "dashboard" });
  }

  function prepareForCheckout() {
    if (!verified || !verified.redemptionToken) return;
    try {
      window.sessionStorage.setItem("drs_referral_redemption", JSON.stringify({
        units: Math.min(3, verified.balanceUnits),
        token: verified.redemptionToken,
        balanceUnits: verified.balanceUnits,
      }));
    } catch { setError(program.requestError); return; }
    window.location.href = localePath(locale, "/tours");
  }

  return <section dir={locale === "ar" ? "rtl" : "ltr"} className="mx-auto max-w-2xl px-4 py-10">
    <div className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-center gap-2 text-ocean-dark"><Gift size={22}/><h1 className="text-2xl font-black">{copy.heading}</h1></div>
      <p className="mt-2 text-sm leading-6 text-muted">{copy.tagline}</p>

      {!verified ? <div className="mt-6 space-y-4">
        <p className="text-sm text-muted">{program.verifyIntro}</p>
        <label className="block text-sm font-bold text-ink">{program.emailLabel}
          <input type="email" autoComplete="email" dir="ltr" value={email} disabled={busy} onChange={(event) => { setEmail(event.target.value); setCodeSent(false); setOtp(""); setError(""); }} className="mt-2 w-full rounded-xl border border-line px-3 py-3"/>
        </label>
        {!codeSent ? (
          <button type="button" disabled={busy || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())} onClick={() => void requestCode()} className="rounded-lg bg-ocean-dark px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{copy.sendCode}</button>
        ) : <>
          <p role="status" className="text-xs text-muted">{program.codeSentNotice}</p>
          <label className="block text-sm font-bold text-ink">{copy.enterCodeLabel}
            <input dir="ltr" autoComplete="one-time-code" inputMode="numeric" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} className="mt-2 w-40 rounded-xl border border-line px-3 py-3 text-center tracking-widest"/>
          </label>
          <button type="button" disabled={busy || otp.length !== 6} onClick={() => void confirmCode()} className="rounded-lg bg-ocean-dark px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{copy.verify}</button>
          <button type="button" disabled={busy} onClick={() => void requestCode()} className="ms-3 rounded-lg border border-line px-4 py-2 text-sm font-bold disabled:opacity-50">{program.resend}</button>
        </>}
      </div> : <div className="mt-6 space-y-5">
        {verified.qualified && verified.referralCode ? <>
          <div className="rounded-2xl bg-ocean-tint p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-ocean-dark">{copy.yourCode}</p>
            <p dir="ltr" className="mt-1 text-2xl font-black text-ink">{verified.referralCode}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => void copyValue(verified.referralCode!, "code")} className="flex min-h-11 items-center gap-1 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold">{copied === "code" ? <Check size={16}/> : <Copy size={16}/>} {copied === "code" ? copy.copied : copy.copyCode}</button>
              <button type="button" onClick={() => void copyValue(link, "link")} className="flex min-h-11 items-center gap-1 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold">{copied === "link" ? <Check size={16}/> : <Copy size={16}/>} {copied === "link" ? copy.copied : copy.copyLink}</button>
              <a href={`https://wa.me/?text=${encodeURIComponent(`${copy.whatsappMessage} ${link}`)}`} target="_blank" rel="noopener noreferrer" onClick={shareWhatsapp} className="flex min-h-11 items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white"><MessageCircle size={16}/> {copy.shareWhatsapp}</a>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-line p-3"><dt className="text-muted">{copy.available}</dt><dd className="text-xl font-black text-ink">{availablePercent}%</dd></div>
            <div className="rounded-xl border border-line p-3"><dt className="text-muted">{copy.maxPerBooking}</dt><dd className="text-xl font-black text-ink">{maxUsable}%</dd></div>
            <div className="rounded-xl border border-line p-3"><dt className="text-muted">{copy.pending}</dt><dd className="text-xl font-black text-ink">{pendingPercent}%</dd></div>
            <div className="rounded-xl border border-line p-3"><dt className="text-muted">{copy.qualified}</dt><dd className="text-xl font-black text-ink">{verified.qualifiedReferrals}</dd></div>
          </dl>
          {maxUsable > 0 ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-bold text-emerald-900">{copy.available}: {availablePercent}%. {copy.maxPerBooking}: {maxUsable}%.</p>
            <p className="mt-2 text-sm text-emerald-900">{referralRemainingCopy[locale](availablePercent - maxUsable)}</p>
            <button type="button" disabled={!verified.redemptionToken} onClick={prepareForCheckout} className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{program.continueBooking}</button>
          </div> : <p className="text-sm text-muted">{copy.noRewardsYet}</p>}
        </> : <p role="status" className="rounded-xl bg-ocean-tint p-4 text-sm font-semibold text-ocean-dark">{program.locked}</p>}
      </div>}
      {error ? <p role="alert" className="mt-4 text-sm text-rose-700">{error}</p> : null}
      <p className="mt-6 text-xs leading-5 text-muted">{program.terms}</p>
      <p className="mt-2 text-xs leading-5 text-muted">{program.stackingPolicy}</p>
    </div>
  </section>;
}
