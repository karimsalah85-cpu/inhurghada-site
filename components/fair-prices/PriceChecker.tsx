"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import TrackedExternalLink from "@/components/analytics/TrackedExternalLink";
import { whatsappUrl } from "@/lib/contact";
import {
  type ExchangeRates,
  type FairPriceCurrency,
  type FairPriceItem,
  type FairPriceVerdict,
  fairPriceCategoryIds,
  fairPriceVerdict,
  fallbackFairPriceRates,
  formatFairAmount,
  formatFairRange,
} from "@/lib/fair-prices";
import { fillFairCopy, type FairPriceCopy, type FairPriceItemCopy } from "@/lib/fair-prices-i18n";

const currencies: FairPriceCurrency[] = ["EGP", "USD", "EUR"];

const verdictStyles: Record<FairPriceVerdict, string> = {
  below: "border-emerald-300 bg-emerald-50 text-emerald-900",
  fair: "border-emerald-300 bg-emerald-50 text-emerald-900",
  high: "border-amber-300 bg-amber-50 text-amber-900",
  ripoff: "border-red-300 bg-red-50 text-red-900",
};

export type PriceCheckerItem = FairPriceItem & FairPriceItemCopy;
export type PriceCheckerTourPrice = { slug: string; href: string; title: string; label: string };

export default function PriceChecker({ items, copy, tourPrices }: { items: PriceCheckerItem[]; copy: FairPriceCopy; tourPrices: Record<string, PriceCheckerTourPrice> }) {
  const [itemId, setItemId] = useState(items[0].id);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<FairPriceCurrency>("EGP");
  const [rates, setRates] = useState<ExchangeRates>(fallbackFairPriceRates);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/exchange-rates", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Rate request failed"))))
      .then((data: { rates?: Partial<ExchangeRates> }) => {
        const next = data.rates;
        if (next && currencies.every((code) => Number.isFinite(next[code]) && Number(next[code]) > 0)) {
          setRates({ USD: Number(next.USD), EUR: Number(next.EUR), EGP: Number(next.EGP) });
        }
      })
      .catch(() => {
        // Keep the fallback rates; the checker still works.
      });
    return () => controller.abort();
  }, []);

  const item = items.find((entry) => entry.id === itemId) ?? items[0];
  // Accept "1,500" and "1.500" as thousands and "12,5" as a decimal comma.
  const normalizedAmount = amount.trim().replace(/[\s'’]/g, "").replace(/[.,](?=\d{3}(?:\D|$))/g, "").replace(",", ".");
  const numericAmount = Number(normalizedAmount);
  const hasAmount = normalizedAmount !== "" && Number.isFinite(numericAmount) && numericAmount > 0;
  const verdict = useMemo(() => (hasAmount ? fairPriceVerdict(item, numericAmount, currency, rates) : null), [hasAmount, item, numericAmount, currency, rates]);
  const tour = item.tourSlug ? tourPrices[item.tourSlug] : undefined;
  const quoted = hasAmount ? formatFairAmount(numericAmount, currency, copy.intlLocale) : copy.checker.priceUnknown;
  const askMessage = fillFairCopy(copy.checker.askMessage, { amount: quoted, name: item.name });
  const range = formatFairRange(item, copy.intlLocale);

  return (
    <section id="price-checker" aria-labelledby="price-checker-title" className="mt-10 rounded-3xl border border-ocean-soft bg-white p-6 shadow-sm sm:p-8">
      <p className="font-bold uppercase tracking-[0.2em] text-ocean-dark">{copy.checker.eyebrow}</p>
      <h2 id="price-checker-title" className="mt-2 text-3xl font-black text-ink">{copy.checker.title}</h2>
      <p className="mt-3 leading-7 text-ink">{copy.checker.intro}</p>

      <label className="mt-6 block">
        <span className="text-sm font-bold text-ink">{copy.checker.offeredLabel}</span>
        <select
          value={itemId}
          onChange={(event) => setItemId(event.target.value as PriceCheckerItem["id"])}
          className="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-3 text-base text-ink"
        >
          {fairPriceCategoryIds.map((category) => (
            <optgroup key={category} label={copy.categories[category]}>
              {items.filter((entry) => entry.category === category).map((entry) => (
                <option key={entry.id} value={entry.id}>{entry.name}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      <div className="mt-4 grid grid-cols-[1fr_auto] gap-3">
        <label className="block">
          <span className="text-sm font-bold text-ink">{fillFairCopy(copy.checker.quotedLabel, { unit: item.unit })}</span>
          <input
            inputMode="decimal"
            autoComplete="off"
            placeholder={copy.checker.placeholder}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-3 text-base text-ink"
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-ink">{copy.checker.currencyLabel}</span>
          <select
            value={currency}
            onChange={(event) => setCurrency(event.target.value as FairPriceCurrency)}
            className="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-3 text-base text-ink"
          >
            {currencies.map((code) => <option key={code} value={code}>{code}</option>)}
          </select>
        </label>
      </div>

      <div aria-live="polite" className="mt-6">
        {verdict ? (
          <div className={`rounded-2xl border p-5 ${verdictStyles[verdict]}`}>
            <p className="text-2xl font-black">{copy.verdicts[verdict].title}</p>
            <p className="mt-2 leading-7">{copy.verdicts[verdict].body}</p>
            <p className="mt-3 text-sm">
              {copy.checker.fairRange} <strong>{range}</strong> {item.unit}
              {item.currency !== currency ? <> ({fillFairCopy(copy.checker.atTodaysRate, { amount: formatFairAmount((numericAmount / rates[currency]) * rates[item.currency], item.currency, copy.intlLocale) })})</> : null}
            </p>
          </div>
        ) : (
          <p className="rounded-2xl bg-surface-muted p-5 text-ink">{copy.checker.fairRange} <strong>{range}</strong> {item.unit}</p>
        )}
        <p className="mt-4 text-sm leading-6 text-muted"><strong className="text-ink">{copy.checker.tipLabel}</strong> {item.tip}</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {tour ? (
          <Link href={tour.href} className="inline-flex rounded-2xl bg-ocean px-5 py-3 text-start font-bold text-white">
            {fillFairCopy(copy.checker.book, { label: tour.label })}
          </Link>
        ) : null}
        <TrackedExternalLink
          event="whatsapp_click"
          eventData={{ source: "price_checker", item_name: item.id }}
          href={whatsappUrl(askMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex rounded-2xl border border-ocean px-5 py-3 font-bold text-ocean-dark"
        >
          {copy.checker.ask}
        </TrackedExternalLink>
      </div>
    </section>
  );
}
