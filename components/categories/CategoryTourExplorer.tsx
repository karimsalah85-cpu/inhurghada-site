"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin, Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import type { Tour } from "@/data/tours";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";
import { localePath, type Locale } from "@/lib/i18n";
import ImageWatermark from "@/components/media/ImageWatermark";
import { localizeProductBadge } from "@/lib/public-interface-i18n";

export default function CategoryTourExplorer({ tours, locale = "en" }: { tours: Tour[]; locale?: Locale }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"featured" | "price-low" | "price-high">("featured");
  const { formatPrice } = useSiteSettings();
  const de = locale === "de";
  const ru = locale === "ru";
  const ar = locale === "ar";
  const visibleTours = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const result = tours.filter((tour) =>
      !normalized || [tour.title, tour.description, tour.location, tour.duration, ...(tour.highlights || [])].join(" ").toLowerCase().includes(normalized)
    );
    if (sort === "price-low") return [...result].sort((a, b) => (a.bookingMode === "inquiry" ? 1 : b.bookingMode === "inquiry" ? -1 : Number(a.price) - Number(b.price)));
    if (sort === "price-high") return [...result].sort((a, b) => (a.bookingMode === "inquiry" ? 1 : b.bookingMode === "inquiry" ? -1 : Number(b.price) - Number(a.price)));
    return result;
  }, [query, sort, tours]);

  return (
    <>
      <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto]">
        <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4">
          <Search size={19} className="text-cyan-700" />
          <span className="sr-only">{de ? "Diese Erlebnisse durchsuchen" : ru ? "Поиск экскурсий" : ar ? "ابحث في الرحلات" : "Search these experiences"}</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={de ? "Diese Erlebnisse durchsuchen" : ru ? "Поиск экскурсий" : ar ? "ابحث في الرحلات" : "Search these experiences"} className="min-h-12 w-full bg-transparent outline-none" />
        </label>
        <label>
          <span className="sr-only">{de ? "Ausflüge sortieren" : ru ? "Сортировать экскурсии" : "Sort tours"}</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 font-semibold text-slate-700">
            <option value="featured">{de ? "Empfohlen" : ru ? "Рекомендуемые" : ar ? "المميزة" : "Featured"}</option>
            <option value="price-low">{de ? "Preis: niedrig nach hoch" : ru ? "Цена: по возрастанию" : ar ? "السعر: من الأقل إلى الأعلى" : "Price: low to high"}</option>
            <option value="price-high">{de ? "Preis: hoch nach niedrig" : ru ? "Цена: по убыванию" : ar ? "السعر: من الأعلى إلى الأقل" : "Price: high to low"}</option>
          </select>
        </label>
      </div>

      <p className="mt-6 text-sm font-semibold text-slate-500" aria-live="polite">{visibleTours.length} {de ? (visibleTours.length === 1 ? "Erlebnis" : "Erlebnisse") : ru ? "экскурсий" : (visibleTours.length === 1 ? "experience" : "experiences")}</p>
      <div className="mt-5 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
        {visibleTours.map((tour) => {
          const reviewCount = Number(tour.reviews);
          const hasReviews = Number.isFinite(reviewCount) && reviewCount > 0;
          return (
            <article key={tour.slug} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <Link href={localePath(locale, `/tours/${tour.slug}`)} className="group block">
                <div className="relative h-56 overflow-hidden">
                  <Image src={tour.image} alt={tour.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" />
                  <ImageWatermark />
                  {tour.badge ? <span className="absolute start-4 top-4 rounded-full bg-slate-950/85 px-3 py-2 text-xs font-bold text-white">{localizeProductBadge(locale, tour.badge)}</span> : null}
                </div>
                <div className="p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-700">{tour.category || "Hurghada experience"}</p>
                  <h2 className="mt-2 text-xl font-black text-slate-950">{tour.title}</h2>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{tour.description}</p>
                  <div className="mt-5 grid gap-2 text-sm text-slate-600">
                    <span className="flex items-center gap-2"><Clock size={17} className="text-cyan-700" />{tour.duration}</span>
                    <span className="flex items-center gap-2"><MapPin size={17} className="text-cyan-700" />{tour.location}</span>
                    <span className="flex items-center gap-2"><ShieldCheck size={17} className="text-emerald-600" />{tour.bookingMode === "inquiry" ? "Price and pickup on request" : de ? "Klarer Preis · Abholung bestätigt" : ru ? "Понятная цена · трансфер подтверждается" : "Clear price · pickup confirmed"}</span>
                  </div>
                  <div className="mt-6 flex items-end justify-between gap-4">
                    <div>{tour.bookingMode === "inquiry" ? <><p className="text-xs text-slate-500">Quotation</p><p className="text-xl font-black text-blue-700">Request price</p></> : <><p className="text-xs text-slate-500">{de ? "Ab" : ru ? "От" : "From"}</p>{tour.originalPrice && Number(tour.originalPrice) > Number(tour.price) ? <p className="text-xs font-bold text-slate-400 line-through">{formatPrice(tour.originalPrice)}</p> : null}<p className="text-2xl font-black text-blue-700">{formatPrice(tour.price)}</p><p className="text-xs text-slate-500">{tour.priceUnit || (de ? "pro Person" : ru ? "за человека" : "per person")}</p>{tour.entrancePricing ? <p className="mt-2 text-xs font-bold text-amber-700">+ {de ? "Eintritt ab" : ru ? "вход от" : "entrance from"} {formatPrice(String(tour.entrancePricing.adults))}/{de ? "Person" : ru ? "чел." : "person"}</p> : null}</>}</div>
                    <span className="rounded-full bg-blue-700 px-4 py-3 text-sm font-bold text-white">{tour.bookingMode === "inquiry" ? "View & inquire" : de ? "Ansehen & buchen" : ru ? "Подробнее и бронирование" : "View & book"}</span>
                  </div>
                  {hasReviews ? <p className="mt-4 text-xs font-semibold text-amber-600">★ {tour.rating} · {reviewCount} {de ? "Kundenbewertungen" : ru ? "отзывов гостей" : "customer reviews"}</p> : null}
                </div>
              </Link>
            </article>
          );
        })}
      </div>
      {!visibleTours.length ? <div className="mt-8 rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-600">{de ? "Keine passenden Erlebnisse. Versuche eine andere Suche." : ru ? "Подходящих экскурсий не найдено. Попробуйте другой запрос." : "No matching experiences. Try a different search."}</div> : null}
    </>
  );
}
