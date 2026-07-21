import { Suspense } from "react";
import BookingForm from "@/components/booking/BookingForm";
import TourDetails from "@/components/tours/TourDetails";
import type { Tour } from "@/data/tours";

export default function TourPageShell({ tour }: { tour: Tour }) {
  return (
    <main className="min-h-screen bg-slate-50">
      <section
        className="relative h-[520px] bg-cover bg-center"
        style={{ backgroundImage: `url(${tour.image})` }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 flex h-full items-center justify-center px-6 text-center text-white">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Hurghada experience</p>
            <h1 className="mt-4 text-4xl font-black sm:text-5xl">{tour.title}</h1>
            <p className="mt-6 text-lg leading-8 text-slate-200">{tour.location}</p>
            <p className="mt-4 text-base leading-7 text-slate-300">Reserve your place online, receive instant confirmation details, and get ready for a premium beach and snorkeling day in the Red Sea.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm backdrop-blur">
                {tour.duration}
              </div>
              <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm backdrop-blur">
                {tour.rating} / 5 from {tour.reviews ?? "30"} reviews
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <TourDetails tour={tour} />

          <div>
            <Suspense fallback={<div className="min-h-[620px] rounded-3xl border bg-white shadow-sm" />}> 
              <BookingForm
                tourName={tour.title}
                price={tour.price}
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
