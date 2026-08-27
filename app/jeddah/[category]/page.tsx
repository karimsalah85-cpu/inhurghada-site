import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DestinationCategoryPage from "@/components/categories/DestinationCategoryPage";
import { tours } from "@/data/tours";
import { getDestination } from "@/lib/destinations";
import { languageAlternates, localePath } from "@/lib/i18n";
import { absoluteUrl, normalizeMetaDescription, normalizeMetaTitle, siteName } from "@/lib/seo";
import { getTourCategory, tourCategories } from "@/lib/tour-categories";

type Props = { params: Promise<{ category: string }> };

export function generateStaticParams() {
  return tourCategories
    .filter((category) => category.slug !== "excursions" && tours.some((tour) => tour.destinationSlug === "jeddah" && category.matches(tour)))
    .map(({ slug }) => ({ category: slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = getTourCategory((await params).category);
  const destination = getDestination("jeddah");
  if (!category || !destination) return {};
  const path = `/jeddah/${category.slug}`;
  const title = normalizeMetaTitle(`${category.title} in Jeddah | Daily Red Sea`);
  const description = normalizeMetaDescription(
    category.slug === "diving-snorkeling"
      ? "Compare beginner and certified scuba diving trips in Jeddah with clear SAR prices, certification requirements and local meeting details."
      : "Book Jeddah boat and yacht cruises in Obhur Bay with clear SAR prices, sailing times, refreshments and local meeting details.",
  );
  return {
    title,
    description,
    alternates: { canonical: path, languages: { ...languageAlternates(path), "x-default": localePath("en", path) } },
    openGraph: { title, description, url: absoluteUrl(path), siteName, type: "website", images: [{ url: absoluteUrl(destination.seo.ogImage), alt: `${category.title} in Jeddah` }] },
    twitter: { card: "summary_large_image", title, description, images: [absoluteUrl(destination.seo.ogImage)] },
  };
}

export default async function Page({ params }: Props) {
  const category = (await params).category;
  if (!getTourCategory(category)) notFound();
  return <DestinationCategoryPage destinationSlug="jeddah" categorySlug={category} />;
}
