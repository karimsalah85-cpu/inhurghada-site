"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import TrackedExternalLink from "@/components/analytics/TrackedExternalLink";
import { whatsappUrl } from "@/lib/contact";
import {
  type ExchangeRates,
  type FairPriceCurrency,
  type FairPriceVerdict,
  fairPriceCategories,
  fairPriceItems,
  fairPriceVerdict,
  fallbackFairPriceRates,
  formatFairAmount,
  formatFairRange,
} from "@/lib/fair-prices";

const currencies: FairPriceCurrency[] = ["EGP", "USD", "EUR"];

const verdictCopy: Record<FairPriceVerdict, { title: string; body: string; className: string }> = {
  below: {
    title: "Good price",
    body: "That is below the usual range. Great if it’s genuine — just check exactly what’s included before you pay.",
    className: "border-emerald-300 bg-emerald-50 text-emerald-900",
  },
  fair: {
    title: "Fair price",
    body: "That is within the normal range for Hurghada. Go ahead and enjoy it.",
    className: "border-emerald-300 bg-emerald-50 text-emerald-900",
  },
  high: {
    title: "A bit high",
    body: "Not a scam, but you are paying more than most visitors. Try negotiating towards the fair range.",
    className: "border-amber-300 bg-amber-50 text-amber-900",
  },
  ripoff: {
    title: "Rip-off",
    body: "That is well above what this should cost. Walk away or compare other offers first.",
    className: "border-red-300 bg-red-50 text-red-900",
  },
};

export type PriceCheckerTourPrice = { slug: string; title: string; label: string };

export default function PriceChecker({ tourPrices }: { tourPrices: Record<string, PriceCheckerTourPrice> }) {
  const [itemId, setItemId] = useState(fairPriceItems[0].id);
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

  const item = fairPriceItems.find((entry) => entry.id === itemId) ?? fairPriceItems[0];
  const numericAmount = Number(amount.replace(/,/g, ""));
  const hasAmount = amount.trim() !== "" && Number.isFinite(numericAmount) && numericAmount > 0;
  const verdict = useMemo(() => (hasAmount ? fairPriceVerdict(item, numericAmount, currency, rates) : null), [hasAmount, item, numericAmount, currency, rates]);
  const tour = item.tourSlug ? tourPrices[item.tourSlug] : undefined;
  const askMessage = `Hi Daily Red Sea! Is this a fair price? I was offered ${hasAmount ? formatFairAmount(numericAmount, currency) : "[price]"} for: ${item.name}.`;

  return (
    <section id="price-checker" aria-labelledby="price-checker-title" className="mt-10 rounded-3xl border border-ocean-soft bg-white p-6 shadow-sm sm:p-8">
      <p className="font-bold uppercase tracking-[0.2em] text-ocean-dark">Free tool</p>
      <h2 id="price-checker-title" className="mt-2 text-3xl font-black text-ink">Is this a fair price?</h2>
      <p className="mt-3 leading-7 text-ink">Pick what you were offered, type the price, and see instantly whether it’s fair.</p>

      <div className="mt-6">
        <label className="block">
          <span className="text-sm font-bold text-ink">What were you offered?</span>
          <select
            value={itemId}
            onChange={(event) => setItemId(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-3 text-base text-ink"
          >
            {fairPriceCategories.map((category) => (
              <optgroup key={category.id} label={category.label}>
                {fairPriceItems.filter((entry) => entry.category === category.id).map((entry) => (
                  <option key={entry.id} value={entry.id}>{entry.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto] gap-3">
        <label className="block">
          <span className="text-sm font-bold text-ink">Price you were quoted ({item.unit})</span>
          <input
            inputMode="decimal"
            autoComplete="off"
            placeholder="e.g. 500"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-3 text-base text-ink"
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-ink">Currency</span>
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
          <div className={`rounded-2xl border p-5 ${verdictCopy[verdict].className}`}>
            <p className="text-2xl font-black">{verdictCopy[verdict].title}</p>
            <p className="mt-2 leading-7">{verdictCopy[verdict].body}</p>
            <p className="mt-3 text-sm">
              Fair range: <strong>{formatFairRange(item)}</strong> {item.unit}
              {item.currency !== currency ? <> (≈ {formatFairAmount(numericAmount / rates[currency] * rates[item.currency], item.currency)} at today’s rate)</> : null}
            </p>
          </div>
        ) : (
          <p className="rounded-2xl bg-surface-muted p-5 text-ink">Fair range: <strong>{formatFairRange(item)}</strong> {item.unit}</p>
        )}
        <p className="mt-4 text-sm leading-6 text-muted"><strong className="text-ink">Tip:</strong> {item.tip}</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {tour ? (
          <Link href={`/tours/${tour.slug}`} className="inline-flex rounded-2xl bg-ocean px-5 py-3 text-left font-bold text-white">
            Book it with us — {tour.label} →
          </Link>
        ) : null}
        <TrackedExternalLink
          event="whatsapp_click"
          eventData={{ source: "price_checker", item_name: item.name }}
          href={whatsappUrl(askMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex rounded-2xl border border-ocean px-5 py-3 font-bold text-ocean-dark"
        >
          Not sure? Ask us on WhatsApp
        </TrackedExternalLink>
      </div>
    </section>
  );
}
