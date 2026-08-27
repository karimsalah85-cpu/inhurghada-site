import type { Locale } from "@/lib/i18n";

const SENSITIVE_KEYS = new Set(["name", "email", "phone", "reference", "passport", "booking"]);

export function buildTripShareUrl(origin: string, locale: Locale, tourSlug: string, date?: string) {
  const prefix = locale === "en" ? "" : `/${locale}`;
  const url = new URL(`${prefix}/tours/${encodeURIComponent(tourSlug)}`, origin);
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) url.searchParams.set("date", date);
  for (const key of [...url.searchParams.keys()]) if (SENSITIVE_KEYS.has(key.toLowerCase())) url.searchParams.delete(key);
  return url.toString();
}

export function tripShareText(locale: Locale) {
  return locale === "ar"
    ? "رحلة غروب بحرية في جدة — شاهد المواعيد والأسعار على ديلي رد سي."
    : "Jeddah sunset cruise on the Red Sea — see dates and prices on Daily Red Sea.";
}

export function whatsappShareUrl(text: string, url: string) {
  return `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
}

