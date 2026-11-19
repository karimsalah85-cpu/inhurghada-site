import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { destinations } from "@/lib/destinations";
import { getFreeGuide, liveFreeGuides } from "@/lib/free-guides";

type Props = { params: Promise<{ destination: string }> };

export function generateStaticParams() {
  return liveFreeGuides.map((guide) => ({ destination: guide.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guide = getFreeGuide((await params).destination);
  if (!guide) return {};
  const destination = destinations.find((item) => item.slug === guide.slug);
  return {
    title: `Your ${destination?.name ?? "Destination"} | Free Local Guide | DailyRedSea`,
    description: `Practical free travel tips, public places and simple day ideas for ${destination?.name ?? "your destination"}.`,
  };
}

function MapsLink({ query }: { query: string }) {
  return <a
    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`}
    rel="noopener noreferrer"
    target="_blank"
    className="inline-block text-sm font-semibold text-teal-700 underline underline-offset-4"
  >View in Google Maps ↗</a>;
}

export default async function YourDestinationGuide({ params }: Props) {
  const guide = getFreeGuide((await params).destination);
  if (!guide) notFound();
  const destination = destinations.find((item) => item.slug === guide.slug);
  if (!destination) notFound();

  return <main className="min-h-screen bg-surface-muted px-5 pb-20 pt-32 sm:px-8">
    <div className="mx-auto max-w-5xl">
      <Link href="/your-guide" className="text-sm font-semibold text-teal-700 underline underline-offset-4">← All free guides</Link>
      <p className="mt-7 text-sm font-semibold text-teal-700">DailyRedSea · Your {destination.name}</p>
      <h1 className="mt-2 text-4xl font-bold text-ink sm:text-5xl">Enjoy {destination.name}, your way.</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink/75">Free local knowledge, places to explore and easy day ideas. No registration or purchase needed.</p>

      <section className="mt-9 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-semibold text-ink">Know your area</h2>
        <p className="my-3 text-ink/75">{guide.areaHint}</p>
        <MapsLink query={`${destination.name} ${destination.country}`} />
      </section>

      <section className="mt-5 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-semibold text-ink">Local essentials</h2>
        <ul className="mt-4 list-disc space-y-3 pl-5 text-ink/75">
          {guide.essentials.map((tip) => <li key={tip}>{tip}</li>)}
        </ul>
      </section>

      <section className="mt-5 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-semibold text-ink">Free things to explore</h2>
        <p className="mt-2 text-sm text-ink/65">These are places to explore without buying an excursion. Access restrictions, transport and paid facilities may apply.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {guide.freePlaces.map((place) => <article key={place.title} className="rounded-2xl border border-line p-5">
            <h3 className="text-lg font-semibold text-ink">{place.title}</h3>
            <p className="mt-2 text-sm text-ink/75">{place.detail}</p>
            <p className="my-3 text-xs text-ink/60">{place.note}</p>
            <MapsLink query={place.mapsQuery} />
          </article>)}
        </div>
      </section>

      <section className="mt-5 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-semibold text-ink">Plan a simple day</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-ink/75">
          {guide.dayPlan.map((step) => <li key={step}>{step}</li>)}
        </ol>
      </section>

      <section className="mt-5 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-semibold text-ink">Useful links</h2>
        <div className="mt-4 flex flex-wrap gap-5">
          <MapsLink query={`${destination.name} ${destination.country}`} />
          <Link href={`/destinations/${guide.slug}`} className="text-sm font-semibold text-teal-700 underline underline-offset-4">Browse available experiences →</Link>
        </div>
        <p className="mt-4 text-sm text-ink/60">This is not an emergency service. In an emergency contact local emergency services or your accommodation directly.</p>
      </section>
      <p className="mt-7 text-sm text-ink/60">Please verify current opening hours, access rules and prices before travelling.</p>
    </div>
  </main>;
}
