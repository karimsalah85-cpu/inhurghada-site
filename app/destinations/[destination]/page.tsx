import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { destinations, getDestination } from "@/lib/destinations";
import { getLiveTours } from "@/lib/live-content";
import { absoluteUrl, normalizeMetaDescription, normalizeMetaTitle, siteName } from "@/lib/seo";
import { tourCategories } from "@/lib/tour-categories";
import CategoryTourExplorer from "@/components/categories/CategoryTourExplorer";

type Props = { params: Promise<{ destination: string }> };

export function generateStaticParams() {
  return destinations.map((destination) => ({ destination: destination.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const destination = getDestination((await params).destination);
  if (!destination) return {};
  const path = `/destinations/${destination.slug}`;
  const title = normalizeMetaTitle(destination.status === "coming-soon" ? `${destination.name} tours — coming soon` : destination.seo.title);
  const description = normalizeMetaDescription(destination.seo.description);
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: destination.status === "coming-soon" ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: { title, description, url: absoluteUrl(path), siteName, type: "website", images: [{ url: absoluteUrl(destination.seo.ogImage), alt: destination.name }] },
    twitter: { card: "summary_large_image", title, description, images: [absoluteUrl(destination.seo.ogImage)] },
  };
}

export default async function DestinationPage({ params }: Props) {
  const destination = getDestination((await params).destination);
  if (!destination) notFound();

  if (destination.status === "coming-soon") {
    return <main className="min-h-screen bg-slate-50 px-6 pb-20 pt-32 sm:px-8"><div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm"><div className="relative min-h-[28rem] overflow-hidden px-7 py-14 sm:px-12"><Image src={destination.image} alt={`Red Sea near ${destination.name}`} fill sizes="100vw" priority className="object-cover"/><div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-950/30"/><div className="relative max-w-2xl text-white"><span className="inline-flex rounded-full border border-cyan-300/40 bg-cyan-300/15 px-4 py-2 text-sm font-bold uppercase tracking-[0.2em] text-cyan-100">Coming soon</span><p className="mt-8 font-semibold uppercase tracking-[0.24em] text-cyan-200">{destination.country}</p><h1 className="mt-4 text-5xl font-black sm:text-6xl">{destination.name}</h1><p className="mt-5 text-lg leading-8 text-slate-200">{destination.longDescription}</p><p className="mt-4 leading-7 text-slate-300">Trips will have destination-specific prices, schedules, pickup areas, availability and booking conditions.</p><Link href="/destinations/hurghada" className="mt-8 inline-flex rounded-full bg-white px-6 py-3 font-bold text-slate-950">Explore Hurghada now</Link></div></div></div></main>;
  }

  const tours = await getLiveTours();
  const destinationTours = tours.filter((tour) => tour.destinationSlug === destination.slug && tour.listingStatus !== "paused" && tour.listingStatus !== "unlisted");
  const categories = tourCategories.filter((category) => category.slug !== "excursions" && destinationTours.some(category.matches));
  const otherDestinations = destinations.filter((item) => item.slug !== destination.slug && item.status === "live");
  const pageUrl = absoluteUrl(`/destinations/${destination.slug}`);
  const schema = { "@context": "https://schema.org", "@type": "TouristDestination", "@id": `${pageUrl}#destination`, name: destination.name, description: destination.longDescription, url: pageUrl, image: absoluteUrl(destination.image), geo: { "@type": "GeoCoordinates", latitude: destination.coordinates.latitude, longitude: destination.coordinates.longitude }, containedInPlace: { "@type": "AdministrativeArea", name: `${destination.region}, ${destination.country}` } };

  return <main className="min-h-screen bg-slate-50 pb-20 pt-24"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}/><section className="relative overflow-hidden px-6 py-20 text-white sm:px-8"><Image src={destination.image} alt={`${destination.name}, ${destination.country}`} fill sizes="100vw" priority className="object-cover"/><div className="absolute inset-0 bg-slate-950/70"/><div className="relative mx-auto max-w-7xl"><p className="font-semibold uppercase tracking-[0.24em] text-cyan-300">{destination.country} · {destination.region}</p><h1 className="mt-4 text-5xl font-black sm:text-6xl">Things to do in {destination.name}</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-slate-200">{destination.longDescription}</p></div></section><div className="mx-auto max-w-7xl px-6 sm:px-8">{categories.length ? <section className="py-14"><h2 className="text-3xl font-black text-slate-950">Explore by category</h2><div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{categories.map((category) => <Link key={category.slug} href={`/${destination.slug}/${category.slug}`} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-cyan-400"><p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-700">{category.eyebrow}</p><h3 className="mt-3 text-2xl font-black text-slate-950">{category.title}</h3><p className="mt-3 text-slate-600">{destinationTours.filter(category.matches).length} experiences</p></Link>)}</div></section> : null}<section className="py-8"><h2 className="text-3xl font-black text-slate-950">Bookable {destination.name} experiences</h2><p className="mt-3 text-slate-600">{destinationTours.length} trips with destination-specific pricing, schedules and pickup information.</p><div className="mt-8"><CategoryTourExplorer tours={destinationTours}/></div></section>{otherDestinations.length ? <section className="mt-12 rounded-[2rem] bg-slate-950 p-8 text-white"><p className="font-bold uppercase tracking-[0.2em] text-cyan-300">Explore other Red Sea destinations</p><div className="mt-5 flex flex-wrap gap-3">{otherDestinations.map((item) => <Link key={item.slug} href={`/destinations/${item.slug}`} className="rounded-full bg-white px-5 py-3 font-bold text-slate-950">{item.name} →</Link>)}</div></section> : null}</div></main>;
}
