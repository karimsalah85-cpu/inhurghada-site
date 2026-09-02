"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { localeFromPathname, localeSwitchPath } from "@/lib/i18n";

export const languages = [
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "de", label: "Deutsch" },
  { code: "ru", label: "Русский" },
  { code: "pl", label: "Polski" },
  { code: "zh", label: "简体中文" },
] as const;

export const currencies = ["USD", "EUR", "GBP", "EGP", "SAR"] as const;

export type Language = (typeof languages)[number]["code"];
export type Currency = (typeof currencies)[number];

const exchangeRates: Record<Currency, number> = {
  USD: 1,
  EUR: 0.862503,
  GBP: 0.739407,
  EGP: 50.924246,
  SAR: 3.75,
};

type SiteSettings = {
  language: Language;
  currency: Currency;
  setLanguage: (language: Language) => void;
  setCurrency: (currency: Currency) => void;
  formatPrice: (price: string | number, sourceCurrency?: Currency) => string;
  t: (key: string, fallback?: string) => string;
  setting: <T = unknown>(key: string, fallback: T) => T;
};

const translations: Record<Language, Record<string, string>> = {
  en: {
    home: "Home", tours: "Tours", transfers: "Transfers", booking: "Booking", checkout: "Checkout", about: "About", bookNow: "Book Now", whatsappBooking: "WhatsApp Booking", goodMorning: "Good morning", goodAfternoon: "Good afternoon", goodEvening: "Good evening",
    discoverHurghada: "Discover the Red Sea", heroTitle: "Discover Red Sea Tours & Experiences", heroDescription: "Explore verified trips in Hurghada, Marsa Alam and Jeddah with clear prices, pickup or meeting-point details, and easy WhatsApp support.",
    privateTransfers: "Private transfers", boatTrips: "Boat trips & snorkeling", desertAdventures: "Desert adventures", destination: "Destination", travelDate: "Travel Date", guests: "Guests", searchTours: "Search tours",
    chooseExperience: "Choose your experience", exploreAdventure: "Explore the Red Sea by adventure", viewAllTours: "View all tours", popularTours: "Popular Tours", popularToursDescription: "Explore diving trips, snorkeling, Orange Bay cruises and Red Sea adventures.", searchPlaceholder: "Choose a destination", bestSeller: "Best Seller", everyDay: "Every day", perPerson: "per person", bookYourTrip: "Book Your Trip", fullName: "Full Name", whatsappNumber: "WhatsApp Number", emailAddress: "Email address", pickupLocation: "Hotel Name / Pickup Location", specialRequests: "Special requests", sendBooking: "Send booking request", cashOnArrival: "Pay cash on arrival",
  },
  ar: {
    home: "الرئيسية", tours: "الرحلات", transfers: "التنقلات", booking: "الحجوزات", checkout: "إتمام الحجز", about: "من نحن", bookNow: "احجز الآن", whatsappBooking: "الحجز عبر واتساب", goodMorning: "صباح الخير", goodAfternoon: "مساء الخير", goodEvening: "مساء الخير",
    discoverHurghada: "اكتشف البحر الأحمر", heroTitle: "تجارب البحر الأحمر، وجهة بعد أخرى", heroDescription: "اختر وجهتك واستكشف رحلات موثوقة بأسعار واضحة ومعلومات استلام محلية ودعم سهل للحجز.",
    privateTransfers: "تنقلات خاصة", boatTrips: "رحلات بحرية وغطس", desertAdventures: "مغامرات صحراوية", destination: "الوجهة", travelDate: "تاريخ الرحلة", guests: "الضيوف", searchTours: "ابحث عن رحلة",
    chooseExperience: "اختر تجربتك", exploreAdventure: "استكشف الغردقة بالمغامرة", viewAllTours: "عرض كل الرحلات", popularTours: "الرحلات الأكثر شعبية", popularToursDescription: "استكشف رحلات الغوص والسنوركلينج وكروز أورانج باي ومغامرات البحر الأحمر.", searchPlaceholder: "ابحث عن رحلات أو مواقع أو أنشطة...", bestSeller: "الأكثر طلبًا", everyDay: "يوميًا", perPerson: "للشخص", bookYourTrip: "احجز رحلتك", fullName: "الاسم الكامل", whatsappNumber: "رقم واتساب", emailAddress: "البريد الإلكتروني", pickupLocation: "اسم الفندق / موقع الاستلام", specialRequests: "طلبات خاصة", sendBooking: "إرسال طلب الحجز", cashOnArrival: "الدفع نقدًا عند الوصول",
  },
  de: {
    home: "Startseite", tours: "Ausflüge", transfers: "Transfers", booking: "Buchung", checkout: "Kasse", about: "Über uns", bookNow: "Jetzt buchen", whatsappBooking: "WhatsApp-Buchung", goodMorning: "Guten Morgen", goodAfternoon: "Guten Tag", goodEvening: "Guten Abend",
    discoverHurghada: "Entdecke das Rote Meer", heroTitle: "Erlebnisse am Roten Meer – Reiseziel für Reiseziel", heroDescription: "Wähle dein Reiseziel und entdecke geprüfte Ausflüge mit klaren Preisen, lokalen Abholinformationen und einfacher Buchungshilfe.",
    privateTransfers: "Private Transfers", boatTrips: "Bootstouren & Schnorcheln", desertAdventures: "Wüstenabenteuer", destination: "Reiseziel", travelDate: "Reisedatum", guests: "Gäste", searchTours: "Ausflüge suchen",
    chooseExperience: "Wähle dein Erlebnis", exploreAdventure: "Entdecke Hurghada als Abenteuer", viewAllTours: "Alle Ausflüge ansehen", popularTours: "Beliebte Ausflüge", popularToursDescription: "Entdecke Tauchgänge, Schnorcheln, Orange-Bay-Kreuzfahrten und Abenteuer im Roten Meer.", searchPlaceholder: "Ausflüge suchen…", bestSeller: "Bestseller", everyDay: "Täglich", perPerson: "pro Person", bookYourTrip: "Buche deine Reise", fullName: "Vollständiger Name", whatsappNumber: "WhatsApp-Nummer", emailAddress: "E-Mail-Adresse", pickupLocation: "Hotelname / Abholort", specialRequests: "Besondere Wünsche", sendBooking: "Buchungsanfrage senden", cashOnArrival: "Barzahlung bei Ankunft",
  },
  ru: {
    home: "Главная", tours: "Экскурсии", transfers: "Трансферы", booking: "Бронирование", checkout: "Оформление", about: "О нас", bookNow: "Забронировать", whatsappBooking: "Бронирование в WhatsApp", goodMorning: "Доброе утро", goodAfternoon: "Добрый день", goodEvening: "Добрый вечер",
    discoverHurghada: "Откройте Красное море", heroTitle: "Впечатления Красного моря — направление за направлением", heroDescription: "Выберите направление и найдите проверенные поездки с понятными ценами, местными условиями трансфера и удобной поддержкой.",
    privateTransfers: "Частные трансферы", boatTrips: "Морские прогулки и сноркелинг", desertAdventures: "Приключения в пустыне", destination: "Направление", travelDate: "Дата поездки", guests: "Гости", searchTours: "Найти туры",
    chooseExperience: "Выберите впечатление", exploreAdventure: "Откройте Хургаду", viewAllTours: "Все туры", popularTours: "Популярные туры", popularToursDescription: "Дайвинг, сноркелинг, круизы на Orange Bay и приключения на Красном море.", searchPlaceholder: "Поиск туров, мест, занятий...", bestSeller: "Хит продаж", everyDay: "Каждый день", perPerson: "за человека", bookYourTrip: "Забронировать поездку", fullName: "Полное имя", whatsappNumber: "Номер WhatsApp", emailAddress: "Электронная почта", pickupLocation: "Отель / место встречи", specialRequests: "Особые пожелания", sendBooking: "Отправить запрос", cashOnArrival: "Оплата наличными по прибытии",
  },
  pl: {
    home: "Strona główna", tours: "Wycieczki", transfers: "Transfery", booking: "Rezerwacja", checkout: "Finalizacja", about: "O nas", bookNow: "Zarezerwuj", whatsappBooking: "Rezerwacja przez WhatsApp", goodMorning: "Dzień dobry", goodAfternoon: "Dzień dobry", goodEvening: "Dobry wieczór",
    discoverHurghada: "Odkryj Morze Czerwone", heroTitle: "Atrakcje Morza Czerwonego — kierunek po kierunku", heroDescription: "Wybierz kierunek i odkrywaj sprawdzone wycieczki z jasnymi cenami, lokalnymi informacjami o odbiorze i łatwym wsparciem.",
    privateTransfers: "Prywatne transfery", boatTrips: "Rejsy i snorkeling", desertAdventures: "Przygody na pustyni", destination: "Kierunek", travelDate: "Data podróży", guests: "Goście", searchTours: "Szukaj wycieczek",
    chooseExperience: "Wybierz atrakcję", exploreAdventure: "Odkrywaj Hurghadę", viewAllTours: "Zobacz wszystkie wycieczki", popularTours: "Popularne wycieczki", popularToursDescription: "Odkryj nurkowanie, snorkeling, rejsy Orange Bay i przygody nad Morzem Czerwonym.", searchPlaceholder: "Szukaj wycieczek, miejsc, atrakcji...", bestSeller: "Bestseller", everyDay: "Codziennie", perPerson: "za osobę", bookYourTrip: "Zarezerwuj wycieczkę", fullName: "Imię i nazwisko", whatsappNumber: "Numer WhatsApp", emailAddress: "Adres e-mail", pickupLocation: "Hotel / miejsce odbioru", specialRequests: "Specjalne życzenia", sendBooking: "Wyślij zapytanie", cashOnArrival: "Płatność gotówką na miejscu",
  },
  zh: {
    home: "首页", tours: "旅游项目", transfers: "接送服务", booking: "预订", checkout: "结算", about: "关于我们", bookNow: "立即预订", whatsappBooking: "WhatsApp 预订", goodMorning: "早上好", goodAfternoon: "下午好", goodEvening: "晚上好",
    discoverHurghada: "探索红海", heroTitle: "逐个目的地，发现红海精彩体验", heroDescription: "选择目的地，探索价格透明、接送信息清晰并提供便捷预订支持的精选行程。",
    privateTransfers: "私人接送", boatTrips: "游船和浮潜", desertAdventures: "沙漠探险", destination: "目的地", travelDate: "出行日期", guests: "游客", searchTours: "搜索旅游项目",
    chooseExperience: "选择您的体验", exploreAdventure: "探索赫尔格达", viewAllTours: "查看所有项目", popularTours: "热门旅游项目", popularToursDescription: "探索深潜、浮潜、Orange Bay 巡游和红海探险。", searchPlaceholder: "搜索旅游项目、地点或活动...", bestSeller: "热销", everyDay: "每天", perPerson: "每人", bookYourTrip: "预订行程", fullName: "姓名", whatsappNumber: "WhatsApp 号码", emailAddress: "电子邮箱", pickupLocation: "酒店 / 接送地点", specialRequests: "特殊要求", sendBooking: "发送预订请求", cashOnArrival: "抵达时现金支付",
  },
};

const SiteSettingsContext = createContext<SiteSettings | null>(null);

export function SiteSettingsProvider({ children, initialLanguage = "en" }: { children: React.ReactNode; initialLanguage?: Language }) {
  const pathname = usePathname();
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [publicSettings, setPublicSettings] = useState<Record<string, unknown>>({});

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/site-content", { signal: controller.signal }).then((response) => response.ok ? response.json() : null).then((data) => { if (data?.settings && typeof data.settings === "object") setPublicSettings(data.settings); }).catch(() => undefined);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const preferredLanguage = localeFromPathname(pathname);
    const update = window.setTimeout(() => setLanguage(preferredLanguage), 0);
    return () => window.clearTimeout(update);
  }, [pathname]);
  const [currency, setCurrency] = useState<Currency>(() => pathname.includes("/jeddah") || pathname.includes("jeddah-") ? "SAR" : "USD");
  const [rates, setRates] = useState<Record<Currency, number>>(exchangeRates);

  useEffect(() => {
    const requestedCurrency = new URLSearchParams(window.location.search).get("currency")?.toUpperCase() as Currency | undefined;
    if (requestedCurrency && currencies.includes(requestedCurrency)) {
      const update = window.setTimeout(() => setCurrency(requestedCurrency), 0);
      return () => window.clearTimeout(update);
    }

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
    const destination = localeSwitchPath(window.location.pathname, nextLanguage);
    window.location.assign(`${destination}${window.location.search}${window.location.hash}`);
  }

  const value = useMemo<SiteSettings>(() => ({
    language,
    currency,
    setLanguage: changeLanguage,
    setCurrency,
    t: (key, fallback) => {
      const override = publicSettings[`translation.${language}.${key}`] ?? publicSettings[`${language}.${key}`] ?? publicSettings[key];
      return typeof override === "string" && override.trim() ? override : translations[language][key] || fallback || key;
    },
    setting: (key, fallback) => publicSettings[key] === undefined ? fallback : publicSettings[key] as typeof fallback,
    formatPrice: (price, sourceCurrency = "USD") => new Intl.NumberFormat(language, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format((Number(price) / rates[sourceCurrency]) * rates[currency]),
  }), [currency, language, publicSettings, rates]);

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);

  if (!context) throw new Error("useSiteSettings must be used within SiteSettingsProvider");

  return context;
}
