import type { Metadata } from "next";
import Link from "next/link";
import PriceChecker, { type PriceCheckerTourPrice } from "@/components/fair-prices/PriceChecker";
import { getLiveTours } from "@/lib/live-content";
import { absoluteUrl, pageMetadata, siteName } from "@/lib/seo";
import {
  fairPriceCategories,
  fairPriceItems,
  fairPricesReviewedOn,
  formatFairAmount,
  formatFairRange,
} from "@/lib/fair-prices";

const path = "/hurghada/fair-prices";
const title = "Hurghada Fair Price Index 2026 — What Things Should Cost";
const description = "Fair 2026 prices for Hurghada: airport taxis, visa, SIM cards, Orange Bay, snorkeling, safaris, diving and drinks — plus a free tool to check any price you’re quoted.";

export const metadata: Metadata = pageMetadata({ title, description, path });

const reviewedLabel = new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${fairPricesReviewedOn}T00:00:00Z`));

function ripoffLabel(item: (typeof fairPriceItems)[number]) {
  return item.fixed ? `More than ${formatFairAmount(item.fairMax, item.currency)}` : `Over ${formatFairAmount(item.ripoffAbove, item.currency)}`;
}

const faq = [
  { question: "How much is a taxi from Hurghada airport to my hotel?", answer: `To central Hurghada, Uber or Careem usually costs ${formatFairRange(fairPriceItems.find((item) => item.id === "airport-uber-central")!)} and a taxi or private car ${formatFairRange(fairPriceItems.find((item) => item.id === "airport-taxi-central")!)} per car. Always agree the total before you get in.` },
  { question: "How much is the Egypt visa on arrival?", answer: "The single-entry visa on arrival costs $30, paid in cash at the bank counter before passport control. The online e-visa costs $25." },
  { question: "How much should an Orange Bay trip cost?", answer: `A shared Orange Bay boat trip with lunch usually costs ${formatFairRange(fairPriceItems.find((item) => item.id === "orange-bay")!)} per adult, plus a national park fee of about $5 paid in cash.` },
];

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Hurghada fair price index", item: absoluteUrl(path) },
      ],
    },
    {
      "@type": "Article",
      headline: title,
      description,
      url: absoluteUrl(path),
      inLanguage: "en",
      dateModified: fairPricesReviewedOn,
      author: { "@type": "Organization", name: siteName },
      publisher: { "@type": "Organization", name: siteName },
    },
    {
      "@type": "FAQPage",
      mainEntity: faq.map((entry) => ({ "@type": "Question", name: entry.question, acceptedAnswer: { "@type": "Answer", text: entry.answer } })),
    },
  ],
};

async function loadTourPrices(): Promise<Record<string, PriceCheckerTourPrice>> {
  const slugs = new Set(fairPriceItems.map((item) => item.tourSlug).filter(Boolean));
  try {
    const tours = await getLiveTours("en");
    return Object.fromEntries(tours.filter((tour) => slugs.has(tour.slug) && tour.listingStatus !== "paused").flatMap((tour) => {
      const price = Number(tour.price);
      if (!Number.isFinite(price) || price <= 0) return [];
      const unit = tour.priceUnit || "per person";
      return [[tour.slug, { slug: tour.slug, title: tour.title, label: `from ${formatFairAmount(price, tour.currency === "EUR" ? "EUR" : "USD")} ${unit}` }]];
    }));
  } catch (error) {
    console.error("Fair price index could not load live tour prices", error);
    return {};
  }
}

const linkClass = "font-bold text-ocean-dark underline decoration-ocean-soft underline-offset-4 hover:decoration-ocean-dark";

export default async function FairPriceIndexPage() {
  const tourPrices = await loadTourPrices();

  return (
    <main className="bg-surface-muted pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <article className="mx-auto max-w-4xl px-6 py-16">
        <nav aria-label="Breadcrumb" className="text-sm text-muted">
          <Link href="/">Home</Link>
          <span className="px-2">/</span>
          <span>Fair price index</span>
        </nav>

        <p className="mt-8 font-bold uppercase tracking-[0.28em] text-ocean-dark">Don’t overpay · Hurghada</p>
        <h1 className="mt-4 text-4xl font-black text-ink sm:text-6xl">Hurghada Fair Price Index</h1>
        <p className="mt-6 text-xl leading-9 text-ink">
          What things really cost in Hurghada in 2026 — from the airport taxi to an Orange Bay trip — so you can enjoy your holiday without being overcharged. Prices are checked by our local team.
        </p>
        <p className="mt-3 text-sm text-muted">Last reviewed {reviewedLabel}. Prices change; ranges are a guide, not an official tariff.</p>

        <PriceChecker tourPrices={tourPrices} />

        {fairPriceCategories.map((category) => (
          <section key={category.id} className="mt-10 rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-7">
            <h2 className="text-3xl font-black text-ink">{category.label}</h2>
            <ul className="mt-5 divide-y divide-line">
              {fairPriceItems.filter((item) => item.category === category.id).map((item) => {
                const tour = item.tourSlug ? tourPrices[item.tourSlug] : undefined;
                return (
                  <li key={item.id} className="py-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <h3 className="text-lg font-bold text-ink">{item.name}</h3>
                      <p className="text-lg font-black text-ocean-dark">{formatFairRange(item)} <span className="text-sm font-normal text-muted">{item.unit}</span></p>
                    </div>
                    <p className="mt-1 text-sm text-red-800">Rip-off: {ripoffLabel(item)}</p>
                    <p className="mt-2 leading-7 text-ink">{item.tip}</p>
                    {tour ? <p className="mt-2 text-sm"><Link className={linkClass} href={`/tours/${tour.slug}`}>Daily Red Sea: {tour.title} — {tour.label}</Link></p> : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        <section className="mt-10 rounded-3xl border border-ocean-soft bg-ocean-tint p-7">
          <h2 className="text-3xl font-black text-ink">Five habits that stop overcharging</h2>
          <ul className="mt-5 list-disc space-y-3 pl-6 leading-7 text-ink">
            <li>Agree the total price, the currency and “per car or per person” before anything starts.</li>
            <li>Carry small Egyptian pound notes — “no change” is a common way to keep the difference.</li>
            <li>Use Uber or Careem when you can; the app shows the fare up front.</li>
            <li>Ask what’s included: pickup, lunch, equipment, park fees and entry tickets.</li>
            <li>It’s fine to say no and walk away. A fair seller won’t chase you.</li>
          </ul>
        </section>

        <section className="mt-10 rounded-3xl border border-line bg-white p-7 shadow-sm">
          <h2 className="text-3xl font-black text-ink">Common questions</h2>
          <dl className="mt-5 space-y-6">
            {faq.map((entry) => (
              <div key={entry.question}>
                <dt className="font-bold text-ink">{entry.question}</dt>
                <dd className="mt-2 leading-7 text-ink">{entry.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-12 rounded-3xl bg-ink p-8 text-white">
          <h2 className="text-3xl font-black">Fixed prices, no haggling</h2>
          <p className="mt-4 max-w-2xl leading-8 text-line">Every Daily Red Sea trip shows the full price up front, with hotel pickup and what’s included listed clearly — and many trips can be paid in cash on the day.</p>
          <Link href="/tours" className="mt-6 inline-flex rounded-full bg-ocean px-6 py-3 font-bold text-white">Browse all trips →</Link>
        </section>
      </article>
    </main>
  );
}
