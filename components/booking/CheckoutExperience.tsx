"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, BadgeCheck, CalendarRange, CreditCard, MessageCircle, ShieldCheck, Sparkles, Ticket } from "lucide-react";

const steps = [
  "Choose a tour and pick your date",
  "Add travelers, pickup details, and notes",
  "Confirm everything on WhatsApp and pay safely",
  "Receive your voucher and support anytime",
];

const perks = [
  "Fast WhatsApp confirmation",
  "Flexible pickup and change requests",
  "Secure payments and protected bookings",
  "Trusted local support 24/7",
];

export default function CheckoutExperience() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const booking = searchParams.get("booking");

  const confirmationMessage = status === "success"
    ? `Payment confirmed for booking ${booking || "your request"}. We will send your voucher shortly.`
    : status === "cancelled"
      ? `Your payment was cancelled. You can try again or contact us for help.`
      : null;

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(6,182,212,0.25),_transparent_40%)]" />
        <div className="absolute inset-0 bg-[url('/images/hero.jpg')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-slate-950/80" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Checkout</p>
            <h1 className="mt-4 text-4xl font-black sm:text-5xl">Your booking journey, beautifully organized</h1>
            <p className="mt-6 text-lg leading-8 text-slate-200">
              Review your trip details, confirm your date and pickup, and continue with a smooth, premium booking flow designed for Hurghada tours and transfers.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_20px_80px_-30px_rgba(15,23,42,0.35)] sm:p-10">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-cyan-100 p-3 text-cyan-700">
                <Ticket size={22} />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">No booking in progress</p>
                <h2 className="text-3xl font-bold text-slate-900">Choose a tour and press Book now to start</h2>
              </div>
            </div>

            {confirmationMessage ? (
              <div className="mb-8 rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-left">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">Booking status</p>
                <h3 className="mt-2 text-xl font-bold text-slate-900">{status === "success" ? "Payment confirmed" : "Payment cancelled"}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-700">{confirmationMessage}</p>
              </div>
            ) : null}

            <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                <Sparkles size={28} />
              </div>
              <h3 className="mt-6 text-2xl font-bold text-slate-900">Your reservation will appear here</h3>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                Start with a tour from our collection and we will guide you through the checkout flow with pickup details, traveler information and a clear confirmation.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-700">
                  Browse tours <ArrowRight size={16} />
                </Link>
                <Link href="/booking" className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:border-cyan-400 hover:text-cyan-700">
                  Manage booking <MessageCircle size={16} />
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                  <CalendarRange size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">How it works</p>
                  <h3 className="text-2xl font-bold text-slate-900">A simple checkout from start to finish</h3>
                </div>
              </div>
              <ul className="mt-8 space-y-4">
                {steps.map((step, index) => (
                  <li key={step} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-100 font-semibold text-cyan-700">{index + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-violet-700">Why travelers choose us</p>
                  <h3 className="text-2xl font-bold text-slate-900">Secure and effortless</h3>
                </div>
              </div>
              <div className="mt-8 grid gap-4">
                {perks.map((perk) => (
                  <div key={perk} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <BadgeCheck className="shrink-0 text-cyan-700" size={18} />
                    <span className="text-sm font-medium text-slate-700">{perk}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-slate-900 p-8 text-white shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/10 p-3 text-cyan-300">
                  <CreditCard size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Payment options</p>
                  <h3 className="text-2xl font-bold">Book now or pay on arrival</h3>
                </div>
              </div>
              <p className="mt-5 text-sm leading-7 text-slate-300">
                Reserve your experience online or complete the final step on arrival. Our support team is ready to help whenever you need it.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
