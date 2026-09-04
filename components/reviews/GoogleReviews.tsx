"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Flag, Star } from "lucide-react";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";
import { googleMapsUrl, googleReviewUrl } from "@/lib/contact";
import type { GoogleReviewsPayload } from "@/lib/google-reviews";

export default function GoogleReviews({ className = "" }: { className?: string }) {
  const { language } = useSiteSettings();
  const [data, setData] = useState<GoogleReviewsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const translations: Record<string, { eyebrow: string; title: string; loading: string; read: string; write: string; view: string; report: string; ordered: string; policy: string }> = {
    en: { eyebrow: "Google reviews", title: "What our guests say", loading: "Loading current Google reviews…", read: "Read all on Google", write: "Write a review", view: "View on Google", report: "Report review", ordered: "Reviews are selected and ordered by Google relevance.", policy: "Google checks for and removes fake content when it is identified, but does not verify every review." },
    de: { eyebrow: "Google-Bewertungen", title: "Das sagen unsere Gäste", loading: "Aktuelle Google-Bewertungen werden geladen…", read: "Alle bei Google lesen", write: "Bewertung schreiben", view: "Bei Google ansehen", report: "Bewertung melden", ordered: "Bewertungen werden nach Google-Relevanz ausgewählt und sortiert.", policy: "Google prüft und entfernt erkannte gefälschte Inhalte, verifiziert jedoch nicht jede Bewertung." },
    ru: { eyebrow: "Отзывы Google", title: "Что говорят наши гости", loading: "Загружаем актуальные отзывы Google…", read: "Все отзывы в Google", write: "Оставить отзыв", view: "Открыть в Google", report: "Пожаловаться", ordered: "Отзывы отобраны и упорядочены Google по релевантности.", policy: "Google проверяет и удаляет выявленный поддельный контент, но не подтверждает каждый отзыв." },
    ar: { eyebrow: "تقييمات Google", title: "ماذا يقول ضيوفنا", loading: "جارٍ تحميل أحدث تقييمات Google…", read: "قراءة الكل على Google", write: "اكتب تقييماً", view: "عرض على Google", report: "الإبلاغ عن التقييم", ordered: "يختار Google التقييمات ويرتبها حسب مدى الصلة.", policy: "يفحص Google المحتوى الزائف ويزيله عند اكتشافه، لكنه لا يتحقق من كل تقييم." },
    zh: { eyebrow: "Google 评价", title: "客人怎么说", loading: "正在加载最新 Google 评价…", read: "在 Google 查看全部", write: "撰写评价", view: "在 Google 查看", report: "举报评价", ordered: "评价由 Google 按相关性选择和排序。", policy: "Google 会检查并删除识别出的虚假内容，但不会核实每一条评价。" },
  };
  const copy = translations[language] || null;
  const labels = copy || { eyebrow: "Google reviews", title: "What our guests say", loading: "Loading current Google reviews…", read: "Read all on Google", write: "Write a review", view: "View on Google", report: "Report review", ordered: "Reviews are selected and ordered by Google relevance.", policy: "Google checks for and removes fake content when it is identified, but does not verify every review." };

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/google-reviews?language=${encodeURIComponent(language)}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Reviews unavailable");
        return response.json() as Promise<GoogleReviewsPayload>;
      })
      .then((payload) => setData(payload))
      .catch((error: unknown) => { if ((error as { name?: string }).name !== "AbortError") setFailed(true); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [language]);

  return <section className={`rounded-[2rem] border border-ocean-tint bg-white p-7 shadow-sm sm:p-10 ${className}`}>
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div><p className="font-bold uppercase tracking-[0.24em] text-ocean">{labels.eyebrow}</p><h2 className="mt-3 text-3xl font-black text-ink sm:text-4xl">{labels.title}</h2></div>
      {data ? <a href={data.placeUri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-2xl border border-line px-5 py-3 font-black text-ink hover:bg-surface-muted"><span className="text-2xl text-amber-500">★</span><span>{data.rating.toFixed(1)} <small className="block font-medium text-muted">{data.reviewCount.toLocaleString()} reviews</small></span></a> : null}
    </div>

    {loading ? <div className="mt-8" role="status" aria-live="polite"><p className="text-sm font-semibold text-muted">{labels.loading}</p><div className="mt-4 grid gap-4 md:grid-cols-3" aria-hidden="true">{[0,1,2].map((item) => <div key={item} className="h-52 animate-pulse rounded-2xl bg-surface-muted" />)}</div></div> : null}
    {!loading && data?.reviews.length ? <div className="mt-8 grid gap-5 lg:grid-cols-3">{data.reviews.slice(0, 3).map((review, index) => <article key={`${review.authorName}-${index}`} className="flex min-h-64 flex-col rounded-2xl border border-line bg-surface-muted p-5">
      <div className="flex items-center justify-between gap-3"><a href={review.authorUri || data.placeUri} target="_blank" rel="noopener noreferrer" className="font-black text-ink hover:text-ocean-dark">{review.authorName}</a><div className="flex" aria-label={`${review.rating} out of 5 stars`}>{Array.from({ length: 5 }, (_, star) => <Star key={star} size={15} className={star < review.rating ? "fill-amber-400 text-amber-400" : "text-line"}/>)}</div></div>
      <p className="mt-4 line-clamp-6 flex-1 text-sm leading-6 text-ink">{review.text}</p>
      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4 text-xs"><span className="text-muted">{review.relativeTime}</span>{review.reviewUri ? <a href={review.reviewUri} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-ocean-dark">{labels.view}<ExternalLink size={12}/></a> : null}{review.reportUri ? <a href={review.reportUri} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-muted"><Flag size={11}/>{labels.report}</a> : null}</div>
    </article>)}</div> : null}

    {!loading && (failed || !data?.reviews.length) ? <div className="mt-8 rounded-2xl bg-ocean-tint p-6 text-ink">Google review content is available on our official Google profile.</div> : null}
    <div className="mt-8 flex flex-wrap items-center justify-between gap-5 border-t border-surface-muted pt-6">
      <p className="max-w-2xl text-xs leading-5 text-muted"><strong className="text-ink">Google Maps</strong> · {labels.ordered} {labels.policy}</p>
      <div className="flex flex-wrap gap-3"><a href={data?.placeUri || googleMapsUrl} target="_blank" rel="noopener noreferrer" className="rounded-full bg-ocean-dark px-5 py-2.5 text-sm font-black text-white hover:brightness-90">{labels.read}</a><a href={googleReviewUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border border-ocean-soft px-5 py-2.5 text-sm font-black text-ocean-dark hover:bg-ocean-tint">{labels.write}</a></div>
    </div>
  </section>;
}
