import { MetadataRoute } from "next";
import { tours } from "@/data/tours";
import { siteUrl } from "@/lib/seo";
import { languageAlternates, localePath, locales } from "@/lib/i18n";

export default function sitemap(): MetadataRoute.Sitemap {
  const contentUpdatedAt = new Date("2026-07-22T00:00:00.000Z");

  const tourRoutes = tours.map((tour) => ({
    url: `${siteUrl}/tours/${tour.slug}`,
    lastModified: contentUpdatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
    images: [`${siteUrl}${tour.image}`],
  }));

  const localizedPaths = [
    "",
    "/booking",
    "/checkout",
    "/transfers",
    "/privacy-policy",
    "/terms-conditions",
    ...tours.map((tour) => `/tours/${tour.slug}`),
  ];
  const localizedRoutes = locales.filter((locale) => locale !== "en").flatMap((locale) => localizedPaths.map((path) => ({
    url: `${siteUrl}${localePath(locale, path)}`,
    lastModified: contentUpdatedAt,
    changeFrequency: path ? "weekly" as const : "daily" as const,
    priority: path ? 0.75 : 0.9,
    alternates: {
      languages: Object.fromEntries([
        ...Object.entries(languageAlternates(path)).map(([language, route]) => [language, `${siteUrl}${route}`]),
        ["x-default", `${siteUrl}${localePath("en", path)}`],
      ]),
    },
  })));

  return [
    {
      url: siteUrl,
      lastModified: contentUpdatedAt,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/transfers`,
      lastModified: contentUpdatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/booking`,
      lastModified: contentUpdatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/checkout`,
      lastModified: contentUpdatedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/privacy-policy`,
      lastModified: contentUpdatedAt,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/terms-conditions`,
      lastModified: contentUpdatedAt,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    ...tourRoutes,
    ...localizedRoutes,
  ];
}
