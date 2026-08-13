import Link from "next/link";
import { notFound } from "next/navigation";
import CategoryTourExplorer from "@/components/categories/CategoryTourExplorer";
import { getDestination } from "@/lib/destinations";
import { getLiveTours } from "@/lib/live-content";
import { getTourCategory } from "@/lib/tour-categories";

export default async function DestinationCategoryPage({ destinationSlug, categorySlug }: { destinationSlug: string; categorySlug: string }) {
  const destination = getDestination(destinationSlug);
  const category = getTourCategory(categorySlug);
  if (!destination || destination.status !== "live" || !category) notFound();
  const tours = (await getLiveTours()).filter((tour) => tour.destinationSlug === destination.slug && tour.listingStatus !== "paused" && tour.listingStatus !== "unlisted" && category.matches(tour));
  if (!tours.length) notFound();
  return <main className="min-h-screen bg-slate-50"><section className="bg-slate-950 px-6 pb-20 pt-32 text-white sm:px-8"><div className="mx-auto max-w-6xl"><nav aria-label="Breadcrumb" className="text-sm text-slate-400"><Link href="/">Home</Link><span className="px-2">/</span><Link href={`/destinations/${destination.slug}`}>{destination.name}</Link><span className="px-2">/</span><span className="text-white">{category.title}</span></nav><p className="mt-10 font-semibold uppercase tracking-[0.28em] text-cyan-300">{destination.name} experiences</p><h1 className="mt-4 text-4xl font-black sm:text-6xl">{category.title} in {destination.name}</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">Compare {category.title.toLowerCase()} with clear pricing, schedules, pickup details and direct booking support.</p></div></section><section className="mx-auto max-w-7xl px-6 py-16 sm:px-8"><CategoryTourExplorer tours={tours}/><Link href={`/destinations/${destination.slug}`} className="mt-12 inline-flex rounded-full bg-cyan-700 px-6 py-3 font-bold text-white">Explore all {destination.name} tours →</Link></section></main>;
}
