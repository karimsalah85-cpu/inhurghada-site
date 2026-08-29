"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";

const copy = {
  en: { reference: "Booking reference", email: "Email used for the booking", emailPlaceholder: "you@example.com", rating: "Your rating", ratingGroup: "Rating out of 5", review: "Your review", reviewPlaceholder: "Tell other travelers about your trip...", saveError: "We could not save your review.", retryError: "We could not save your review. Please try again.", submitting: "Submitting…", submit: "Submit review", note: "Reviews can only be submitted for a completed booking and are checked by our team before they appear publicly.", doneTitle: "Thank you for your review!", doneBody: "Your review has been submitted and will appear on the trip page once our team approves it." },
  de: { reference: "Buchungsnummer", email: "E-Mail-Adresse der Buchung", emailPlaceholder: "du@beispiel.de", rating: "Deine Bewertung", ratingGroup: "Bewertung von 5", review: "Deine Bewertung", reviewPlaceholder: "Erzähle anderen Reisenden von deinem Ausflug...", saveError: "Wir konnten deine Bewertung nicht speichern.", retryError: "Wir konnten deine Bewertung nicht speichern. Bitte versuche es erneut.", submitting: "Wird gesendet…", submit: "Bewertung senden", note: "Bewertungen sind nur für abgeschlossene Buchungen möglich und werden von unserem Team geprüft, bevor sie öffentlich erscheinen.", doneTitle: "Danke für deine Bewertung!", doneBody: "Deine Bewertung wurde gesendet und erscheint auf der Ausflugsseite, sobald unser Team sie freigegeben hat." },
  ru: { reference: "Номер бронирования", email: "Email, использованный при бронировании", emailPlaceholder: "you@example.com", rating: "Ваша оценка", ratingGroup: "Оценка из 5", review: "Ваш отзыв", reviewPlaceholder: "Расскажите другим путешественникам о поездке...", saveError: "Не удалось сохранить отзыв.", retryError: "Не удалось сохранить отзыв. Пожалуйста, попробуйте ещё раз.", submitting: "Отправка…", submit: "Отправить отзыв", note: "Отзыв можно оставить только по завершённому бронированию; он проверяется нашей командой перед публикацией.", doneTitle: "Спасибо за ваш отзыв!", doneBody: "Отзыв отправлен и появится на странице поездки после проверки нашей командой." },
  ar: { reference: "رقم الحجز", email: "البريد الإلكتروني المستخدم في الحجز", emailPlaceholder: "you@example.com", rating: "تقييمك", ratingGroup: "التقييم من 5", review: "مراجعتك", reviewPlaceholder: "أخبر المسافرين الآخرين عن رحلتك...", saveError: "تعذّر حفظ تقييمك.", retryError: "تعذّر حفظ تقييمك. يرجى المحاولة مرة أخرى.", submitting: "جارٍ الإرسال…", submit: "إرسال التقييم", note: "لا يمكن إرسال التقييم إلا لحجز مكتمل، ويقوم فريقنا بمراجعته قبل ظهوره للعامة.", doneTitle: "شكراً على تقييمك!", doneBody: "تم إرسال تقييمك وسيظهر على صفحة الرحلة بعد موافقة فريقنا." },
  pl: { reference: "Numer rezerwacji", email: "E-mail użyty przy rezerwacji", emailPlaceholder: "ty@przyklad.pl", rating: "Twoja ocena", ratingGroup: "Ocena w skali 5", review: "Twoja opinia", reviewPlaceholder: "Opowiedz innym podróżnym o swojej wycieczce...", saveError: "Nie udało się zapisać Twojej opinii.", retryError: "Nie udało się zapisać Twojej opinii. Spróbuj ponownie.", submitting: "Wysyłanie…", submit: "Wyślij opinię", note: "Opinię można dodać tylko do zakończonej rezerwacji; jest sprawdzana przez nasz zespół przed publikacją.", doneTitle: "Dziękujemy za opinię!", doneBody: "Twoja opinia została wysłana i pojawi się na stronie wycieczki po zatwierdzeniu przez nasz zespół." },
  zh: { reference: "预订编号", email: "预订时使用的邮箱", emailPlaceholder: "you@example.com", rating: "您的评分", ratingGroup: "满分 5 分", review: "您的评价", reviewPlaceholder: "向其他旅客分享您的行程体验……", saveError: "无法保存您的评价。", retryError: "无法保存您的评价，请重试。", submitting: "提交中……", submit: "提交评价", note: "只有已完成的预订才能提交评价，评价会经我们团队审核后公开显示。", doneTitle: "感谢您的评价！", doneBody: "您的评价已提交，经我们团队审核通过后会显示在行程页面。" },
};

export default function TripReviewForm({ initialReference = "", initialEmail = "", locale }: { initialReference?: string; initialEmail?: string; locale?: string }) {
  const { language } = useSiteSettings();
  const t = copy[(locale as keyof typeof copy) || language] ?? copy.en;
  const [reference, setReference] = useState(initialReference);
  const [email, setEmail] = useState(initialEmail);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("submitting");
    setError("");
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, email, rating, body }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || t.saveError);
        setStatus("error");
        return;
      }
      setStatus("done");
    } catch {
      setError(t.retryError);
      setStatus("error");
    }
  }

  if (status === "done") {
    return <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
      <p className="font-black">{t.doneTitle}</p>
      <p className="mt-2 text-sm leading-6">{t.doneBody}</p>
    </div>;
  }

  return <form onSubmit={handleSubmit} className="space-y-4">
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block text-sm font-bold text-slate-700">{t.reference}
        <input required value={reference} onChange={(event) => setReference(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950" placeholder="DRS-20260801-ABC123" />
      </label>
      <label className="block text-sm font-bold text-slate-700">{t.email}
        <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950" placeholder={t.emailPlaceholder} />
      </label>
    </div>
    <div>
      <p className="text-sm font-bold text-slate-700">{t.rating}</p>
      <div className="mt-1 flex gap-1" role="radiogroup" aria-label={t.ratingGroup}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button key={value} type="button" onClick={() => setRating(value)} aria-pressed={rating >= value} aria-label={`${value} / 5`}>
            <Star size={28} className={value <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
          </button>
        ))}
      </div>
    </div>
    <label className="block text-sm font-bold text-slate-700">{t.review}
      <textarea required minLength={1} maxLength={2000} rows={5} value={body} onChange={(event) => setBody(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950" placeholder={t.reviewPlaceholder} />
    </label>
    {error ? <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-800">{error}</p> : null}
    <button type="submit" disabled={status === "submitting"} className="w-full rounded-2xl bg-blue-700 px-6 py-4 text-lg font-black text-white hover:bg-blue-800 disabled:opacity-60">
      {status === "submitting" ? t.submitting : t.submit}
    </button>
    <p className="text-xs leading-5 text-slate-500">{t.note}</p>
  </form>;
}
