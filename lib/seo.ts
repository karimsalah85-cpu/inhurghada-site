import type { Metadata } from "next";

export const siteUrl = "https://dailyredsea.com";
export const siteName = "Daily Red Sea";
export const defaultDescription =
  "Book Hurghada tours, Red Sea boat trips, diving experiences, desert adventures, and private transfers with local support.";
export const defaultSocialImage = "/og-image.svg";

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  image?: string;
  noIndex?: boolean;
};

export function pageMetadata({
  title,
  description,
  path,
  image = defaultSocialImage,
  noIndex = false,
}: PageMetadataInput): Metadata {
  const normalizedTitle = normalizeMetaTitle(title);
  const normalizedDescription = normalizeMetaDescription(description);
  return {
    title: normalizedTitle,
    description: normalizedDescription,
    alternates: { canonical: path },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title: normalizedTitle,
      description: normalizedDescription,
      url: path,
      siteName,
      locale: "en_US",
      type: "website",
      images: [{ url: image, alt: normalizedTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: normalizedTitle,
      description: normalizedDescription,
      images: [image],
    },
  };
}

export function absoluteUrl(path = "/") {
  return new URL(path, siteUrl).toString();
}

const metadataTitleSuffix: Record<"en" | "ar" | "de" | "ru" | "pl" | "zh", string> = {
  en: " · Hurghada tours",
  ar: " · رحلات الغردقة",
  de: " · Hurghada Ausflüge",
  ru: " · туры Хургады",
  pl: " · wycieczki Hurghada",
  zh: " · 赫尔格达旅游",
};

const metadataSupportCopy: Record<"en" | "ar" | "de" | "ru" | "pl" | "zh", string> = {
  en: "Clear prices, pickup confirmation and local WhatsApp support from Daily Red Sea.",
  ar: "أسعار واضحة وتأكيد الاستلام ودعم محلي عبر واتساب من Daily Red Sea.",
  de: "Klare Preise, bestätigte Abholung und lokale WhatsApp-Betreuung von Daily Red Sea.",
  ru: "Понятные цены, подтверждённый трансфер и местная поддержка в WhatsApp от Daily Red Sea.",
  pl: "Jasne ceny, potwierdzony odbiór i lokalne wsparcie WhatsApp od Daily Red Sea.",
  zh: "价格透明、接送确认，并由 Daily Red Sea 提供 WhatsApp 本地支持。",
};

function shortenMetadata(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  const cut = normalized.slice(0, maxLength - 1);
  const boundary = cut.lastIndexOf(" ");
  const safeCut = boundary > maxLength * 0.55 ? cut.slice(0, boundary) : cut;
  return `${safeCut.trim()}…`;
}

/** Keeps route titles within the audit limit before the root layout adds the brand suffix. */
export function normalizeMetaTitle(value: string, locale: "en" | "ar" | "de" | "ru" | "pl" | "zh" = "en") {
  let title = value.replace(/\s+/g, " ").trim();
  if (title.length < 28) title = `${title}${metadataTitleSuffix[locale]}`;
  return shortenMetadata(title, 44);
}

/** Makes short or inherited descriptions useful while capping them at a search-friendly length. */
export function normalizeMetaDescription(
  value: string,
  fallback = defaultDescription,
  locale: "en" | "ar" | "de" | "ru" | "pl" | "zh" = "en",
) {
  let description = value.replace(/\s+/g, " ").trim() || fallback.trim();
  if (description.length < 90) {
    description = `${description} ${fallback.trim()} ${metadataSupportCopy[locale]}`.trim();
  }
  return shortenMetadata(description, 155);
}
