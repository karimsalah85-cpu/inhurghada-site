import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DestinationCategoryPage from "@/components/categories/DestinationCategoryPage";
import { tours } from "@/data/tours";
import { getDestination } from "@/lib/destinations";
import { absoluteUrl, normalizeMetaDescription, normalizeMetaTitle, siteName } from "@/lib/seo";
import { getTourCategory, tourCategories } from "@/lib/tour-categories";

type Props = { params: Promise<{ category: string }> };

export function generateStaticParams() {
  return tourCategories.filter((category) => category.slug !== "excursions" && tours.some((tour) => tour.destinationSlug === "marsa-alam" && category.matches(tour))).map(({ slug }) => ({ category: slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = getTourCategory((await params).category);
  const destination = getDestination("marsa-alam");
  if (!category || !destination) notFound();
  const path = `/marsa-alam/${category.slug}`;
  const title = normalizeMetaTitle(`${category.title} in ${destination.name}`);
  const description = normalizeMetaDescription(`Compare ${category.title.toLowerCase()} in ${destination.name} with clear prices, hotel pickup information and local booking support.`);
  return { title, description, alternates: { canonical: path }, openGraph: { title, description, url: absoluteUrl(path), siteName, type: "website", images: [{ url: absoluteUrl(destination.seo.ogImage), alt: destination.name }] } };
}

export default async function Page({ params }: Props) {
  return <DestinationCategoryPage destinationSlug="marsa-alam" categorySlug={(await params).category}/>;
}
