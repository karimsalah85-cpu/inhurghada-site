import { Suspense } from "react";
import BookingForm from "@/components/booking/BookingForm";
import TourDetails from "@/components/tours/TourDetails";
import type { Tour } from "@/data/tours";
import Image from "next/image";

export default function TourPageShell({ tour }: { tour: Tour }) {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-7xl px-6 pb-8 pt-28 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-700">Hurghada experience</p>
        <h1 className="mt-3 text-4xl font-black text-slate-950 sm:text-5xl">{tour.title}</h1>
        <div className="mt-4 flex flex-wrap gap-3 text-sm font-medium text-slate-600"><span>★ {tour.rating}</span><span>{tour.reviews ?? "New"} reviews</span><span>•</span><span>{tour.location}</span><span>•</span><span>{tour.duration}</span></div>
        <div className="mt-8 grid h-[420px] gap-3 overflow-hidden rounded-[2rem] sm:grid-cols-2">
          <div className="relative min-h-64"><Image src={tour.image} alt={tour.title} fill className="object-cover" priority /></div>
          <div className="grid grid-cols-2 gap-3"><div className="relative"><Image src="/images/orange-bay.jpeg" alt="Orange Bay" fill className="object-cover" /></div><div className="relative"><Image src="/images/scuba-diving.jpg" alt="Red Sea" fill className="object-cover" /></div><div className="relative"><Image src="/images/desert-safari.jpg" alt="Hurghada experience" fill className="object-cover" /></div><div className="relative overflow-hidden"><Image src="/images/hero.jpg" alt="Daily Red Sea" fill className="object-cover" /><span className="absolute bottom-4 right-4 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-900">View gallery</span></div></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <TourDetails tour={tour} />

          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><p className="font-bold">Reserve now, pay cash on arrival</p><p className="mt-1">We confirm pickup details by WhatsApp after your request.</p></div>
            <Suspense fallback={<div className="min-h-[620px] rounded-3xl border bg-white shadow-sm" />}> 
              <BookingForm
                tourName={tour.title}
                price={tour.price}
                priceUnit={tour.priceUnit}
                duration={tour.duration}
                location={tour.location}
              />
            </Suspense>
          </div>
        </div>
      </section>
    </main>
  );
}
