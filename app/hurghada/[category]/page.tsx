import type { Metadata } from "next";
import TourCategoryView from "@/components/categories/TourCategoryView";
import { getTourCategory, tourCategories } from "@/lib/tour-categories";
import { absoluteUrl, normalizeMetaDescription, normalizeMetaTitle, siteName } from "@/lib/seo";
import { languageAlternates, localePath } from "@/lib/i18n";

type PageProps = { params: Promise<{ category: string }> };

export function generateStaticParams() {
  return tourCategories.map(({ slug }) => ({ category: slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const category = getTourCategory((await params).category);
  if (!category) return {};
  const path = `/hurghada/${category.slug}`;
  const title = normalizeMetaTitle(`${category.title} in Hurghada`);
  const description = normalizeMetaDescription(category.description);
  return {
    title,
    description,
    alternates: { canonical: path, languages: { ...languageAlternates(path), "x-default": localePath("en", path) } },
    openGraph: { title, description, url: absoluteUrl(path), siteName, type: "website" },
  };
}

// A page's default export may only take Next's own props (params/searchParams),
// so the localized route renders TourCategoryView directly with a locale.
export default async function TourCategoryPage({ params }: PageProps) {
  return <TourCategoryView categorySlug={(await params).category} />;
}
