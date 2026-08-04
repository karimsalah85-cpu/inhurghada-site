import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { destinations, getDestination } from "@/lib/destinations";
import { tourCategories } from "@/lib/tour-categories";
import { getLiveTours } from "@/lib/live-content";

type Props = { params: Promise<{ destination: string }> };

export function generateStaticParams() {
  return destinations.map((destination) => ({ destination: destination.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const destination = getDestination((await params).destination);
  if (!destination) return {};
  return {
    title: destination.comingSoon ? `${destination.name} tours — coming soon` : `Things to do in ${destination.name}`,
    description: destination.tagline,
    alternates: { canonical: `/destinations/${destination.slug}` },
  };
}

export default async function DestinationPage({ params }: Props) {
  const destination = getDestination((await params).destination);
  if (!destination) notFound();

  if (destination.comingSoon) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 pb-20 pt-32 sm:px-8">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="relative min-h-[28rem] overflow-hidden px-7 py-14 sm:px-12">
            <Image src={destination.image} alt={`Red Sea near ${destination.name}`} fill sizes="100vw" priority className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-950/30" />
            <div className="relative max-w-2xl text-white">
              <span className="inline-flex rounded-full border border-cyan-300/40 bg-cyan-300/15 px-4 py-2 text-sm font-bold uppercase tracking-[0.2em] text-cyan-100">Coming soon</span>
              <p className="mt-8 font-semibold uppercase tracking-[0.24em] text-cyan-200">{destination.country}</p>
              <h1 className="mt-4 text-5xl font-black sm:text-6xl">{destination.name}</h1>
              <p className="mt-5 text-lg leading-8 text-slate-200">{destination.tagline}. We are preparing a separate collection of locally verified Marsa Alam experiences.</p>
              <p className="mt-4 leading-7 text-slate-300">Marsa Alam trips will have their own prices, schedules, pickup areas, availability, and booking conditions. They will not be mixed with Hurghada tours.</p>
              <Link href="/destinations/hurghada" className="mt-8 inline-flex rounded-full bg-white px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-50">Explore Hurghada now</Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const tours = await getLiveTours();
  const destinationTours = tours.filter((tour) => (tour.destinationSlug || "hurghada") === destination.slug);
  return <main className="min-h-screen bg-slate-50 px-6 pb-20 pt-32 sm:px-8"><div className="mx-auto max-w-6xl"><p className="font-semibold uppercase tracking-[0.24em] text-cyan-700">{destination.country}</p><h1 className="mt-4 text-5xl font-black text-slate-950">Things to do in {destination.name}</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{destination.tagline}. Explore {destinationTours.length} bookable experiences with clear pricing and local support.</p><div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{tourCategories.map((category) => { const count = destinationTours.filter(category.matches).length; return count ? <Link key={category.slug} href={`/${destination.slug}/${category.slug}`} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-cyan-300"><p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-700">{category.eyebrow}</p><h2 className="mt-3 text-2xl font-black text-slate-900">{category.title}</h2><p className="mt-3 leading-7 text-slate-600">{category.description}</p><p className="mt-5 text-sm font-bold text-blue-700">{count} experience{count === 1 ? "" : "s"} →</p></Link> : null; })}</div></div></main>;
}
