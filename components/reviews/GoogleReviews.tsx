"use client";

import { ExternalLink, Star } from "lucide-react";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";
import { googleMapsUrl, googleReviewUrl } from "@/lib/contact";
import { featuredGoogleReviews } from "@/data/featured-google-reviews";

export default function GoogleReviews({ className = "" }: { className?: string }) {
  const { language } = useSiteSettings();
  const translations = {
    en: { eyebrow: "Google reviews", title: "What our guests say", read: "Read all on Google", write: "Write a review", view: "View on Google", note: "Selected review excerpts, maintained by Daily Red Sea. Visit Google for all reviews and the current rating.", empty: "Discover our guests’ experiences on Google and share your own after your trip." },
    de: { eyebrow: "Google-Bewertungen", title: "Das sagen unsere Gäste", read: "Alle bei Google lesen", write: "Bewertung schreiben", view: "Bei Google ansehen", note: "Ausgewählte Bewertungsauszüge, gepflegt von Daily Red Sea. Alle Bewertungen und die aktuelle Bewertung finden Sie bei Google.", empty: "Entdecken Sie die Erfahrungen unserer Gäste bei Google und teilen Sie nach Ihrer Reise Ihre eigenen." },
    ru: { eyebrow: "Отзывы Google", title: "Что говорят наши гости", read: "Все отзывы в Google", write: "Оставить отзыв", view: "Открыть в Google", note: "Избранные отрывки отзывов, обновляемые Daily Red Sea. Все отзывы и актуальный рейтинг доступны в Google.", empty: "Читайте впечатления наших гостей в Google и поделитесь своими после поездки." },
    ar: { eyebrow: "تقييمات Google", title: "ماذا يقول ضيوفنا", read: "قراءة الكل على Google", write: "اكتب تقييماً", view: "عرض على Google", note: "مقتطفات مختارة من التقييمات يُحدّثها فريق Daily Red Sea. جميع التقييمات والتقييم الحالي متاحة على Google.", empty: "اكتشف تجارب ضيوفنا على Google وشارك تجربتك بعد رحلتك." },
    pl: { eyebrow: "Opinie Google", title: "Co mówią nasi goście", read: "Wszystkie opinie w Google", write: "Napisz opinię", view: "Zobacz w Google", note: "Wybrane fragmenty opinii, aktualizowane przez Daily Red Sea. Wszystkie opinie i aktualna ocena są dostępne w Google.", empty: "Poznaj doświadczenia naszych gości w Google i podziel się swoimi po wycieczce." },
    zh: { eyebrow: "Google 评价", title: "客人怎么说", read: "在 Google 查看全部", write: "撰写评价", view: "在 Google 查看", note: "由 Daily Red Sea 手动维护的精选评价摘录。请前往 Google 查看所有评价和当前评分。", empty: "在 Google 上了解客人的体验，并在旅行后分享您自己的感受。" },
  };
  const labels = translations[language as keyof typeof translations] || translations.en;
  const translationCredit = { en: "Translated by Google", de: "Von Google übersetzt", ru: "Переведено Google", ar: "ترجمة Google", pl: "Przetłumaczone przez Google", zh: "由 Google 翻译" };
  const translatedLabel = translationCredit[language as keyof typeof translationCredit] || translationCredit.en;

  return <section className={`rounded-[2rem] border border-ocean-tint bg-white p-7 shadow-sm sm:p-10 ${className}`}>
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div><p className="font-bold uppercase tracking-[0.24em] text-ocean-dark">{labels.eyebrow}</p><h2 className="mt-3 text-3xl font-black text-ink sm:text-4xl">{labels.title}</h2></div>
    </div>

    {featuredGoogleReviews.length ? <div className="mt-8 grid gap-5 lg:grid-cols-3">{featuredGoogleReviews.map((review) => <article key={review.id} className="flex min-w-0 flex-col rounded-2xl border border-line bg-surface-muted p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><p dir="auto" className="min-w-0 break-words font-black text-ink">{review.authorName}</p><div className="flex shrink-0" role="img" aria-label={`${review.rating} / 5`}>{Array.from({ length: 5 }, (_, star) => <Star key={star} size={15} className={star < review.rating ? "fill-amber-400 text-amber-400" : "text-line"}/>)}</div></div>
      <blockquote lang={review.language} dir="auto" className="mt-4 flex-1 break-words text-sm leading-6 text-ink">“{review.excerpt}”</blockquote>
      {review.translatedByGoogle ? <p className="mt-3 text-xs text-muted">{translatedLabel}</p> : null}
      <a href={review.reviewUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-1 border-t border-line pt-4 text-xs font-bold text-ocean-dark">{labels.view}<ExternalLink size={12}/></a>
    </article>)}</div> : <p className="mt-6 text-sm leading-6 text-muted">{labels.empty}</p>}

    <div className="mt-8 flex flex-wrap items-center justify-between gap-5 border-t border-surface-muted pt-6">
      <p className="max-w-2xl text-xs leading-5 text-muted"><strong className="text-ink">Google Maps</strong> · {labels.note}</p>
      <div className="flex flex-wrap gap-3"><a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="rounded-full bg-ocean-dark px-5 py-2.5 text-sm font-black text-white hover:brightness-90">{labels.read}</a><a href={googleReviewUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border border-ocean-soft px-5 py-2.5 text-sm font-black text-ocean-dark hover:bg-ocean-tint">{labels.write}</a></div>
    </div>
  </section>;
}
