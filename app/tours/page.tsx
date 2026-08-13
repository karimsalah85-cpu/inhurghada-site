import type { Metadata } from "next";
import CategoryTourExplorer from "@/components/categories/CategoryTourExplorer";
import { getLiveTours } from "@/lib/live-content";
import { languageAlternates, localePath, type Locale } from "@/lib/i18n";
import { localizeTour } from "@/lib/tour-localization";
import { absoluteUrl, normalizeMetaDescription, normalizeMetaTitle, siteName } from "@/lib/seo";

export const metadata: Metadata = {
  title: normalizeMetaTitle("All Hurghada and Red Sea tours"),
  description: normalizeMetaDescription("Search and compare Daily Red Sea tours by destination, activity, duration and price, with clear booking details and local support."),
  alternates: { canonical: "/tours", languages: { ...languageAlternates("/tours"), "x-default": "/tours" } },
  openGraph: { title: "All Hurghada and Red Sea tours", description: "Search and compare Daily Red Sea tours with clear prices, pickup details and local support.", url: absoluteUrl("/tours"), siteName, type: "website" },
};

const copy: Record<Locale, { eyebrow: string; title: string; description: string }> = {
  en: { eyebrow: "Daily Red Sea catalogue", title: "Find your Red Sea experience", description: "Search every currently available trip, compare prices and duration, then open a tour for its full itinerary and booking details." },
  de: { eyebrow: "Daily Red Sea Katalog", title: "Finde dein Erlebnis am Roten Meer", description: "Durchsuche alle verfügbaren Ausflüge, vergleiche Preise und Dauer und öffne die Tour für Reiseplan und Buchungsdetails." },
  ru: { eyebrow: "Каталог Daily Red Sea", title: "Найдите своё приключение на Красном море", description: "Ищите доступные экскурсии, сравнивайте цены и продолжительность и открывайте подробную программу и условия бронирования." },
  ar: { eyebrow: "دليل ديلي رد سي", title: "اختر تجربتك في البحر الأحمر", description: "ابحث في الرحلات المتاحة وقارن الأسعار والمدة ثم افتح الرحلة للاطلاع على البرنامج وتفاصيل الحجز." },
  pl: { eyebrow: "Katalog Daily Red Sea", title: "Znajdź swoją przygodę nad Morzem Czerwonym", description: "Przeszukaj dostępne wycieczki, porównaj ceny i czas trwania, a następnie sprawdź program i szczegóły rezerwacji." },
  zh: { eyebrow: "Daily Red Sea 行程目录", title: "寻找您的红海体验", description: "搜索当前可预订的行程，比较价格和时长，并查看完整行程与预订详情。" },
};

export default async function ToursPage({ locale = "en", searchParams }: { locale?: Locale; searchParams?: Promise<{ search?: string }> }) {
  const tours = (await getLiveTours(locale)).filter((tour) => tour.listingStatus !== "paused" && tour.listingStatus !== "unlisted").map((tour) => localizeTour(tour, locale));
  const text = copy[locale];
  const schema = { "@context": "https://schema.org", "@type": "ItemList", name: text.title, numberOfItems: tours.length, itemListElement: tours.map((tour, index) => ({ "@type": "ListItem", position: index + 1, name: tour.title, url: absoluteUrl(localePath(locale, `/tours/${tour.slug}`)) })) };
  return <main className="min-h-screen bg-slate-50">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <section className="bg-slate-950 px-6 pb-16 pt-32 text-white sm:px-8"><div className="mx-auto max-w-7xl"><p className="font-bold uppercase tracking-[0.24em] text-cyan-300">{text.eyebrow}</p><h1 className="mt-4 max-w-4xl text-4xl font-black sm:text-6xl">{text.title}</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{text.description}</p></div></section>
    <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8"><CategoryTourExplorer tours={tours} locale={locale} initialQuery={(await searchParams)?.search || ""} /></section>
  </main>;
}
