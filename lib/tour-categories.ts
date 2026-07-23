import type { Tour } from "@/data/tours";
import type { Locale } from "@/lib/i18n";

export const tourCategories = [
  {
    slug: "island-trips",
    title: "Island trips",
    eyebrow: "Turquoise escapes",
    description: "Sail to Orange Bay or Mahmya for snorkeling, clear water, lunch onboard, and an easy Red Sea beach day.",
    matches: (tour: Tour) => tour.category === "Island Trip",
  },
  {
    slug: "diving-snorkeling",
    title: "Diving & snorkeling",
    eyebrow: "Below the surface",
    description: "Discover Hurghada’s coral reefs with full-day snorkeling, guided diving, and professional underwater photography.",
    matches: (tour: Tour) => ["Snorkeling", "Diving"].includes(tour.category || "") || tour.slug === "professional-underwater-photographer",
  },
  {
    slug: "desert-safaris",
    title: "Desert safaris",
    eyebrow: "Beyond the shoreline",
    description: "Ride through the Eastern Desert in the morning or chase the golden light on an afternoon sunset safari.",
    matches: (tour: Tour) => tour.category === "Desert Safari",
  },
  {
    slug: "historical-tours",
    title: "Historical tours",
    eyebrow: "Ancient Egypt",
    description: "Travel from Hurghada to Luxor with a private guide and explore temples, royal tombs, and timeless Nile-side landmarks.",
    matches: (tour: Tour) => tour.category === "Cultural Day Trip",
  },
  {
    slug: "airport-transfers",
    title: "Airport transfers",
    eyebrow: "Arrive without the wait",
    description: "Pre-arranged private pickup from Hurghada Airport with fixed local pricing and the right vehicle for your group.",
    matches: (tour: Tour) => tour.category === "Airport Transfer",
  },
  {
    slug: "private-transfers",
    title: "Private transfers",
    eyebrow: "Door-to-door comfort",
    description: "Book clear, fixed-price private journeys for airport arrivals, hotels, resorts, and Senzo Mall.",
    matches: (tour: Tour) => ["Airport Transfer", "Shopping Transfer"].includes(tour.category || ""),
  },
] as const;

export type TourCategory = (typeof tourCategories)[number];

export const categoryLabels: Record<Locale, Record<TourCategory["slug"], string>> = {
  en: {
    "island-trips": "Island trips",
    "diving-snorkeling": "Diving & snorkeling",
    "desert-safaris": "Desert safaris",
    "historical-tours": "Historical tours",
    "airport-transfers": "Airport transfers",
    "private-transfers": "Private transfers",
  },
  ar: {
    "island-trips": "رحلات الجزر",
    "diving-snorkeling": "الغوص والسنوركلينج",
    "desert-safaris": "رحلات السفاري الصحراوية",
    "historical-tours": "الرحلات التاريخية",
    "airport-transfers": "توصيلات المطار",
    "private-transfers": "التوصيلات الخاصة",
  },
  de: {
    "island-trips": "Inseltouren",
    "diving-snorkeling": "Tauchen & Schnorcheln",
    "desert-safaris": "Wüstensafaris",
    "historical-tours": "Historische Ausflüge",
    "airport-transfers": "Flughafentransfers",
    "private-transfers": "Private Transfers",
  },
  ru: {
    "island-trips": "Поездки на острова",
    "diving-snorkeling": "Дайвинг и сноркелинг",
    "desert-safaris": "Сафари по пустыне",
    "historical-tours": "Исторические экскурсии",
    "airport-transfers": "Трансферы из аэропорта",
    "private-transfers": "Частные трансферы",
  },
  pl: {
    "island-trips": "Wycieczki na wyspy",
    "diving-snorkeling": "Nurkowanie i snorkeling",
    "desert-safaris": "Safari na pustyni",
    "historical-tours": "Wycieczki historyczne",
    "airport-transfers": "Transfery lotniskowe",
    "private-transfers": "Prywatne transfery",
  },
  zh: {
    "island-trips": "海岛游",
    "diving-snorkeling": "深潜与浮潜",
    "desert-safaris": "沙漠探险",
    "historical-tours": "历史文化之旅",
    "airport-transfers": "机场接送",
    "private-transfers": "私人接送",
  },
};

export function getTourCategory(slug: string) {
  return tourCategories.find((category) => category.slug === slug);
}

