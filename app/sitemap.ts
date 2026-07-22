import { MetadataRoute } from "next";
import { tours } from "@/data/tours";
import { siteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const contentUpdatedAt = new Date("2026-07-22T00:00:00.000Z");

  const tourRoutes = tours.map((tour) => ({
    url: `${siteUrl}/tours/${tour.slug}`,
    lastModified: contentUpdatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
    images: [`${siteUrl}${tour.image}`],
  }));

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
  ];
}
