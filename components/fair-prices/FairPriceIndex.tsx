import Link from "next/link";
import PriceChecker, { type PriceCheckerItem, type PriceCheckerTourPrice } from "@/components/fair-prices/PriceChecker";
import { getLiveTours } from "@/lib/live-content";
import { localePath, type Locale } from "@/lib/i18n";
import { localizeTour } from "@/lib/tour-localization";
import { absoluteUrl, siteName } from "@/lib/seo";
import {
  fairPriceCategoryIds,
  fairPriceItemsAt,
  fairPricesReviewedOn,
  formatFairAmount,
  formatFairRange,
  visaFeeHasIncreased,
  visaFeeUsd,
} from "@/lib/fair-prices";
import { fairPriceCopy, fillFairCopy, type FairPriceCopy } from "@/lib/fair-prices-i18n";

export const fairPricesPath = "/hurghada/fair-prices";

/** Items for `now` with this locale's wording, ready for the server list and the client checker. */
export function localizedFairPriceItems(locale: Locale, now: Date): PriceCheckerItem[] {
  const copy = fairPriceCopy[locale];
  const visaTip = visaFeeHasIncreased(now) ? copy.visaTip.afterIncrease : copy.visaTip.beforeIncrease;
  return fairPriceItemsAt(now).map((item) => ({
    ...item,
    ...copy.items[item.id],
    tip: item.id === "visa-on-arrival" ? visaTip : copy.items[item.id].tip,
  }));
}

export function fairPriceFaq(locale: Locale, now: Date) {
  const copy = fairPriceCopy[locale];
  const items = fairPriceItemsAt(now);
  const range = (id: string) => formatFairRange(items.find((item) => item.id === id)!, copy.intlLocale);
  const visaAnswer = visaFeeHasIncreased(now) ? copy.faqVisaAnswer.afterIncrease : copy.faqVisaAnswer.beforeIncrease;
  return [
    { question: copy.faqTaxiQuestion, answer: fillFairCopy(copy.faqTaxiAnswer, { uberRange: range("airport-uber-central"), taxiRange: range("airport-taxi-central") }) },
    { question: copy.faqVisaQuestion, answer: fillFairCopy(visaAnswer, { fee: formatFairAmount(visaFeeUsd(now), "USD", copy.intlLocale) }) },
    { question: copy.faqOrangeQuestion, answer: fillFairCopy(copy.faqOrangeAnswer, { orangeRange: range("orange-bay") }) },
  ];
}

async function loadTourPrices(locale: Locale, items: PriceCheckerItem[], copy: FairPriceCopy): Promise<Record<string, PriceCheckerTourPrice>> {
  const slugs = new Set(items.map((item) => item.tourSlug).filter(Boolean));
  try {
    const tours = await getLiveTours(locale);
    return Object.fromEntries(tours.filter((tour) => slugs.has(tour.slug) && tour.listingStatus !== "paused").flatMap((tour) => {
      const price = Number(tour.price);
      if (!Number.isFinite(price) || price <= 0) return [];
      const from = fillFairCopy(copy.tourFrom, { price: formatFairAmount(price, tour.currency === "EUR" ? "EUR" : "USD", copy.intlLocale) });
      const unit = copy.tourUnits[tour.priceUnit || "per person"];
      // Same localisation the tour pages use, so the link text matches the page it opens.
      const title = locale === "en" ? tour.title : localizeTour(tour, locale).title;
      return [[tour.slug, { slug: tour.slug, href: localePath(locale, `/tours/${tour.slug}`), title, label: unit ? `${from} ${unit}` : from }]];
    }));
  } catch (error) {
    console.error("Fair price index could not load live tour prices", error);
    return {};
  }
}

const linkClass = "font-bold text-ocean-dark underline decoration-ocean-soft underline-offset-4 hover:decoration-ocean-dark";

export default async function FairPriceIndex({ locale }: { locale: Locale }) {
  const copy = fairPriceCopy[locale];
  const now = new Date();
  const items = localizedFairPriceItems(locale, now);
  const faq = fairPriceFaq(locale, now);
  const tourPrices = await loadTourPrices(locale, items, copy);
  const pagePath = localePath(locale, fairPricesPath);
  const reviewedLabel = new Intl.DateTimeFormat(copy.intlLocale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${fairPricesReviewedOn}T00:00:00Z`));
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: copy.breadcrumbHome, item: absoluteUrl(localePath(locale, "/")) },
          { "@type": "ListItem", position: 2, name: copy.breadcrumbCurrent, item: absoluteUrl(pagePath) },
        ],
      },
      {
        "@type": "Article",
        headline: copy.metaTitle,
        description: copy.metaDescription,
        url: absoluteUrl(pagePath),
        inLanguage: locale,
        dateModified: fairPricesReviewedOn,
        author: { "@type": "Organization", name: siteName },
        publisher: { "@type": "Organization", name: siteName },
      },
      {
        "@type": "FAQPage",
        inLanguage: locale,
        mainEntity: faq.map((entry) => ({ "@type": "Question", name: entry.question, acceptedAnswer: { "@type": "Answer", text: entry.answer } })),
      },
    ],
  };

  return (
    <main className="bg-surface-muted pb-20" dir={locale === "ar" ? "rtl" : "ltr"} lang={locale}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <article className="mx-auto max-w-4xl px-6 py-16">
        <nav aria-label="Breadcrumb" className="text-sm text-muted">
          <Link href={localePath(locale, "/")}>{copy.breadcrumbHome}</Link>
          <span className="px-2">/</span>
          <span>{copy.breadcrumbCurrent}</span>
        </nav>

        <p className="mt-8 font-bold uppercase tracking-[0.28em] text-ocean-dark">{copy.eyebrow}</p>
        <h1 className="mt-4 text-4xl font-black text-ink sm:text-6xl">{copy.heading}</h1>
        <p className="mt-6 text-xl leading-9 text-ink">{copy.intro}</p>
        <p className="mt-3 text-sm text-muted">{fillFairCopy(copy.reviewed, { date: reviewedLabel })} {copy.disclaimer}</p>

        <PriceChecker items={items} copy={copy} tourPrices={tourPrices} />

        {fairPriceCategoryIds.map((category) => (
          <section key={category} className="mt-10 rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-7">
            <h2 className="text-3xl font-black text-ink">{copy.categories[category]}</h2>
            <ul className="mt-5 divide-y divide-line">
              {items.filter((item) => item.category === category).map((item) => {
                const tour = item.tourSlug ? tourPrices[item.tourSlug] : undefined;
                const ripoff = item.fixed
                  ? fillFairCopy(copy.ripoffFixed, { amount: formatFairAmount(item.fairMax, item.currency, copy.intlLocale) })
                  : fillFairCopy(copy.ripoffOver, { amount: formatFairAmount(item.ripoffAbove, item.currency, copy.intlLocale) });
                return (
                  <li key={item.id} className="py-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <h3 className="text-lg font-bold text-ink">{item.name}</h3>
                      <p className="text-lg font-black text-ocean-dark">{formatFairRange(item, copy.intlLocale)} <span className="text-sm font-normal text-muted">{item.unit}</span></p>
                    </div>
                    <p className="mt-1 text-sm text-red-800">{ripoff}</p>
                    <p className="mt-2 leading-7 text-ink">{item.tip}</p>
                    {tour ? <p className="mt-2 text-sm"><Link className={linkClass} href={tour.href}>{fillFairCopy(copy.ourTour, { title: tour.title, label: tour.label })}</Link></p> : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        <section className="mt-10 rounded-3xl border border-ocean-soft bg-ocean-tint p-7">
          <h2 className="text-3xl font-black text-ink">{copy.habitsTitle}</h2>
          <ul className="mt-5 list-disc space-y-3 ps-6 leading-7 text-ink">
            {copy.habits.map((habit) => <li key={habit}>{habit}</li>)}
          </ul>
        </section>

        <section className="mt-10 rounded-3xl border border-line bg-white p-7 shadow-sm">
          <h2 className="text-3xl font-black text-ink">{copy.faqTitle}</h2>
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
          <h2 className="text-3xl font-black">{copy.ctaTitle}</h2>
          <p className="mt-4 max-w-2xl leading-8 text-line">{copy.ctaText}</p>
          <Link href={localePath(locale, "/tours")} className="mt-6 inline-flex rounded-full bg-ocean px-6 py-3 font-bold text-white">{copy.ctaButton}</Link>
        </section>
      </article>
    </main>
  );
}
