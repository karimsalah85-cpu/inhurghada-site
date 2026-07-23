"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin, Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import type { Tour } from "@/data/tours";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";

export default function CategoryTourExplorer({ tours }: { tours: Tour[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"featured" | "price-low" | "price-high">("featured");
  const { formatPrice } = useSiteSettings();
  const visibleTours = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const result = tours.filter((tour) =>
      !normalized || [tour.title, tour.description, tour.location, tour.duration, ...(tour.highlights || [])].join(" ").toLowerCase().includes(normalized)
    );
    if (sort === "price-low") return [...result].sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === "price-high") return [...result].sort((a, b) => Number(b.price) - Number(a.price));
    return result;
  }, [query, sort, tours]);

  return (
    <>
      <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto]">
        <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4">
          <Search size={19} className="text-cyan-700" />
          <span className="sr-only">Search these experiences</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search these experiences" className="min-h-12 w-full bg-transparent outline-none" />
        </label>
        <label>
          <span className="sr-only">Sort tours</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 font-semibold text-slate-700">
            <option value="featured">Featured</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
          </select>
        </label>
      </div>

      <p className="mt-6 text-sm font-semibold text-slate-500" aria-live="polite">{visibleTours.length} {visibleTours.length === 1 ? "experience" : "experiences"}</p>
      <div className="mt-5 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
        {visibleTours.map((tour) => {
          const reviewCount = Number(tour.reviews);
          const hasReviews = Number.isFinite(reviewCount) && reviewCount > 0;
          return (
            <article key={tour.slug} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <Link href={`/tours/${tour.slug}`} className="group block">
                <div className="relative h-56 overflow-hidden">
                  <Image src={tour.image} alt={tour.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" />
                  {tour.badge ? <span className="absolute left-4 top-4 rounded-full bg-slate-950/85 px-3 py-2 text-xs font-bold text-white">{tour.badge}</span> : null}
                </div>
                <div className="p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-700">{tour.category || "Hurghada experience"}</p>
                  <h2 className="mt-2 text-xl font-black text-slate-950">{tour.title}</h2>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{tour.description}</p>
                  <div className="mt-5 grid gap-2 text-sm text-slate-600">
                    <span className="flex items-center gap-2"><Clock size={17} className="text-cyan-700" />{tour.duration}</span>
                    <span className="flex items-center gap-2"><MapPin size={17} className="text-cyan-700" />{tour.location}</span>
                    <span className="flex items-center gap-2"><ShieldCheck size={17} className="text-emerald-600" />Clear price · pickup confirmed</span>
                  </div>
                  <div className="mt-6 flex items-end justify-between gap-4">
                    <div><p className="text-xs text-slate-500">From</p><p className="text-2xl font-black text-blue-700">{formatPrice(tour.price)}</p><p className="text-xs text-slate-500">{tour.priceUnit || "per person"}</p></div>
                    <span className="rounded-full bg-blue-700 px-4 py-3 text-sm font-bold text-white">View & book</span>
                  </div>
                  {hasReviews ? <p className="mt-4 text-xs font-semibold text-amber-600">★ {tour.rating} · {reviewCount} customer reviews</p> : null}
                </div>
              </Link>
            </article>
          );
        })}
      </div>
      {!visibleTours.length ? <div className="mt-8 rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-600">No matching experiences. Try a different search.</div> : null}
    </>
  );
}

