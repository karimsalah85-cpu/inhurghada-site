import { notFound } from "next/navigation";
import { tours } from "@/data/tours";
import TourPageShell from "@/components/tours/TourPageShell";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return tours.map(({ slug }) => ({ slug }));
}

export default async function TourPage({ params }: PageProps) {
  const { slug } = await params;
  const tour = tours.find((item) => item.slug === slug);

  if (!tour) {
    notFound();
  }

  return <TourPageShell tour={tour} />;
}
