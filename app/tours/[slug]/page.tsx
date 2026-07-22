import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { tours } from "@/data/tours";
import TourPageShell from "@/components/tours/TourPageShell";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return tours.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tour = tours.find((item) => item.slug === slug);
  if (!tour) return {};
  const title = tour.seoTitle || `${tour.title} from Hurghada`;
  const description = tour.metaDescription || tour.description;
  const url = `/tours/${tour.slug}`;
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url, type: "website", images: [{ url: tour.image, alt: tour.title }] }, twitter: { card: "summary_large_image", title, description, images: [tour.image] } };
}

export default async function TourPage({ params }: PageProps) {
  const { slug } = await params;
  const tour = tours.find((item) => item.slug === slug);

  if (!tour) {
    notFound();
  }

  return <TourPageShell tour={tour} />;
}
