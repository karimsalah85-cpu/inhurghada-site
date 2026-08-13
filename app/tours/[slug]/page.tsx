import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { tours } from "@/data/tours";
import { getLiveTours } from "@/lib/live-content";
import TourPageShell from "@/components/tours/TourPageShell";
import { normalizeMetaDescription, normalizeMetaTitle, siteName } from "@/lib/seo";
import { languageAlternates, localePath } from "@/lib/i18n";
import { localizeTour } from "@/lib/tour-localization";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return tours.filter((tour) => tour.listingStatus !== "unlisted").map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const liveTours = await getLiveTours();
  const sourceTour = liveTours.find((item) => item.slug === slug) || tours.find((item) => item.slug === slug && item.listingStatus !== "unlisted");
  const tour = sourceTour ? localizeTour(sourceTour, "en") : undefined;
  if (!tour) return {};
  const title = normalizeMetaTitle(tour.seoTitle || `${tour.title} from ${tour.destinationSlug === "marsa-alam" ? "Marsa Alam" : "Hurghada"}`);
  const description = normalizeMetaDescription(tour.metaDescription || tour.description, tour.description);
  const url = `/tours/${tour.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url, languages: { ...languageAlternates(url), "x-default": localePath("en", url) } },
    robots: tour.listingStatus === "paused" ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url,
      siteName,
      locale: "en_US",
      type: "website",
      images: [{ url: tour.image, alt: tour.imageAlt || `${tour.title} in ${tour.destinationSlug === "marsa-alam" ? "Marsa Alam" : "Hurghada"}` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [tour.image],
    },
  };
}

export default async function TourPage({ params }: PageProps) {
  const { slug } = await params;
  const liveTours = await getLiveTours();
  const sourceTour = liveTours.find((item) => item.slug === slug) || tours.find((item) => item.slug === slug && item.listingStatus !== "unlisted");
  const tour = sourceTour ? localizeTour(sourceTour, "en") : undefined;

  if (!tour) {
    notFound();
  }

  return <TourPageShell tour={tour} relatedTourCandidates={liveTours.length ? liveTours : tours} />;
}
