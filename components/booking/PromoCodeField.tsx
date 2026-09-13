"use client";
import { useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
const labels = {
  en: ["Promo code", "Apply", "Remove", "Discount", "Applying…", "Apply the code or remove it before confirming.", "Complete your booking details, then apply your code."],
  ar: ["رمز الخصم", "تطبيق", "إزالة", "الخصم", "جارٍ التطبيق…", "طبّق الرمز أو أزله قبل تأكيد الحجز.", "أكمل بيانات الحجز ثم طبّق رمز الخصم."],
  de: ["Gutscheincode", "Anwenden", "Entfernen", "Rabatt", "Wird geprüft…", "Code vor der Bestätigung anwenden oder entfernen.", "Buchungsdaten ausfüllen und dann den Code anwenden."],
  ru: ["Промокод", "Применить", "Удалить", "Скидка", "Проверка…", "Примените или удалите код перед подтверждением.", "Заполните данные бронирования и примените код."],
  pl: ["Kod promocyjny", "Zastosuj", "Usuń", "Rabat", "Sprawdzanie…", "Zastosuj lub usuń kod przed potwierdzeniem.", "Uzupełnij dane rezerwacji, a następnie zastosuj kod."],
  zh: ["优惠码", "应用", "移除", "优惠", "正在验证…", "请在确认前应用或移除优惠码。", "请填写预订信息，然后应用优惠码。"],
};
type Quote = { code: string; subtotal: number; discount: number; total: number; currency: string };
export function usePromoCode(input: Record<string, unknown>, subtotal: number, locale: Locale, getIdempotencyKey: () => string) {
  const [code, setCode] = useState("");
  const [saved, setSaved] = useState<{ key: string; quote: Quote } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const generation = useRef(0);
  const key = JSON.stringify({ ...input, idempotencyKey: undefined });
  const quote = saved?.key === key && saved.quote.code === code.trim().toUpperCase() ? saved.quote : null;
  function change(value: string) { generation.current++; setCode(value); setSaved(null); setError(""); setBusy(false); }
  async function apply() {
    const attempt = ++generation.current;
    setBusy(true); setError(""); setSaved(null);
    try {
      const response = await fetch("/api/promo-codes/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...input, idempotencyKey: getIdempotencyKey(), promoCode: code }) });
      const result = await response.json();
      if (!response.ok || !result.quote) throw new Error(result.error || "Could not apply promo code.");
      if (attempt === generation.current) { setCode(result.quote.code); setSaved({ key, quote: result.quote }); }
    } catch (reason) { if (attempt === generation.current) setError(reason instanceof Error ? reason.message : "Could not apply promo code."); }
    finally { if (attempt === generation.current) setBusy(false); }
  }
  return { code, quote, busy, error, change, apply, total: quote?.total ?? subtotal, needsApply: Boolean(code.trim() && !quote), message: labels[locale][5] };
}
export default function PromoCodeField({ promo, locale, disabled = false }: { promo: ReturnType<typeof usePromoCode>; locale: Locale; disabled?: boolean }) {
  const copy = labels[locale];
  return <div className="rounded-2xl border border-line p-4">
    <label className="block text-sm font-bold text-ink">{copy[0]}<input dir="ltr" value={promo.code} maxLength={32} disabled={disabled || promo.busy} onChange={e => promo.change(e.target.value)} autoComplete="off" className="mt-2 w-full rounded-xl border border-line px-3 py-3 uppercase"/></label>
    <p className="mt-2 text-xs text-muted">{copy[6]}</p>
    <div className="mt-3 flex gap-3"><button type="button" disabled={disabled || promo.busy || !promo.code.trim()} onClick={() => void promo.apply()} className="rounded-lg bg-ocean-dark px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{promo.busy ? copy[4] : copy[1]}</button>{promo.code ? <button type="button" disabled={disabled} onClick={() => promo.change("")} className="rounded-lg border border-line px-4 py-2 text-sm font-semibold">{copy[2]}</button> : null}</div>
    {promo.quote ? <p role="status" className="mt-3 text-sm font-bold text-emerald-700">{copy[3]}: −{promo.quote.discount.toFixed(2)} {promo.quote.currency}</p> : null}
    {promo.needsApply && !promo.busy ? <p className="mt-2 text-xs text-muted">{promo.message}</p> : null}
    {promo.error ? <p role="alert" className="mt-3 text-sm text-rose-700">{promo.error}</p> : null}
  </div>;
}
