import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DestinationCategoryPage from "@/components/categories/DestinationCategoryPage";
import { tours } from "@/data/tours";
import { getDestination } from "@/lib/destinations";
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
  return {
    title: `${category.title} in Jeddah`,
    description: `Explore ${category.title.toLowerCase()} in Jeddah with clear SAR prices, local meeting details and direct booking support.`,
  };
}

export default async function Page({ params }: Props) {
  const category = (await params).category;
  if (!getTourCategory(category)) notFound();
  return <DestinationCategoryPage destinationSlug="jeddah" categorySlug={category} />;
}
