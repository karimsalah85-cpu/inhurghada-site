"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin, Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import type { Tour } from "@/data/tours";
import type { DestinationSlug } from "@/lib/destinations";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";
import { localePath, type Locale } from "@/lib/i18n";
import ImageWatermark from "@/components/media/ImageWatermark";
import ShareTripButton from "@/components/share/ShareTripButton";
import { localizeProductBadge } from "@/lib/public-interface-i18n";

type PriceBand = "all" | "under-25" | "25-50" | "50-100" | "100-plus";

function matchesPriceBand(tour: Tour, band: PriceBand) {
  if (band === "all") return true;
  if (tour.bookingMode === "inquiry") return false;
  const price = Number(tour.price);
  if (band === "under-25") return price < 25;
  if (band === "25-50") return price >= 25 && price <= 50;
  if (band === "50-100") return price > 50 && price <= 100;
  return price > 100;
}

const explorerCopy: Record<Locale, { search: string; sort: string; featured: string; low: string; high: string; experience: string; experiences: string; assurance: string; inquiryAssurance: string; quotation: string; request: string; from: string; perPerson: string; entrance: string; person: string; inquire: string; book: string; reviews: string; empty: string; locationLabel: string; categoryLabel: string; priceLabel: string; allLocations: string; hurghada: string; marsaAlam: string; jeddah?: string; allCategories: string; allPrices: string; priceUnder25: string; price25to50: string; price50to100: string; price100plus: string; reset: string }> = {
  en: { search: "Search these experiences", sort: "Sort tours", featured: "Featured", low: "Price: low to high", high: "Price: high to low", experience: "experience", experiences: "experiences", assurance: "Clear price · pickup confirmed", inquiryAssurance: "Price and pickup on request", quotation: "Quotation", request: "Request price", from: "From", perPerson: "per person", entrance: "entrance from", person: "person", inquire: "View & inquire", book: "View & book", reviews: "customer reviews", empty: "No matching experiences. Try a different search.", locationLabel: "Filter by location", categoryLabel: "Filter by category", priceLabel: "Filter by price", allLocations: "All locations", hurghada: "Hurghada", marsaAlam: "Marsa Alam", allCategories: "All categories", allPrices: "Any price", priceUnder25: "Under $25", price25to50: "$25 – $50", price50to100: "$50 – $100", price100plus: "$100+", reset: "Reset filters" },
  ar: { search: "ابحث في الرحلات", sort: "ترتيب الرحلات", featured: "المميزة", low: "السعر: من الأقل إلى الأعلى", high: "السعر: من الأعلى إلى الأقل", experience: "تجربة", experiences: "تجارب", assurance: "سعر واضح · تأكيد الاستلام", inquiryAssurance: "السعر والاستلام عند الطلب", quotation: "عرض سعر", request: "اطلب السعر", from: "ابتداءً من", perPerson: "للشخص", entrance: "الدخول من", person: "للشخص", inquire: "عرض واستفسار", book: "عرض وحجز", reviews: "تقييمات العملاء", empty: "لا توجد تجارب مطابقة. جرّب بحثًا آخر.", locationLabel: "التصفية حسب الموقع", categoryLabel: "التصفية حسب الفئة", priceLabel: "التصفية حسب السعر", allLocations: "كل المواقع", hurghada: "الغردقة", marsaAlam: "مرسى علم", allCategories: "كل الفئات", allPrices: "أي سعر", priceUnder25: "أقل من 25$", price25to50: "25$ – 50$", price50to100: "50$ – 100$", price100plus: "أكثر من 100$", reset: "إعادة تعيين الفلاتر" },
  de: { search: "Diese Erlebnisse durchsuchen", sort: "Ausflüge sortieren", featured: "Empfohlen", low: "Preis: niedrig nach hoch", high: "Preis: hoch nach niedrig", experience: "Erlebnis", experiences: "Erlebnisse", assurance: "Klarer Preis · Abholung bestätigt", inquiryAssurance: "Preis und Abholung auf Anfrage", quotation: "Angebot", request: "Preis anfragen", from: "Ab", perPerson: "pro Person", entrance: "Eintritt ab", person: "Person", inquire: "Ansehen & anfragen", book: "Ansehen & buchen", reviews: "Kundenbewertungen", empty: "Keine passenden Erlebnisse. Versuche eine andere Suche.", locationLabel: "Nach Ort filtern", categoryLabel: "Nach Kategorie filtern", priceLabel: "Nach Preis filtern", allLocations: "Alle Orte", hurghada: "Hurghada", marsaAlam: "Marsa Alam", allCategories: "Alle Kategorien", allPrices: "Jeder Preis", priceUnder25: "Unter 25 $", price25to50: "25 $ – 50 $", price50to100: "50 $ – 100 $", price100plus: "Über 100 $", reset: "Filter zurücksetzen" },
  ru: { search: "Поиск экскурсий", sort: "Сортировать экскурсии", featured: "Рекомендуемые", low: "Цена: по возрастанию", high: "Цена: по убыванию", experience: "экскурсия", experiences: "экскурсий", assurance: "Понятная цена · трансфер подтверждается", inquiryAssurance: "Цена и трансфер по запросу", quotation: "Расчёт", request: "Запросить цену", from: "От", perPerson: "за человека", entrance: "вход от", person: "чел.", inquire: "Подробнее и запрос", book: "Подробнее и бронирование", reviews: "отзывов гостей", empty: "Подходящих экскурсий не найдено. Попробуйте другой запрос.", locationLabel: "Фильтр по локации", categoryLabel: "Фильтр по категории", priceLabel: "Фильтр по цене", allLocations: "Все локации", hurghada: "Хургада", marsaAlam: "Марса-Алам", allCategories: "Все категории", allPrices: "Любая цена", priceUnder25: "До $25", price25to50: "$25 – $50", price50to100: "$50 – $100", price100plus: "Свыше $100", reset: "Сбросить фильтры" },
  pl: { search: "Szukaj atrakcji", sort: "Sortuj wycieczki", featured: "Polecane", low: "Cena: rosnąco", high: "Cena: malejąco", experience: "atrakcja", experiences: "atrakcji", assurance: "Jasna cena · potwierdzony odbiór", inquiryAssurance: "Cena i odbiór na zapytanie", quotation: "Wycena", request: "Zapytaj o cenę", from: "Od", perPerson: "za osobę", entrance: "wstęp od", person: "osoba", inquire: "Zobacz i zapytaj", book: "Zobacz i zarezerwuj", reviews: "opinii klientów", empty: "Brak pasujących atrakcji. Spróbuj innego wyszukiwania.", locationLabel: "Filtruj według lokalizacji", categoryLabel: "Filtruj według kategorii", priceLabel: "Filtruj według ceny", allLocations: "Wszystkie lokalizacje", hurghada: "Hurghada", marsaAlam: "Marsa Alam", allCategories: "Wszystkie kategorie", allPrices: "Dowolna cena", priceUnder25: "Poniżej 25 $", price25to50: "25 $ – 50 $", price50to100: "50 $ – 100 $", price100plus: "Powyżej 100 $", reset: "Wyczyść filtry" },
  zh: { search: "搜索这些体验", sort: "旅游排序", featured: "推荐", low: "价格：从低到高", high: "价格：从高到低", experience: "项体验", experiences: "项体验", assurance: "价格透明 · 接送已确认", inquiryAssurance: "价格和接送需咨询", quotation: "报价", request: "咨询价格", from: "起价", perPerson: "每人", entrance: "门票起价", person: "每人", inquire: "查看并咨询", book: "查看并预订", reviews: "条客户评价", empty: "没有匹配的体验，请尝试其他搜索。", locationLabel: "按地点筛选", categoryLabel: "按类别筛选", priceLabel: "按价格筛选", allLocations: "所有地点", hurghada: "赫尔格达", marsaAlam: "马尔萨阿拉姆", allCategories: "所有类别", allPrices: "不限价格", priceUnder25: "低于 $25", price25to50: "$25 – $50", price50to100: "$50 – $100", price100plus: "$100 以上", reset: "重置筛选" },
};

export default function CategoryTourExplorer({ tours, locale = "en", initialQuery = "" }: { tours: Tour[]; locale?: Locale; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<"featured" | "price-low" | "price-high">("featured");
  const [location, setLocation] = useState<"all" | DestinationSlug>("all");
  const [category, setCategory] = useState("all");
  const [priceBand, setPriceBand] = useState<PriceBand>("all");
  const { formatPrice } = useSiteSettings();
  const copy = explorerCopy[locale];
  const categories = useMemo(() => Array.from(new Set(tours.map((tour) => tour.category).filter((value): value is string => Boolean(value)))).sort(), [tours]);
  const hasActiveFilters = location !== "all" || category !== "all" || priceBand !== "all";
  const resetFilters = () => { setLocation("all"); setCategory("all"); setPriceBand("all"); };
  const visibleTours = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const result = tours.filter((tour) =>
      (!normalized || [tour.title, tour.description, tour.location, tour.duration, ...(tour.highlights || [])].join(" ").toLowerCase().includes(normalized)) &&
      (location === "all" || (tour.destinationSlug || "hurghada") === location) &&
      (category === "all" || tour.category === category) &&
      matchesPriceBand(tour, priceBand)
    );
    if (sort === "price-low") return [...result].sort((a, b) => (a.bookingMode === "inquiry" ? 1 : b.bookingMode === "inquiry" ? -1 : Number(a.price) - Number(b.price)));
    if (sort === "price-high") return [...result].sort((a, b) => (a.bookingMode === "inquiry" ? 1 : b.bookingMode === "inquiry" ? -1 : Number(b.price) - Number(a.price)));
    return result;
  }, [query, sort, location, category, priceBand, tours]);

  return (
    <>
      <div className="rounded-3xl border border-line bg-white/95 p-3 shadow-sm backdrop-blur sm:p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="flex items-center gap-3 rounded-2xl bg-surface-muted px-4">
          <Search size={19} className="text-ocean-dark" />
          <span className="sr-only">{copy.search}</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} className="min-h-12 w-full min-w-0 bg-transparent outline-none" />
        </label>
        <label>
          <span className="sr-only">{copy.sort}</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="min-h-12 w-full rounded-2xl border border-line bg-white px-4 font-semibold text-ink">
            <option value="featured">{copy.featured}</option>
            <option value="price-low">{copy.low}</option>
            <option value="price-high">{copy.high}</option>
          </select>
        </label>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap">
        <button type="button" onClick={() => setCategory("all")} className={`shrink-0 rounded-full border px-4 py-2.5 text-sm font-bold transition ${category === "all" ? "border-ocean-dark bg-ocean-dark text-white" : "border-line bg-white text-ink hover:border-ocean hover:text-ocean-dark"}`} aria-pressed={category === "all"}>{copy.allCategories}</button>
        {categories.map((value) => <button key={value} type="button" onClick={() => setCategory(value)} className={`shrink-0 rounded-full border px-4 py-2.5 text-sm font-bold transition ${category === value ? "border-ocean-dark bg-ocean-dark text-white" : "border-line bg-white text-ink hover:border-ocean hover:text-ocean-dark"}`} aria-pressed={category === value}>{value}</button>)}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label>
          <span className="sr-only">{copy.locationLabel}</span>
          <select value={location} onChange={(event) => setLocation(event.target.value as typeof location)} className="min-h-12 w-full rounded-2xl border border-line bg-white px-4 font-semibold text-ink">
            <option value="all">{copy.allLocations}</option>
            <option value="hurghada">{copy.hurghada}</option>
            <option value="marsa-alam">{copy.marsaAlam}</option>
            <option value="jeddah">{copy.jeddah || "Jeddah"}</option>
          </select>
        </label>
        <label>
          <span className="sr-only">{copy.categoryLabel}</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-12 w-full rounded-2xl border border-line bg-white px-4 font-semibold text-ink">
            <option value="all">{copy.allCategories}</option>
            {categories.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label>
          <span className="sr-only">{copy.priceLabel}</span>
          <select value={priceBand} onChange={(event) => setPriceBand(event.target.value as PriceBand)} className="min-h-12 w-full rounded-2xl border border-line bg-white px-4 font-semibold text-ink">
            <option value="all">{copy.allPrices}</option>
            <option value="under-25">{copy.priceUnder25}</option>
            <option value="25-50">{copy.price25to50}</option>
            <option value="50-100">{copy.price50to100}</option>
            <option value="100-plus">{copy.price100plus}</option>
          </select>
        </label>
      </div>
      </div>
      {hasActiveFilters ? <button type="button" onClick={resetFilters} className="mt-3 text-sm font-bold text-ocean-dark underline underline-offset-4">{copy.reset}</button> : null}

      <p className="mt-6 text-sm font-semibold text-muted" aria-live="polite">{visibleTours.length} {visibleTours.length === 1 ? copy.experience : copy.experiences}</p>
      <div className="mt-5 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
        {visibleTours.map((tour) => {
          const reviewCount = Number(tour.reviews);
          const hasReviews = Number.isFinite(reviewCount) && reviewCount > 0;
          return (
            <article key={tour.slug} className="relative overflow-hidden rounded-3xl border border-line bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <div className="absolute end-4 top-4 z-20">
                <ShareTripButton locale={locale} tourSlug={tour.slug} tourTitle={tour.title} destination={tour.destinationSlug || "hurghada"} compact />
              </div>
              <Link href={localePath(locale, `/tours/${tour.slug}`)} className="group block">
                <div className="relative h-56 overflow-hidden">
                  <Image src={tour.image} alt={tour.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" />
                  <ImageWatermark />
                  {tour.badge ? <span className="absolute start-4 top-4 rounded-full bg-brand-navy px-3 py-2 text-xs font-bold text-white">{localizeProductBadge(locale, tour.badge)}</span> : null}
                </div>
                <div className="p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-ocean-dark">{tour.category || "Red Sea experience"}</p>
                  <h2 className="mt-2 line-clamp-2 text-xl font-black text-ink">{tour.title}</h2>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted sm:line-clamp-3">{tour.description}</p>
                  <div className="mt-5 grid gap-2 text-sm text-muted">
                    <span className="flex items-center gap-2"><Clock size={17} className="text-ocean-dark" />{tour.duration}</span>
                    <span className="flex items-center gap-2"><MapPin size={17} className="text-ocean-dark" />{tour.location}</span>
                    <span className="flex items-center gap-2"><ShieldCheck size={17} className="text-emerald-600" />{tour.bookingMode === "inquiry" ? copy.inquiryAssurance : copy.assurance}</span>
                  </div>
                  <div className="mt-6 flex flex-col items-stretch gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>{tour.bookingMode === "inquiry" ? <><p className="text-xs text-muted">{copy.quotation}</p><p className="text-xl font-black text-ink">{copy.request}</p></> : <><p className="text-xs text-muted">{copy.from}</p>{tour.originalPrice && Number(tour.originalPrice) > Number(tour.price) ? <p className="text-xs font-bold text-muted line-through">{formatPrice(tour.originalPrice, tour.currency)}</p> : null}<p className="text-2xl font-black text-ink">{formatPrice(tour.price, tour.currency)}</p><p className="text-xs text-muted">{tour.priceUnit || copy.perPerson}</p>{tour.entrancePricing ? <p className="mt-2 text-xs font-bold text-ocean-dark">+ {copy.entrance} {formatPrice(String(tour.entrancePricing.adults))}/{copy.person}</p> : null}</>}</div>
                    <span className={`rounded-xl px-4 py-3 text-center text-sm font-bold text-white ${tour.bookingMode === "inquiry" ? "bg-ocean-dark" : "bg-brand-orange-cta"}`}>{tour.bookingMode === "inquiry" ? copy.inquire : copy.book}</span>
                  </div>
                  {hasReviews ? <p className="mt-4 text-xs font-semibold text-amber-600">★ {tour.rating} · {reviewCount} {copy.reviews}</p> : null}
                </div>
              </Link>
            </article>
          );
        })}
      </div>
      {!visibleTours.length ? <div className="mt-8 rounded-3xl border border-dashed border-line p-10 text-center text-muted">{copy.empty}</div> : null}
    </>
  );
}
