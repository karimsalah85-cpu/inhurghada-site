"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export const languages = [
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "ru", label: "Русский" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
  { code: "it", label: "Italiano" },
  { code: "es", label: "Español" },
  { code: "pl", label: "Polski" },
  { code: "tr", label: "Türkçe" },
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
};

const SiteSettingsContext = createContext<SiteSettings | null>(null);

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  const [currency, setCurrency] = useState<Currency>("USD");

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  const value = useMemo<SiteSettings>(() => ({
    language,
    currency,
    setLanguage,
    setCurrency,
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
