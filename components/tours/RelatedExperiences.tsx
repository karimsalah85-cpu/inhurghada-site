import Link from "next/link";
import { Clock3, Star } from "lucide-react";
import type { Tour } from "@/data/tours";
import { localePath, type Locale } from "@/lib/i18n";

/**
 * Mobile-first "You may also like" rail. Renders the related tours already
 * selected by TourPageShell (same destination / category, current tour and
 * paused listings excluded) as a horizontal, scroll-snap carousel — no
 * carousel library, images lazy-loaded.
 */
export default function RelatedExperiences({
  tours,
  locale,
  heading,
  viewAllLabel,
  viewAllHref,
  fromLabel,
}: {
  tours: Tour[];
  locale: Locale;
  heading: string;
  viewAllLabel: string;
  viewAllHref: string;
  fromLabel: string;
}) {
  if (!tours.length) return null;

  const money = (value: string, currency?: string) =>
    new Intl.NumberFormat(locale, { style: "currency", currency: currency || "USD", maximumFractionDigits: 0 }).format(Number(value));

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-2xl font-bold text-ink sm:text-3xl">{heading}</h2>
        <Link href={viewAllHref} className="shrink-0 text-sm font-bold text-ocean-dark underline underline-offset-4 hover:text-ocean">
          {viewAllLabel}
        </Link>
      </div>

      <ul className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tours.map((item) => {
          const reviewCount = Number(item.reviews);
          const hasRating = Number.isFinite(Number(item.rating)) && Number.isFinite(reviewCount) && reviewCount > 0;
          const discounted = item.originalPrice && Number(item.originalPrice) > Number(item.price);
          return (
            <li key={item.slug} className="w-[240px] shrink-0 snap-start">
              <Link
                href={localePath(locale, `/tours/${item.slug}`)}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition hover:border-ocean-soft hover:shadow-md"
              >
                <span className="relative block aspect-[4/3] overflow-hidden bg-surface-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.imageAlt || item.title}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </span>
                <span className="flex flex-1 flex-col gap-2 p-4">
                  <span className="line-clamp-2 font-bold leading-snug text-ink">{item.title}</span>
                  <span className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 size={13} aria-hidden="true" /> {item.duration}
                    </span>
                    {hasRating ? (
                      <span className="inline-flex items-center gap-1 text-ink">
                        <Star size={13} className="fill-amber-400 text-amber-400" aria-hidden="true" /> {item.rating}
                        <span className="text-muted">({reviewCount})</span>
                      </span>
                    ) : null}
                  </span>
                  <span className="text-sm font-semibold text-ink">
                    <span className="text-muted">{fromLabel} </span>
                    {discounted ? <span className="mr-1 text-muted line-through">{money(item.originalPrice!, item.currency)}</span> : null}
                    {money(item.price, item.currency)}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
