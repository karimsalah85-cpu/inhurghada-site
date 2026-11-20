import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { destinations } from "@/lib/destinations";
import { liveFreeGuides } from "@/lib/free-guides";
import { getLocalizedFreeGuide } from "@/lib/free-guide-localized";
import { freeGuideUi } from "@/lib/free-guide-ui";
import { localePath, type Locale } from "@/lib/i18n";

function MapsLink({ query, label }: { query: string; label: string }) {
  return <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`}
    target="_blank" rel="noopener noreferrer"
    className="inline-block text-sm font-semibold text-teal-700 underline underline-offset-4">{label} ↗</a>;
}

export function FreeGuideHub({ locale }: { locale: Locale }) {
  const t = freeGuideUi[locale];
  return <main lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-surface-muted px-5 pb-20 pt-32 sm:px-8">
    <div className="mx-auto max-w-6xl">
      <p className="text-sm font-semibold text-teal-700">DailyRedSea · {t.eyebrow}</p>
      <h1 className="mt-2 text-4xl font-bold text-ink sm:text-5xl">{t.hubTitle}</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink/75">{t.hubIntro}</p>
      <div className="mt-9 grid gap-5 sm:grid-cols-2">
        {liveFreeGuides.map((guide) => {
          const destination = destinations.find((item) => item.slug === guide.slug);
          if (!destination) return null;
          return <Link key={guide.slug} href={localePath(locale, `/your-guide/${guide.slug}`)}
            className="group overflow-hidden rounded-3xl border border-line bg-white shadow-sm hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">
            <div className="relative h-48">
              <Image src={destination.image} alt={destination.name} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" />
            </div>
            <div className="p-5">
              <p className="text-xs font-semibold text-teal-700">{destination.country}</p>
              <h2 className="mt-1 text-2xl font-semibold text-ink">{destination.name}</h2>
              <p className="mt-2 text-sm text-ink/70">{t.cardSummary}</p>
            </div>
          </Link>;
        })}
      </div>
      <p className="mt-8 text-sm text-ink/60">{t.hubDisclaimer}</p>
    </div>
  </main>;
}

export function FreeGuideDestination({ locale, slug }: { locale: Locale; slug: string }) {
  const guide = getLocalizedFreeGuide(slug, locale);
  if (!guide) notFound();
  const destination = destinations.find((item) => item.slug === guide.slug);
  if (!destination) notFound();
  const t = freeGuideUi[locale];
  return <main lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-surface-muted px-5 pb-20 pt-32 sm:px-8">
    <div className="mx-auto max-w-5xl">
      <Link href={localePath(locale, "/your-guide")} className="text-sm font-semibold text-teal-700 underline underline-offset-4">{locale === "ar" ? "→" : "←"} {t.back}</Link>
      <p className="mt-7 text-sm font-semibold text-teal-700">DailyRedSea · {destination.name}</p>
      <h1 className="mt-2 text-4xl font-bold text-ink sm:text-5xl">{t.destinationTitle.replace("{destination}", destination.name)}</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink/75">{t.destinationIntro}</p>
      <section className="mt-9 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-semibold text-ink">{t.areaTitle}</h2>
        <p className="my-3 text-ink/75">{guide.areaHint}</p>
        <MapsLink query={`${destination.name} ${destination.country}`} label={t.maps} />
      </section>
      <section className="mt-5 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-semibold text-ink">{t.essentialsTitle}</h2>
        <ul className="mt-4 list-disc space-y-3 ps-5 text-ink/75">{guide.essentials.map((tip) => <li key={tip}>{tip}</li>)}</ul>
      </section>
      <section className="mt-5 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-semibold text-ink">{t.placesTitle}</h2>
        <p className="mt-2 text-sm text-ink/65">{t.placesDisclaimer}</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">{guide.freePlaces.map((place) => <article key={place.mapsQuery} className="rounded-2xl border border-line p-5">
          <h3 className="text-lg font-semibold text-ink">{place.title}</h3>
          <p className="mt-2 text-sm text-ink/75">{place.detail}</p>
          <p className="my-3 text-xs text-ink/60">{place.note}</p>
          <MapsLink query={place.mapsQuery} label={t.maps} />
        </article>)}</div>
      </section>
      <section className="mt-5 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-semibold text-ink">{t.dayTitle}</h2>
        <ol className="mt-4 list-decimal space-y-3 ps-5 text-ink/75">{guide.dayPlan.map((step) => <li key={step}>{step}</li>)}</ol>
      </section>
      <section className="mt-5 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-semibold text-ink">{t.linksTitle}</h2>
        <div className="mt-4 flex flex-wrap gap-5">
          <MapsLink query={`${destination.name} ${destination.country}`} label={t.maps} />
          <Link href={localePath(locale, `/destinations/${guide.slug}`)} className="text-sm font-semibold text-teal-700 underline underline-offset-4">{t.browse} ↗</Link>
        </div>
        <p className="mt-4 text-sm text-ink/60">{t.emergency}</p>
      </section>
      <p className="mt-7 text-sm text-ink/60">{t.finalDisclaimer}</p>
    </div>
  </main>;
}
