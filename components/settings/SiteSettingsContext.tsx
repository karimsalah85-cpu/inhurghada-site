"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export const languages = [
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "de", label: "Deutsch" },
] as const;

export const currencies = ["USD", "EUR", "GBP", "EGP"] as const;

type Language = (typeof languages)[number]["code"];
type Currency = (typeof currencies)[number];

const exchangeRates: Record<Currency, number> = {
  USD: 1,
  EUR: 0.875778,
  GBP: 0.744372,
  EGP: 51.091837,
};

type SiteSettings = {
  language: Language;
  currency: Currency;
  setLanguage: (language: Language) => void;
  setCurrency: (currency: Currency) => void;
  formatPrice: (usdPrice: string | number) => string;
  t: (key: string, fallback?: string) => string;
};

const translations: Record<Language, Record<string, string>> = {
  en: {
    home: "Home", tours: "Tours", transfers: "Transfers", booking: "Booking", checkout: "Checkout", about: "About", bookNow: "Book Now", whatsappBooking: "WhatsApp Booking",
    discoverHurghada: "Discover Hurghada", heroTitle: "Discover the Magic of the Red Sea", heroDescription: "Daily tours, diving trips, desert safaris, boat excursions and unforgettable adventures in the heart of Hurghada.",
    privateTransfers: "Private transfers", boatTrips: "Boat trips & snorkeling", desertAdventures: "Desert adventures", destination: "Destination", travelDate: "Travel Date", guests: "Guests", searchTours: "Search tours",
    chooseExperience: "Choose your experience", exploreAdventure: "Explore Hurghada by adventure", viewAllTours: "View all tours", popularTours: "Popular Tours", popularToursDescription: "Explore diving trips, snorkeling, Orange Bay cruises and Red Sea adventures.", searchPlaceholder: "Search tours, locations, activities...", bestSeller: "Best Seller", everyDay: "Every day", perPerson: "per person", bookYourTrip: "Book Your Trip", fullName: "Full Name", whatsappNumber: "WhatsApp Number", emailAddress: "Email address", pickupLocation: "Hotel Name / Pickup Location", specialRequests: "Special requests", sendBooking: "Send booking request", cashOnArrival: "Pay cash on arrival",
  },
  ar: {
    home: "الرئيسية", tours: "الرحلات", transfers: "التنقلات", booking: "الحجوزات", checkout: "إتمام الحجز", about: "من نحن", bookNow: "احجز الآن", whatsappBooking: "الحجز عبر واتساب",
    discoverHurghada: "اكتشف الغردقة", heroTitle: "اكتشف سحر البحر الأحمر", heroDescription: "رحلات يومية وغوص وسفاري صحراوي ورحلات بحرية ومغامرات لا تُنسى في قلب الغردقة.",
    privateTransfers: "تنقلات خاصة", boatTrips: "رحلات بحرية وغطس", desertAdventures: "مغامرات صحراوية", destination: "الوجهة", travelDate: "تاريخ الرحلة", guests: "الضيوف", searchTours: "ابحث عن رحلة",
    chooseExperience: "اختر تجربتك", exploreAdventure: "استكشف الغردقة بالمغامرة", viewAllTours: "عرض كل الرحلات", popularTours: "الرحلات الأكثر شعبية", popularToursDescription: "استكشف رحلات الغوص والسنوركلينج وكروز أورانج باي ومغامرات البحر الأحمر.", searchPlaceholder: "ابحث عن رحلات أو مواقع أو أنشطة...", bestSeller: "الأكثر طلبًا", everyDay: "يوميًا", perPerson: "للشخص", bookYourTrip: "احجز رحلتك", fullName: "الاسم الكامل", whatsappNumber: "رقم واتساب", emailAddress: "البريد الإلكتروني", pickupLocation: "اسم الفندق / موقع الاستلام", specialRequests: "طلبات خاصة", sendBooking: "إرسال طلب الحجز", cashOnArrival: "الدفع نقدًا عند الوصول",
  },
  de: {
    home: "Startseite", tours: "Ausflüge", transfers: "Transfers", booking: "Buchung", checkout: "Kasse", about: "Über uns", bookNow: "Jetzt buchen", whatsappBooking: "WhatsApp-Buchung",
    discoverHurghada: "Entdecke Hurghada", heroTitle: "Entdecke die Magie des Roten Meeres", heroDescription: "Tägliche Ausflüge, Tauchgänge, Wüstensafaris, Bootstouren und unvergessliche Abenteuer im Herzen von Hurghada.",
    privateTransfers: "Private Transfers", boatTrips: "Bootstouren & Schnorcheln", desertAdventures: "Wüstenabenteuer", destination: "Reiseziel", travelDate: "Reisedatum", guests: "Gäste", searchTours: "Ausflüge suchen",
    chooseExperience: "Wähle dein Erlebnis", exploreAdventure: "Entdecke Hurghada als Abenteuer", viewAllTours: "Alle Ausflüge ansehen", popularTours: "Beliebte Ausflüge", popularToursDescription: "Entdecke Tauchgänge, Schnorcheln, Orange-Bay-Kreuzfahrten und Abenteuer im Roten Meer.", searchPlaceholder: "Ausflüge, Orte oder Aktivitäten suchen...", bestSeller: "Bestseller", everyDay: "Täglich", perPerson: "pro Person", bookYourTrip: "Buche deine Reise", fullName: "Vollständiger Name", whatsappNumber: "WhatsApp-Nummer", emailAddress: "E-Mail-Adresse", pickupLocation: "Hotelname / Abholort", specialRequests: "Besondere Wünsche", sendBooking: "Buchungsanfrage senden", cashOnArrival: "Barzahlung bei Ankunft",
  },
};

const SiteSettingsContext = createContext<SiteSettings | null>(null);

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === "undefined") return "en";
    const savedLanguage = window.localStorage.getItem("daily-red-sea-language") as Language | null;
    return savedLanguage && languages.some((item) => item.code === savedLanguage) ? savedLanguage : "en";
  });
  const [currency, setCurrency] = useState<Currency>("USD");

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    window.localStorage.setItem("daily-red-sea-language", language);
  }, [language]);

  const value = useMemo<SiteSettings>(() => ({
    language,
    currency,
    setLanguage,
    setCurrency,
    t: (key, fallback) => translations[language][key] || fallback || key,
    formatPrice: (usdPrice) => new Intl.NumberFormat(language, {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "EGP" ? 0 : 2,
    }).format(Number(usdPrice) * exchangeRates[currency]),
  }), [currency, language]);

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);

  if (!context) throw new Error("useSiteSettings must be used within SiteSettingsProvider");

  return context;
}
