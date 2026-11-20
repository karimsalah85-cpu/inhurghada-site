import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FreeGuideDestination } from "@/components/pages/FreeGuides";
import { liveFreeGuides } from "@/lib/free-guides";
import { destinations } from "@/lib/destinations";
import { freeGuideUi } from "@/lib/free-guide-ui";
import { languageAlternates } from "@/lib/i18n";

type Props = { params: Promise<{ destination: string }> };
export function generateStaticParams() {
  return liveFreeGuides.map((guide) => ({ destination: guide.slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { destination: slug } = await params;
  const destination = destinations.find((item) => item.slug === slug);
  if (!destination || !liveFreeGuides.some((guide) => guide.slug === slug)) notFound();
  const path = `/your-guide/${slug}`;
  return {
    title: `${destination.name} | ${freeGuideUi.en.metaTitle} | DailyRedSea`,
    description: freeGuideUi.en.metaDescription,
    alternates: { canonical: path, languages: { ...languageAlternates(path), "x-default": path } },
  };
}
export default async function YourGuidePage({ params }: Props) {
  return <FreeGuideDestination locale="en" slug={(await params).destination} />;
}
