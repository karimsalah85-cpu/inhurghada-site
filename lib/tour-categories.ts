import type { Tour } from "@/data/tours";
import type { Locale } from "@/lib/i18n";

export const tourCategories = [
  {
    slug: "excursions",
    title: "Tours & excursions",
    eyebrow: "Your Hurghada day out",
    description: "Browse Hurghada tours and excursions with clear prices, hotel pickup, and booking confirmation by WhatsApp.",
    matches: () => true,
  },
  {
    slug: "speedboat-trips",
    title: "Speedboat trips",
    eyebrow: "Private Red Sea adventures",
    description: "Choose a private speedboat, group size, island destination, departure time, and optional extras for a flexible Red Sea trip.",
    matches: (tour: Tour) => tour.category === "Speedboat Trip" || tour.category === "Private Speedboat",
  },
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
    matches: (tour: Tour) => tour.categoryPath?.[0] === "Diving & Snorkeling" || ["Snorkeling", "Diving"].includes(tour.category || "") || tour.slug === "professional-underwater-photographer",
  },
  {
    slug: "boat-cruises",
    title: "Boat cruises",
    eyebrow: "On the Red Sea",
    description: "Compare Red Sea boat and yacht cruises with clear schedules, meeting details, inclusions and local booking support.",
    matches: (tour: Tour) => tour.categoryPath?.[0] === "Boat Cruises" || ["Boat Cruise", "Yacht Cruise"].includes(tour.category || ""),
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
    excursions: "Tours & excursions",
    "speedboat-trips": "Speedboat trips",
    "island-trips": "Island trips",
    "diving-snorkeling": "Diving & snorkeling",
    "boat-cruises": "Boat cruises",
    "desert-safaris": "Desert safaris",
    "historical-tours": "Historical tours",
    "airport-transfers": "Airport transfers",
    "private-transfers": "Private transfers",
  },
  ar: {
    excursions: "الجولات والرحلات",
    "speedboat-trips": "رحلات القارب السريع",
    "island-trips": "رحلات الجزر",
    "diving-snorkeling": "الغوص والسنوركلينج",
    "boat-cruises": "الرحلات البحرية واليخوت",
    "desert-safaris": "رحلات السفاري الصحراوية",
    "historical-tours": "الرحلات التاريخية",
    "airport-transfers": "توصيلات المطار",
    "private-transfers": "التوصيلات الخاصة",
  },
  de: {
    excursions: "Touren & Ausflüge",
    "speedboat-trips": "Speedboot-Ausflüge",
    "island-trips": "Inseltouren",
    "diving-snorkeling": "Tauchen & Schnorcheln",
    "boat-cruises": "Boots- und Yachtfahrten",
    "desert-safaris": "Wüstensafaris",
    "historical-tours": "Historische Ausflüge",
    "airport-transfers": "Flughafentransfers",
    "private-transfers": "Private Transfers",
  },
  ru: {
    excursions: "Туры и экскурсии",
    "speedboat-trips": "Поездки на скоростном катере",
    "island-trips": "Поездки на острова",
    "diving-snorkeling": "Дайвинг и сноркелинг",
    "boat-cruises": "Морские прогулки на яхте",
    "desert-safaris": "Сафари по пустыне",
    "historical-tours": "Исторические экскурсии",
    "airport-transfers": "Трансферы из аэропорта",
    "private-transfers": "Частные трансферы",
  },
  pl: {
    excursions: "Wycieczki i atrakcje",
    "speedboat-trips": "Rejsy motorówką",
    "island-trips": "Wycieczki na wyspy",
    "diving-snorkeling": "Nurkowanie i snorkeling",
    "boat-cruises": "Rejsy łodzią i jachtem",
    "desert-safaris": "Safari na pustyni",
    "historical-tours": "Wycieczki historyczne",
    "airport-transfers": "Transfery lotniskowe",
    "private-transfers": "Prywatne transfery",
  },
  zh: {
    excursions: "旅游与活动",
    "speedboat-trips": "快艇行程",
    "island-trips": "海岛游",
    "diving-snorkeling": "深潜与浮潜",
    "boat-cruises": "游船与游艇巡航",
    "desert-safaris": "沙漠探险",
    "historical-tours": "历史文化之旅",
    "airport-transfers": "机场接送",
    "private-transfers": "私人接送",
  },
};

export function getTourCategory(slug: string) {
  return tourCategories.find((category) => category.slug === slug);
}
