import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CategoryTourExplorer from "@/components/categories/CategoryTourExplorer";
import { tours } from "@/data/tours";
import { categoryLabels, getTourCategory, tourCategories } from "@/lib/tour-categories";
import { absoluteUrl, siteName } from "@/lib/seo";
import { languageAlternates, localePath } from "@/lib/i18n";
import { localizeTourGerman } from "@/lib/tour-localization";

type PageProps = { params: Promise<{ category: string }> };

export function generateStaticParams() {
  return tourCategories.map(({ slug }) => ({ category: slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const category = getTourCategory((await params).category);
  if (!category) return {};
  const path = `/hurghada/${category.slug}`;
  const title = `${category.title} in Hurghada`;
  return {
    title,
    description: category.description,
    alternates: { canonical: path, languages: { ...languageAlternates(path), "x-default": localePath("en", path) } },
    openGraph: { title, description: category.description, url: path, siteName, type: "website" },
  };
}

export default async function TourCategoryPage({ params, locale = "en" }: PageProps & { locale?: "en" | "de" }) {
  const category = getTourCategory((await params).category);
  if (!category) notFound();
  const de = locale === "de";
  const categoryTours = tours.filter(category.matches).map((tour) => de ? localizeTourGerman(tour) : tour);
  const displayTitle = categoryLabels[locale][category.slug];
  const pageUrl = absoluteUrl(`/hurghada/${category.slug}`);
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${category.title} in Hurghada`,
    url: pageUrl,
    numberOfItems: categoryTours.length,
    itemListElement: categoryTours.map((tour, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/tours/${tour.slug}`),
      name: tour.title,
    })),
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <section className="bg-slate-950 px-6 pb-20 pt-32 text-white sm:px-8">
        <div className="mx-auto max-w-6xl">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-400"><Link href={localePath(locale)} className="hover:text-white">{de ? "Startseite" : "Home"}</Link><span className="px-2">/</span><span>Hurghada</span><span className="px-2">/</span><span className="text-white">{displayTitle}</span></nav>
          <p className="mt-10 font-semibold uppercase tracking-[0.28em] text-cyan-300">{category.eyebrow}</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black sm:text-6xl">{displayTitle} {de ? "in Hurghada" : "in Hurghada"}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{de ? "Entdecke passende Ausflüge Hurghada mit transparenten Preisen, klaren Leistungen und direkter Bestätigung." : category.description}</p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm font-bold"><span className="rounded-full bg-white/10 px-4 py-2">{de ? "Klare lokale Preise" : "Clear local prices"}</span><span className="rounded-full bg-white/10 px-4 py-2">{de ? "Bestätigung per WhatsApp" : "WhatsApp confirmation"}</span><span className="rounded-full bg-white/10 px-4 py-2">{de ? "Barzahlung bei Ankunft" : "Cash on arrival"}</span></div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8">
        <CategoryTourExplorer tours={categoryTours} locale={locale} />
      </section>
      <section className="border-t border-slate-200 bg-white px-6 py-16 sm:px-8"><div className="mx-auto max-w-4xl"><h2 className="text-3xl font-black text-slate-950">{de ? "Mit klaren Informationen buchen" : "Book with clear information"}</h2><p className="mt-4 leading-8 text-slate-600">{de ? "Jeder Ausflug zeigt Startpreis, Dauer, Abholung, enthaltene Leistungen und wichtige Hinweise vor der Buchung. Unser Team bestätigt die endgültigen Details direkt per WhatsApp." : "Every Daily Red Sea experience shows its starting price, duration, pickup information, inclusions, and practical notes before you submit a booking. Our local team confirms final pickup details directly on WhatsApp."}</p></div></section>
    </main>
  );
}
