"use client";

import Link from "next/link";
import type { Tour } from "@/data/tours";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";
import { useTripReviews } from "@/components/tours/TripReviewsContext";
import { BadgeCheck, CalendarDays, Clock3, Compass, Sparkles, Star, Ticket, TriangleAlert } from "lucide-react";
import TourItinerary from "@/components/tours/TourItinerary";
import { speedboatTerms } from "@/data/speedboat-booking";

export default function TourDetails({ tour }: { tour: Tour }) {
  const { formatPrice, language } = useSiteSettings();
  const de = language === "de";
  const ru = language === "ru";
  const ar = language === "ar";
  const pl = language === "pl";
  const zh = language === "zh";
  const liveReviews = useTripReviews();
  const hasLiveReviews = liveReviews.count > 0;
  const staticReviewCount = Number(tour.reviews);
  const hasReviews = hasLiveReviews || (Number.isFinite(staticReviewCount) && staticReviewCount > 0);
  const displayRating = hasLiveReviews ? liveReviews.average : tour.rating;
  const polish: Record<string, string> = { "Description": "Opis", "About this tour": "O wycieczce", "Duration": "Czas trwania", "Rating": "Ocena", "Price": "Cena", "per person": "za osobę", "Highlights": "Najważniejsze atrakcje", "Included": "W cenie", "Not included": "Poza ceną", "Know before you go": "Warto wiedzieć", "Select your package": "Wybierz pakiet", "Quotation": "Wycena", "Request price": "Zapytaj o cenę", "Price on request": "Cena na zapytanie", "Guest reviews": "Opinie gości", "What guests say about this trip": "Co goście mówią o tej wycieczce", "Leave a review": "Dodaj opinię", "No guest reviews for this trip yet. Booked this trip? Be the first to share your experience.": "Brak opinii gości o tej wycieczce. Masz rezerwację? Podziel się wrażeniami jako pierwszy." };
  const tr = (en: string, deText: string, ruText: string, arText: string, zhText = en) => de ? deText : ru ? ruText : ar ? arText : pl ? polish[en] || en : zh ? zhText : en;
  const displayPrice = (value: string) => formatPrice(value, tour.currency);

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">{tr("Description","Beschreibung","Описание","الوصف","项目介绍")}</p>
        <h2 className="mt-4 text-3xl font-bold text-slate-900">{tr("About this tour","Über diesen Ausflug","Об этой экскурсии","عن هذه الرحلة","关于此行程")}</h2>
        <p className="mt-6 text-lg leading-8 text-slate-600">{tour.description}</p>
        <div className={`mt-8 grid gap-4 ${hasReviews ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-cyan-700"><Clock3 size={16} /> {tr("Duration","Dauer","Продолжительность","المدة","时长")}</div>
            <p className="mt-3 text-xl font-semibold text-slate-900">{tour.duration}</p>
          </div>
          {hasReviews ? <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-cyan-700"><Sparkles size={16} /> {tr("Rating","Bewertung","Рейтинг","التقييم","评分")}</div>
            <p className="mt-3 text-xl font-semibold text-slate-900">{displayRating} / 5</p>
          </div> : null}
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-cyan-700"><Ticket size={16} /> {tr("Price","Preis","Цена","السعر","价格")}</div>
            <p className="mt-3 text-xl font-semibold text-slate-900">{tour.bookingMode === "inquiry" ? tr("Price on request", "Preis auf Anfrage", "Цена по запросу", "السعر عند الطلب", "价格需咨询") : <>{tour.originalPrice && Number(tour.originalPrice) > Number(tour.price) ? <span className="mr-2 text-base text-slate-400 line-through">{displayPrice(tour.originalPrice)}</span> : null}{displayPrice(tour.price)} {tour.priceUnit ?? tr("per person","pro Person","за человека","للشخص","每人")}</>}</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">{tr("Highlights","Höhepunkte","Основные моменты","أهم المميزات","行程亮点")}</p>
        <ul className="mt-6 space-y-4">
          {tour.highlights.map((item) => (
            <li key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <BadgeCheck className="mt-0.5 shrink-0 text-cyan-700" size={18} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">{tr("Included","Inklusive","Включено","يشمل","费用包含")}</p>
          <ul className="mt-6 space-y-4">
            {(tour.included ?? []).map((item) => (
              <li key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <BadgeCheck className="mt-0.5 shrink-0 text-cyan-700" size={18} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">{tr("Not included","Nicht inklusive","Не включено","لا يشمل","费用不含")}</p>
          <ul className="mt-6 space-y-4">
            {(tour.notIncluded ?? []).map((item) => (
              <li key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <BadgeCheck className="mt-0.5 shrink-0 text-cyan-700" size={18} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">{tr("Know before you go","Wichtige Informationen","Важная информация","معلومات مهمة","出行须知")}</p>
          <ul className="mt-6 space-y-4">
            {(tour.notes ?? []).map((item) => (
              <li key={item} className="flex min-w-0 items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <CalendarDays className="mt-0.5 shrink-0 text-cyan-700" size={18} />
                <span className="min-w-0 wrap-anywhere">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">{tr("Select your package","Paket auswählen","Выберите пакет","اختر الباقة","选择套餐")}</p>
          <div className="mt-6 space-y-4">
            {[{ name: tour.packageName ?? tour.title, description: tour.packageDescription ?? tour.description, price: tour.packagePrice ?? tour.price, label: tour.packageLabel }, ...(tour.additionalPackages ?? [])].map((pkg) => (
              <div key={pkg.name} className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 basis-40">
                    <h3 className="text-xl font-bold text-slate-900">{pkg.name}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{pkg.description}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="whitespace-nowrap text-sm text-slate-500">{tour.bookingMode === "inquiry" ? tr("Quotation", "Angebot", "Предложение", "عرض سعر", "报价") : tr("Starting from", "Ab", "От", "ابتداءً من", "起价")}</p>
                    <p className="whitespace-nowrap text-2xl font-bold text-cyan-700">{tour.bookingMode === "inquiry" ? tr("Request price", "Preis anfragen", "Узнать цену", "اطلب السعر", "咨询价格") : formatPrice(pkg.price, tour.currency)}</p>
                  </div>
                </div>
                <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-cyan-700">
                  <Compass size={16} /> {pkg.label ?? tr("Adult", "Erwachsener", "Взрослый", "بالغ", "成人")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {tour.itinerary ? <TourItinerary items={tour.itinerary} /> : null}

      {tour.showSpeedboatTerms ? <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"><p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">Terms &amp; Conditions</p><ul className="mt-6 space-y-3">{speedboatTerms.map((item) => <li key={item} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700"><BadgeCheck className="mt-0.5 shrink-0 text-cyan-700" size={18}/><span>{item}</span></li>)}</ul></section> : null}

      {tour.notSuitableFor?.length || tour.whatToBring?.length ? <div className="grid gap-8 lg:grid-cols-2"><div className="rounded-3xl border border-rose-200 bg-rose-50 p-8"><p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-rose-700"><TriangleAlert size={18}/>{tr("Not suitable for", "Nicht geeignet für", "Не подходит для", "غير مناسب لـ", "不适合")}</p><ul className="mt-5 space-y-3">{tour.notSuitableFor?.map((item)=><li key={item} className="rounded-xl bg-white p-4 text-sm text-slate-700">{item}</li>)}</ul></div><div className="rounded-3xl border border-amber-200 bg-amber-50 p-8"><p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-800">{tr("What to bring", "Mitzubringen", "Что взять с собой", "ماذا تحضر", "携带物品")}</p><ul className="mt-5 grid gap-3 sm:grid-cols-2">{tour.whatToBring?.map((item)=><li key={item} className="rounded-xl bg-white p-4 text-sm text-slate-700">{item}</li>)}</ul></div></div> : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">{tr("Guest reviews", "Gästebewertungen", "Отзывы гостей", "تقييمات الضيوف", "住客评价")}</p>
            <h2 className="mt-4 text-3xl font-bold text-slate-900">{tr("What guests say about this trip", "Was Gäste über diesen Ausflug sagen", "Что гости говорят об этой поездке", "ماذا يقول الضيوف عن هذه الرحلة", "住客对此行程的评价")}</h2>
          </div>
          <Link href={`/reviews?lang=${language}`} className="rounded-full border border-cyan-200 px-5 py-2.5 text-sm font-black text-cyan-800 hover:bg-cyan-50">{tr("Leave a review", "Bewertung abgeben", "Оставить отзыв", "أضف تقييمًا", "撰写评价")}</Link>
        </div>
        {hasLiveReviews ? <div className="mt-8 grid gap-5 lg:grid-cols-3">{liveReviews.reviews.slice(0, 6).map((review, index) => <article key={`${review.customer_name}-${index}`} className="flex min-h-52 flex-col rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center justify-between gap-3"><span className="font-black text-slate-950">{review.customer_name}</span><div className="flex" aria-label={`${review.rating} out of 5 stars`}>{Array.from({ length: 5 }, (_, star) => <Star key={star} size={15} className={star < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}/>)}</div></div>
          <p className="mt-4 line-clamp-6 flex-1 text-sm leading-6 text-slate-700">{review.body}</p>
        </article>)}</div> : <p className="mt-6 text-sm leading-6 text-slate-500">{tr("No guest reviews for this trip yet. Booked this trip? Be the first to share your experience.", "Für diesen Ausflug gibt es noch keine Gästebewertungen. Schon gebucht? Teile als Erster deine Erfahrung.", "Для этой поездки пока нет отзывов. Уже бронировали? Поделитесь впечатлениями первыми.", "لا توجد تقييمات لهذه الرحلة حتى الآن. هل حجزتها؟ كن أول من يشارك تجربته.", "此行程暂无住客评价。已预订？欢迎第一个分享您的体验。")}</p>}
      </section>
    </div>
  );
}
