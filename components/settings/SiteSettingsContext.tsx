"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { isLocale } from "@/lib/i18n";

export const languages = [
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "de", label: "Deutsch" },
  { code: "ru", label: "Русский" },
  { code: "pl", label: "Polski" },
  { code: "zh", label: "简体中文" },
] as const;

export const currencies = ["USD", "EUR", "GBP", "EGP"] as const;

type Language = (typeof languages)[number]["code"];
type Currency = (typeof currencies)[number];

const exchangeRates: Record<Currency, number> = {
  USD: 1,
  EUR: 0.876691,
  GBP: 0.747063,
  EGP: 51.008475,
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
    discoverHurghada: "Discover Hurghada", heroTitle: "Discover the Best Tours & Excursions in Hurghada", heroDescription: "Island trips, snorkeling, scuba diving, desert safaris and airport transfers - all with easy WhatsApp booking.",
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
  ru: {
    home: "Главная", tours: "Экскурсии", transfers: "Трансферы", booking: "Бронирование", checkout: "Оформление", about: "О нас", bookNow: "Забронировать", whatsappBooking: "Бронирование в WhatsApp",
    discoverHurghada: "Откройте Хургаду", heroTitle: "Лучшие туры и экскурсии в Хургаде", heroDescription: "Островные поездки, сноркелинг, дайвинг, сафари в пустыне и трансферы из аэропорта - всё с простым бронированием через WhatsApp.",
    privateTransfers: "Частные трансферы", boatTrips: "Морские прогулки и сноркелинг", desertAdventures: "Приключения в пустыне", destination: "Направление", travelDate: "Дата поездки", guests: "Гости", searchTours: "Найти туры",
    chooseExperience: "Выберите впечатление", exploreAdventure: "Откройте Хургаду", viewAllTours: "Все туры", popularTours: "Популярные туры", popularToursDescription: "Дайвинг, сноркелинг, круизы на Orange Bay и приключения на Красном море.", searchPlaceholder: "Поиск туров, мест, занятий...", bestSeller: "Хит продаж", everyDay: "Каждый день", perPerson: "за человека", bookYourTrip: "Забронировать поездку", fullName: "Полное имя", whatsappNumber: "Номер WhatsApp", emailAddress: "Электронная почта", pickupLocation: "Отель / место встречи", specialRequests: "Особые пожелания", sendBooking: "Отправить запрос", cashOnArrival: "Оплата наличными по прибытии",
  },
  pl: {
    home: "Strona główna", tours: "Wycieczki", transfers: "Transfery", booking: "Rezerwacja", checkout: "Finalizacja", about: "O nas", bookNow: "Zarezerwuj", whatsappBooking: "Rezerwacja przez WhatsApp",
    discoverHurghada: "Odkryj Hurghadę", heroTitle: "Najlepsze wycieczki i atrakcje w Hurghadzie", heroDescription: "Wyspy, snorkeling, nurkowanie, safari na pustyni i transfery lotniskowe - z łatwą rezerwacją przez WhatsApp.",
    privateTransfers: "Prywatne transfery", boatTrips: "Rejsy i snorkeling", desertAdventures: "Przygody na pustyni", destination: "Kierunek", travelDate: "Data podróży", guests: "Goście", searchTours: "Szukaj wycieczek",
    chooseExperience: "Wybierz atrakcję", exploreAdventure: "Odkrywaj Hurghadę", viewAllTours: "Zobacz wszystkie wycieczki", popularTours: "Popularne wycieczki", popularToursDescription: "Odkryj nurkowanie, snorkeling, rejsy Orange Bay i przygody nad Morzem Czerwonym.", searchPlaceholder: "Szukaj wycieczek, miejsc, atrakcji...", bestSeller: "Bestseller", everyDay: "Codziennie", perPerson: "za osobę", bookYourTrip: "Zarezerwuj wycieczkę", fullName: "Imię i nazwisko", whatsappNumber: "Numer WhatsApp", emailAddress: "Adres e-mail", pickupLocation: "Hotel / miejsce odbioru", specialRequests: "Specjalne życzenia", sendBooking: "Wyślij zapytanie", cashOnArrival: "Płatność gotówką na miejscu",
  },
  zh: {
    home: "首页", tours: "旅游项目", transfers: "接送服务", booking: "预订", checkout: "结算", about: "关于我们", bookNow: "立即预订", whatsappBooking: "WhatsApp 预订",
    discoverHurghada: "探索赫尔格达", heroTitle: "探索赫尔格达最佳旅游和体验", heroDescription: "海岛游、浮潜、深潜、沙漠探险和机场接送 - 均可通过 WhatsApp 轻松预订。",
    privateTransfers: "私人接送", boatTrips: "游船和浮潜", desertAdventures: "沙漠探险", destination: "目的地", travelDate: "出行日期", guests: "游客", searchTours: "搜索旅游项目",
    chooseExperience: "选择您的体验", exploreAdventure: "探索赫尔格达", viewAllTours: "查看所有项目", popularTours: "热门旅游项目", popularToursDescription: "探索深潜、浮潜、Orange Bay 巡游和红海探险。", searchPlaceholder: "搜索旅游项目、地点或活动...", bestSeller: "热销", everyDay: "每天", perPerson: "每人", bookYourTrip: "预订行程", fullName: "姓名", whatsappNumber: "WhatsApp 号码", emailAddress: "电子邮箱", pickupLocation: "酒店 / 接送地点", specialRequests: "特殊要求", sendBooking: "发送预订请求", cashOnArrival: "抵达时现金支付",
  },
};

const SiteSettingsContext = createContext<SiteSettings | null>(null);

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    const routeLocale = window.location.pathname.split("/")[1];
    const savedLanguage = window.localStorage.getItem("daily-red-sea-language") as Language | null;
    const preferredLanguage = isLocale(routeLocale)
      ? routeLocale
      : savedLanguage && languages.some((item) => item.code === savedLanguage)
        ? savedLanguage
        : "en";
    const update = window.setTimeout(() => setLanguage(preferredLanguage), 0);
    return () => window.clearTimeout(update);
  }, []);
  const [currency, setCurrency] = useState<Currency>("USD");
  const [rates, setRates] = useState<Record<Currency, number>>(exchangeRates);

  useEffect(() => {
    const savedCurrency = window.localStorage.getItem("daily-red-sea-currency") as Currency | null;
    if (!savedCurrency || !currencies.includes(savedCurrency)) return;
    const update = window.setTimeout(() => setCurrency(savedCurrency), 0);
    return () => window.clearTimeout(update);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("daily-red-sea-currency", currency);
  }, [currency]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/exchange-rates", { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Rate request failed")))
      .then((data: { rates?: Partial<Record<Currency, number>> }) => {
        if (data.rates) setRates((current) => ({ ...current, ...data.rates }));
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.warn("Using cached currency rates", error);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    window.localStorage.setItem("daily-red-sea-language", language);
  }, [language]);

  function changeLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);
    const parts = window.location.pathname.split("/").filter(Boolean);
    if (parts[0] && isLocale(parts[0])) parts.shift();
    const supportedLocalizedPath = !parts.length || ["booking", "checkout", "transfers", "privacy-policy", "terms-conditions", "tours"].includes(parts[0]);
    window.location.assign(supportedLocalizedPath ? `/${nextLanguage}${parts.length ? `/${parts.join("/")}` : ""}${window.location.search}${window.location.hash}` : `/${nextLanguage}`);
  }

  const value = useMemo<SiteSettings>(() => ({
    language,
    currency,
    setLanguage: changeLanguage,
    setCurrency,
    t: (key, fallback) => translations[language][key] || fallback || key,
    formatPrice: (usdPrice) => new Intl.NumberFormat(language, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(usdPrice) * rates[currency]),
  }), [currency, language, rates]);

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);

  if (!context) throw new Error("useSiteSettings must be used within SiteSettingsProvider");

  return context;
}
