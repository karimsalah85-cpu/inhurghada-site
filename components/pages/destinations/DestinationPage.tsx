import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { destinations, getDestination, type Destination } from "@/lib/destinations";
import { getLiveTours } from "@/lib/live-content";
import { absoluteUrl, normalizeMetaDescription, normalizeMetaTitle, siteName } from "@/lib/seo";
import { tourCategories } from "@/lib/tour-categories";
import CategoryTourExplorer from "@/components/categories/CategoryTourExplorer";
import { languageAlternates, localeOg, localePath, type Locale } from "@/lib/i18n";
import { marsaAlamCopy, destinationCopyByLocale, type DestinationCopy } from "@/lib/destination-i18n";
import { localizeTour } from "@/lib/tour-localization";

/** Any destination without translated copy in destinationCopyByLocale renders its own (English-only) SEO fields. */
function fallbackDestinationCopy(destination: Destination): DestinationCopy {
  return { ...marsaAlamCopy.en, title: destination.seo.title, description: destination.seo.description, eyebrow: `${destination.country} · ${destination.region}`, heading: destination.seo.title, bookable: `Bookable ${destination.name} experiences`, imageAlt: destination.seo.title };
}

type Props = { params: Promise<{ destination: string }> };

export function generateStaticParams() {
  return destinations.map((destination) => ({ destination: destination.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale: Locale = "en";
  const destination = getDestination((await params).destination);
  if (!destination) return {};
  const basePath = `/destinations/${destination.slug}`;
  const path = localePath(locale, basePath);
  const copy = destinationCopyByLocale[destination.slug]?.[locale];
  const title = normalizeMetaTitle(destination.status === "coming-soon" ? `${destination.name} tours — coming soon` : copy?.title || destination.seo.title, locale);
  const description = normalizeMetaDescription(copy?.description || destination.seo.description, destination.seo.description, locale);
  return {
    title,
    description,
    alternates: { canonical: path, languages: { ...languageAlternates(basePath), "x-default": localePath("en", basePath) } },
    robots: destination.status === "coming-soon" ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: { title, description, url: absoluteUrl(path), siteName, locale: localeOg[locale], type: "website", images: [{ url: absoluteUrl(destination.seo.ogImage), alt: copy?.imageAlt || destination.name }] },
    twitter: { card: "summary_large_image", title, description, images: [absoluteUrl(destination.seo.ogImage)] },
  };
}

export async function DestinationPage({ params, locale = "en" }: Props & { locale?: Locale }) {
  const destination = getDestination((await params).destination);
  if (!destination) notFound();

  if (destination.status === "coming-soon") {
    return <main className="min-h-screen bg-surface-muted px-6 pb-20 pt-32 sm:px-8"><div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-line bg-white shadow-sm"><div className="relative min-h-[28rem] overflow-hidden px-7 py-14 sm:px-12"><Image src={destination.image} alt={`Red Sea near ${destination.name}`} fill sizes="100vw" priority className="object-cover"/><div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/70 to-ink/30"/><div className="relative max-w-2xl text-white"><span className="inline-flex rounded-full border border-ocean-soft/40 bg-ocean-soft/15 px-4 py-2 text-sm font-bold uppercase tracking-[0.2em] text-ocean-tint">Coming soon</span><p className="mt-8 font-semibold uppercase tracking-[0.24em] text-ocean-soft">{destination.country}</p><h1 className="mt-4 text-5xl font-black sm:text-6xl">{destination.name}</h1><p className="mt-5 text-lg leading-8 text-line">{destination.longDescription}</p><p className="mt-4 leading-7 text-line">Trips will have destination-specific prices, schedules, pickup areas, availability and booking conditions.</p><Link href="/destinations/hurghada" className="mt-8 inline-flex rounded-full bg-white px-6 py-3 font-bold text-ink">Explore Hurghada now</Link></div></div></div></main>;
  }

  const tours = await getLiveTours();
  const destinationTours = tours.filter((tour) => tour.destinationSlug === destination.slug && tour.listingStatus !== "paused" && tour.listingStatus !== "unlisted").map((tour) => localizeTour(tour, locale));
  const categories = tourCategories.filter((category) => category.slug !== "excursions" && destinationTours.some(category.matches));
  const otherDestinations = destinations.filter((item) => item.slug !== destination.slug && item.status === "live");
  const copy = destinationCopyByLocale[destination.slug]?.[locale] ?? fallbackDestinationCopy(destination);
  const pageUrl = absoluteUrl(localePath(locale, `/destinations/${destination.slug}`));
  const schema = { "@context": "https://schema.org", "@type": "TouristDestination", "@id": `${pageUrl}#destination`, name: destination.name, description: copy.description, url: pageUrl, image: absoluteUrl(destination.image), inLanguage: locale, geo: { "@type": "GeoCoordinates", latitude: destination.coordinates.latitude, longitude: destination.coordinates.longitude }, containedInPlace: { "@type": "AdministrativeArea", name: copy.eyebrow } };

  return <main dir={locale === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-surface-muted pb-20 pt-24"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}/><section className="relative overflow-hidden px-6 py-20 text-white sm:px-8"><Image src={destination.image} alt={copy.imageAlt} fill sizes="100vw" priority className="object-cover"/><div className="absolute inset-0 bg-ink/70"/><div className="relative mx-auto max-w-7xl"><p className="font-semibold uppercase tracking-[0.24em] text-ocean-soft">{copy.eyebrow}</p><h1 className="mt-4 text-5xl font-black sm:text-6xl">{copy.heading}</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-line">{copy.description}</p></div></section><div className="mx-auto max-w-7xl px-6 sm:px-8">{categories.length ? <section className="py-14"><h2 className="text-3xl font-black text-ink">{copy.categories}</h2><div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{categories.map((category) => <Link key={category.slug} href={localePath(locale, `/${destination.slug}/${category.slug}`)} className="rounded-3xl border border-line bg-white p-6 shadow-sm transition hover:border-ocean"><p className="text-sm font-bold uppercase tracking-[0.2em] text-ocean-dark">{category.eyebrow}</p><h3 className="mt-3 text-2xl font-black text-ink">{category.title}</h3><p className="mt-3 text-muted">{destinationTours.filter(category.matches).length} {copy.experiences}</p></Link>)}</div></section> : null}<section className="py-8"><h2 className="text-3xl font-black text-ink">{copy.bookable}</h2><p className="mt-3 text-muted">{copy.trips(destinationTours.length)}</p><div className="mt-8"><CategoryTourExplorer tours={destinationTours} locale={locale}/></div></section>{otherDestinations.length ? <section className="mt-12 rounded-[2rem] bg-ink p-8 text-white"><p className="font-bold uppercase tracking-[0.2em] text-ocean-soft">{copy.otherDestinations}</p><div className="mt-5 flex flex-wrap gap-3">{otherDestinations.map((item) => <Link key={item.slug} href={localePath(locale, `/destinations/${item.slug}`)} className="rounded-full bg-white px-5 py-3 font-bold text-ink">{item.name} →</Link>)}</div></section> : null}</div></main>;
}

export default function Page(props: Props) {
  return <DestinationPage {...props} />;
}
