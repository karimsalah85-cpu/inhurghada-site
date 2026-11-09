import type { MetadataRoute } from "next";
import { getLiveBlogPosts, getLiveTours } from "@/lib/live-content";
import { absoluteUrl, siteUrl } from "@/lib/seo";
import { languageAlternates, localePath, locales } from "@/lib/i18n";
import { tourCategories } from "@/lib/tour-categories";
import { destinations } from "@/lib/destinations";
import { blogPath, hasBlogTranslation } from "@/lib/blog-languages";
import { blogLanguageAlternates } from "@/lib/blog-localization";

// Published articles are loaded from the live content store. Metadata routes are
// static by default, so force a fresh read whenever a crawler requests the sitemap.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tours, posts] = await Promise.all([getLiveTours(), getLiveBlogPosts()]);
  const publishedAt = (value: string) => {
    const timestamp = new Date(value).getTime();
    return Number.isFinite(timestamp) ? new Date(Math.min(timestamp, Date.now())) : undefined;
  };
  const postDates = posts.map((post) => publishedAt(post.publishedAt)).filter((date): date is Date => date !== undefined);
  const paths = [
    "",
    "/tours",
    "/transfers",
    "/about",
    "/contact",
    "/faq",
    "/privacy-policy",
    "/terms-conditions",
    ...destinations.filter((destination) => destination.status === "live").map((destination) => `/destinations/${destination.slug}`),
    ...tourCategories.map((category) => `/hurghada/${category.slug}`),
    ...tourCategories.filter((category) => category.slug !== "excursions" && tours.some((tour) => tour.destinationSlug === "marsa-alam" && category.matches(tour))).map((category) => `/marsa-alam/${category.slug}`),
    ...tourCategories.filter((category) => category.slug !== "excursions" && tours.some((tour) => tour.destinationSlug === "jeddah" && category.matches(tour))).map((category) => `/jeddah/${category.slug}`),
    ...tours.filter((tour) => tour.listingStatus !== "paused" && tour.listingStatus !== "unlisted").map((tour) => `/tours/${tour.slug}`),
  ];

  const localizedEntries = locales.flatMap((locale) =>
    paths
      .map((path) => {
        const tour = path.startsWith("/tours/") ? tours.find((item) => path === `/tours/${item.slug}`) : undefined;
        const languages = Object.fromEntries([
          ...Object.entries(languageAlternates(path)).map(([language, route]) => [language, `${siteUrl}${route}`]),
          ["x-default", `${siteUrl}${localePath("en", path)}`],
        ]);
        return {
          url: `${siteUrl}${localePath(locale, path)}`,
          changeFrequency: path ? "weekly" as const : "daily" as const,
          priority: !path ? 1 : tour ? 0.85 : path.startsWith("/hurghada/") || path.startsWith("/marsa-alam/") || path.startsWith("/jeddah/") ? 0.8 : 0.6,
          alternates: { languages },
          ...(tour ? { images: [absoluteUrl(tour.image)] } : {}),
        };
      })
  );
  const blogEntries: MetadataRoute.Sitemap = [
    ...locales.map((locale) => ({
      url: `${siteUrl}${localePath(locale, "/blog")}`,
      ...(postDates.length ? { lastModified: new Date(Math.max(...postDates.map((date) => date.getTime()))) } : {}),
      alternates: { languages: Object.fromEntries([...Object.entries(languageAlternates("/blog")).map(([language, path]) => [language, `${siteUrl}${path}`]), ["x-default", `${siteUrl}/blog`]]) },
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),
    ...posts.flatMap((post) => locales.filter((locale) => hasBlogTranslation(post.slug, locale)).map((locale) => ({
      url: `${siteUrl}${blogPath(post.slug, locale)}`,
      lastModified: publishedAt(post.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      alternates: { languages: Object.fromEntries(Object.entries(blogLanguageAlternates(post.slug)).map(([language, path]) => [language, `${siteUrl}${path}`])) },
    }))),
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
