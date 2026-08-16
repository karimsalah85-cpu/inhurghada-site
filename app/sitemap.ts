import type { MetadataRoute } from "next";
import { getLiveBlogPosts, getLiveTours } from "@/lib/live-content";
import { siteUrl } from "@/lib/seo";
import { languageAlternates } from "@/lib/i18n";
import { tourCategories } from "@/lib/tour-categories";
import { destinations } from "@/lib/destinations";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tours, posts] = await Promise.all([getLiveTours(), getLiveBlogPosts()]);
  const publishedAt = (value: string) => new Date(Math.min(new Date(value).getTime(), Date.now()));
  const paths = [
    "",
    "/tours",
    "/transfers",
    "/about",
    "/contact",
    "/faq",
    "/privacy-policy",
    "/terms-conditions",
    "/image-credits",
    ...destinations.filter((destination) => destination.status === "live").map((destination) => `/destinations/${destination.slug}`),
    ...tourCategories.map((category) => `/hurghada/${category.slug}`),
    ...tourCategories.filter((category) => category.slug !== "excursions" && tours.some((tour) => tour.destinationSlug === "marsa-alam" && category.matches(tour))).map((category) => `/marsa-alam/${category.slug}`),
    ...tours.filter((tour) => tour.listingStatus !== "paused" && tour.listingStatus !== "unlisted").map((tour) => `/tours/${tour.slug}`),
  ];

  // Keep the crawl queue concentrated on the strongest English URLs while the domain earns authority.
  // Localised pages remain live and retain their hreflang alternates, but are not separately submitted.
  const localizedEntries = paths.map((path) => {
    const tour = path.startsWith("/tours/") ? tours.find((item) => path === `/tours/${item.slug}`) : undefined;
    const isEnglishOnly = path === "/image-credits" || path.startsWith("/destinations/");
    const languages = isEnglishOnly
      ? { en: `${siteUrl}${path}`, "x-default": `${siteUrl}${path}` }
      : Object.fromEntries([
          ...Object.entries(languageAlternates(path)).map(([language, route]) => [language, `${siteUrl}${route}`]),
          ["x-default", `${siteUrl}${path}`],
        ]);
    return {
      url: `${siteUrl}${path}`,
      changeFrequency: path ? "weekly" as const : "daily" as const,
      priority: !path ? 1 : tour ? 0.85 : path.startsWith("/hurghada/") || path.startsWith("/marsa-alam/") ? 0.8 : 0.6,
      alternates: { languages },
      ...(tour ? { images: [`${siteUrl}${tour.image}`] } : {}),
    };
  });
  const blogEntries: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/blog`,
      lastModified: new Date(Math.min(Math.max(...posts.map((post) => new Date(post.publishedAt).getTime())), Date.now())),
      changeFrequency: "weekly",
      priority: 0.75,
    },
    ...posts.map((post) => ({
      url: `${siteUrl}/blog/${post.slug}`,
      lastModified: publishedAt(post.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
  const editorialEntries: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/hurghada/marine-life`,
      changeFrequency: "monthly",
      priority: 0.75,
      alternates: { languages: { en: `${siteUrl}/hurghada/marine-life`, "x-default": `${siteUrl}/hurghada/marine-life` } },
    },
  ];
  return [...localizedEntries, ...editorialEntries, ...blogEntries];
}
