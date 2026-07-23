import type { MetadataRoute } from "next";
import { tours } from "@/data/tours";
import { siteUrl } from "@/lib/seo";
import { languageAlternates, localePath, locales } from "@/lib/i18n";
import { tourCategories } from "@/lib/tour-categories";

export default function sitemap(): MetadataRoute.Sitemap {
  const contentUpdatedAt = new Date("2026-07-23T00:00:00.000Z");
  const paths = [
    "",
    "/transfers",
    "/about",
    "/contact",
    "/faq",
    "/privacy-policy",
    "/terms-conditions",
    "/image-credits",
    ...tourCategories.map((category) => `/hurghada/${category.slug}`),
    ...tours.map((tour) => `/tours/${tour.slug}`),
  ];

  return locales.flatMap((locale) =>
    paths
      .filter((path) => locale === "en" || path !== "/image-credits")
      .map((path) => {
        const tour = path.startsWith("/tours/") ? tours.find((item) => path === `/tours/${item.slug}`) : undefined;
        const languages = path === "/image-credits"
          ? { en: `${siteUrl}${path}`, "x-default": `${siteUrl}${path}` }
          : Object.fromEntries([
              ...Object.entries(languageAlternates(path)).map(([language, route]) => [language, `${siteUrl}${route}`]),
              ["x-default", `${siteUrl}${localePath("en", path)}`],
            ]);
        return {
          url: `${siteUrl}${localePath(locale, path)}`,
          lastModified: contentUpdatedAt,
          changeFrequency: path ? "weekly" as const : "daily" as const,
          priority: !path ? 1 : tour ? 0.85 : path.startsWith("/hurghada/") ? 0.8 : 0.6,
          alternates: { languages },
          ...(tour ? { images: [`${siteUrl}${tour.image}`] } : {}),
        };
      })
  );
}
