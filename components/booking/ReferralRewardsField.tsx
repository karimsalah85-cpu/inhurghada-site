"use client";

import { useState } from "react";
import { type Locale } from "@/lib/i18n";
import { referralCopy, referralProgramCopy, referralRemainingCopy } from "@/lib/referral-i18n";

const messages = {
  en: { check: "Check my verified rewards", verify: "Verify my booking email", unavailable: "Verify your booking email to access rewards, or verify again if your session expired.", apply: "Apply available rewards", pending: "The final eligible discount is confirmed when your reservation is created." },
  ar: { check: "التحقق من مكافآتي الموثقة", verify: "التحقق من بريد الحجز", unavailable: "تحقق من بريد الحجز للوصول إلى المكافآت، أو أعد التحقق إذا انتهت الجلسة.", apply: "استخدام المكافآت المتاحة", pending: "يُؤكد الخصم النهائي المؤهل عند إنشاء الحجز." },
  de: { check: "Meine bestätigten Prämien prüfen", verify: "Buchungs-E-Mail bestätigen", unavailable: "Bestätige deine Buchungs-E-Mail, um Prämien zu sehen, oder bestätige sie erneut, wenn die Sitzung abgelaufen ist.", apply: "Verfügbare Prämien anwenden", pending: "Der endgültige berechtigte Rabatt wird bei Erstellung der Reservierung bestätigt." },
  ru: { check: "Проверить подтверждённые вознаграждения", verify: "Подтвердить email бронирования", unavailable: "Подтвердите email бронирования для доступа к вознаграждениям или повторите подтверждение, если сеанс истёк.", apply: "Использовать доступные вознаграждения", pending: "Окончательная доступная скидка подтверждается при создании бронирования." },
  pl: { check: "Sprawdź moje zweryfikowane nagrody", verify: "Zweryfikuj e-mail rezerwacji", unavailable: "Zweryfikuj e-mail rezerwacji, aby uzyskać dostęp do nagród, lub zweryfikuj ponownie, jeśli sesja wygasła.", apply: "Zastosuj dostępne nagrody", pending: "Ostateczna dostępna zniżka zostanie potwierdzona przy tworzeniu rezerwacji." },
  zh: { check: "查看已验证的奖励", verify: "验证预订邮箱", unavailable: "请验证预订邮箱以查看奖励；如果会话已过期，请重新验证。", apply: "使用可用奖励", pending: "最终适用折扣将在创建预订时确认。" },
} satisfies Record<Locale, Record<string, string>>;

export function verifiedRewardSelection(account: { email: string; token: string; balanceUnits: number } | null, email: string, selected: boolean) {
  if (!selected || !account || account.email !== email.trim().toLowerCase() || !Number.isInteger(account.balanceUnits) || account.balanceUnits < 1) return null;
  return { token: account.token, units: Math.min(3, account.balanceUnits) };
}

export function useReferralRewards(email: string, locale: Locale) {
  const [account, setAccount] = useState<{ email: string; token: string; balanceUnits: number } | null>(null);
  const [selected, setSelected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [codeEmail, setCodeEmail] = useState("");
  const [otp, setOtp] = useState("");
  const normalizedEmail = email.trim().toLowerCase();
  const visibleAccount = account?.email === normalizedEmail ? account : null;
  async function check() {
    setBusy(true); setFailed(false); setAccount(null); setSelected(false);
    try {
      const saved = JSON.parse(window.sessionStorage.getItem("drs_referral_redemption") || "null");
      if (typeof saved?.token !== "string") throw new Error("verification_required");
      const response = await fetch("/api/referral/account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: saved.token, email: normalizedEmail }) });
      const data = await response.json();
      if (!response.ok || !data.verified || !Number.isInteger(data.balanceUnits) || data.balanceUnits < 0) throw new Error("verification_required");
      setAccount({ email: normalizedEmail, token: saved.token, balanceUnits: data.balanceUnits });
    } catch { setFailed(true); } finally { setBusy(false); }
  }
  async function sendCode() {
    setBusy(true); setFailed(false);
    try {
      const response = await fetch("/api/referral/verify/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: normalizedEmail, locale }) });
      if (!response.ok) throw new Error("verification_required");
      setCodeEmail(normalizedEmail); setOtp("");
    } catch { setFailed(true); } finally { setBusy(false); }
  }
  async function confirmCode() {
    setBusy(true); setFailed(false); setAccount(null); setSelected(false);
    try {
      const response = await fetch("/api/referral/verify/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: normalizedEmail, code: otp }) });
      const data = await response.json();
      if (!response.ok || !data.verified || !Number.isInteger(data.balanceUnits) || data.balanceUnits < 0 || (data.balanceUnits > 0 && typeof data.redemptionToken !== "string")) throw new Error("verification_required");
      setAccount({ email: normalizedEmail, token: data.redemptionToken || "", balanceUnits: data.balanceUnits });
      setCodeEmail(""); setOtp("");
    } catch { setFailed(true); } finally { setBusy(false); }
  }
  function reset() { setAccount(null); setSelected(false); }
  return { account: visibleAccount, codeSent: Boolean(codeEmail && codeEmail === normalizedEmail), otp, setOtp, sendCode, confirmCode, canVerify: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail), selected, setSelected, busy, failed, check, reset, redemption: verifiedRewardSelection(visibleAccount, email, selected) };
}

export default function ReferralRewardsField({ rewards, locale, disabled = false }: { rewards: ReturnType<typeof useReferralRewards>; locale: Locale; disabled?: boolean }) {
  const copy = referralCopy[locale];
  const program = referralProgramCopy[locale];
  const message = messages[locale];
  const balance = rewards.account?.balanceUnits || 0;
  const usable = Math.min(3, balance);
  return <div className="rounded-2xl border border-line p-4">
    <p className="text-sm font-bold text-ink">{copy.available}</p>
    <button type="button" disabled={disabled || rewards.busy} onClick={() => void rewards.check()} className="mt-2 min-h-11 rounded-lg border border-line px-3 py-2 text-sm font-semibold disabled:opacity-50">{message.check}</button>
    <button type="button" disabled={disabled || rewards.busy || !rewards.canVerify} onClick={() => void rewards.sendCode()} className="ms-3 inline-flex min-h-11 items-center text-sm font-semibold text-ocean-dark underline disabled:opacity-50">{rewards.codeSent ? program.resend : message.verify}</button>
    {rewards.codeSent ? <div className="mt-3">
      <p role="status" className="text-xs text-muted">{program.codeSentNotice}</p>
      <label className="mt-2 block text-sm font-semibold">{copy.enterCodeLabel}<input dir="ltr" autoComplete="one-time-code" inputMode="numeric" maxLength={6} value={rewards.otp} disabled={disabled || rewards.busy} onChange={(event) => rewards.setOtp(event.target.value.replace(/\D/g, ""))} className="ms-2 w-28 rounded-lg border border-line px-3 py-2 tracking-widest"/></label>
      <button type="button" disabled={disabled || rewards.busy || rewards.otp.length !== 6} onClick={() => void rewards.confirmCode()} className="mt-2 min-h-11 rounded-lg border border-line px-3 py-2 text-sm font-semibold disabled:opacity-50">{copy.verify}</button>
    </div> : null}
    {rewards.failed ? <p role="status" className="mt-2 text-sm text-muted">{message.unavailable}</p> : null}
    {rewards.account ? <div className="mt-3 text-sm">
      <p>{copy.available}: <strong>{balance * 5}%</strong>. {copy.maxPerBooking}: <strong>{usable * 5}%</strong>.</p>
      {usable > 0 ? <label className="mt-2 flex min-h-11 cursor-pointer items-center gap-3"><input type="checkbox" checked={rewards.selected} disabled={disabled || rewards.busy} onChange={(event) => rewards.setSelected(event.target.checked)} className="h-5 w-5 accent-ocean-dark"/><span>{message.apply}: {usable * 5}%</span></label> : null}
      {rewards.selected && usable > 0 ? <p className="mt-2 text-muted">{referralRemainingCopy[locale]((balance - usable) * 5)}</p> : null}
    </div> : null}
    <p className="mt-3 text-xs leading-5 text-muted">{program.stackingPolicy} {message.pending}</p>
  </div>;
}
