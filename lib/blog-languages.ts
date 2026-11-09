import type { Locale } from "@/lib/i18n";

// Keep this small registry safe to use in the client-side language switcher.
export const translatedBlogSlugs = [
  "egypt-visa-guide-2026",
  "best-snorkeling-tours-in-hurghada-for-beginners",
  "best-desert-safari-tours-for-adrenaline-junkies-in-hurghada",
  "hurghada-to-luxor-day-trip-what-to-expect-in-2026",
] as const;

export type TranslatedBlogSlug = (typeof translatedBlogSlugs)[number];

export function hasBlogTranslation(slug: string, locale: Locale) {
  return locale === "en" || translatedBlogSlugs.some((translated) => translated === slug);
}

export function blogPath(slug: string, locale: Locale = "en") {
  const prefix = locale !== "en" && hasBlogTranslation(slug, locale) ? `/${locale}` : "";
  return `${prefix}/blog/${slug}`;
}
