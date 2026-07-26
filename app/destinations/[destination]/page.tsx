import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { destinations, getDestination } from "@/lib/destinations";
import { tourCategories } from "@/lib/tour-categories";
import { tours } from "@/data/tours";

type Props = { params: Promise<{ destination: string }> };

export function generateStaticParams() {
  return destinations.filter((destination) => destination.active).map((destination) => ({ destination: destination.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const destination = getDestination((await params).destination);
  if (!destination?.active) return {};
  return {
    title: `Things to do in ${destination.name}`,
    description: destination.tagline,
    alternates: { canonical: `/destinations/${destination.slug}` },
  };
}

export default async function DestinationPage({ params }: Props) {
  const destination = getDestination((await params).destination);
  if (!destination?.active) notFound();
  const destinationTours = tours.filter((tour) => (tour.destinationSlug || "hurghada") === destination.slug);
  return <main className="min-h-screen bg-slate-50 px-6 pb-20 pt-32 sm:px-8"><div className="mx-auto max-w-6xl"><p className="font-semibold uppercase tracking-[0.24em] text-cyan-700">{destination.country}</p><h1 className="mt-4 text-5xl font-black text-slate-950">Things to do in {destination.name}</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{destination.tagline}. Explore {destinationTours.length} bookable experiences with clear pricing and local support.</p><div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{tourCategories.map((category) => { const count = destinationTours.filter(category.matches).length; return count ? <Link key={category.slug} href={`/${destination.slug}/${category.slug}`} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-cyan-300"><p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-700">{category.eyebrow}</p><h2 className="mt-3 text-2xl font-black text-slate-900">{category.title}</h2><p className="mt-3 leading-7 text-slate-600">{category.description}</p><p className="mt-5 text-sm font-bold text-blue-700">{count} experience{count === 1 ? "" : "s"} →</p></Link> : null; })}</div></div></main>;
}
