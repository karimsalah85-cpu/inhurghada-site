"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarRange, CheckCircle2, Clock3, MessageCircle, ShieldCheck, Smartphone, Ticket } from "lucide-react";
import type { BookingRecord } from "@/lib/booking-service";

const actions = [
  {
    title: "View booking",
    description: "See every reservation detail, including pickup time and traveler count.",
  },
  {
    title: "Download voucher",
    description: "Access your printable confirmation and QR voucher instantly.",
  },
  {
    title: "Cancel or change",
    description: "Update your date, pickup point, or group size with simple support.",
  },
];

const faqs = [
  {
    question: "How do I find my booking number?",
    answer:
      "Your confirmation email and WhatsApp message both include your booking reference, usually formatted as EG-2026-01425.",
  },
  {
    question: "Can I modify my reservation?",
    answer:
      "Yes. You can change the pickup point, date, or travelers through your booking profile or by contacting our team.",
  },
  {
    question: "What if I forgot the email used during booking?",
    answer:
      "Send us your WhatsApp number and we can help locate the booking securely and quickly.",
  },
];

export default function BookingPortal() {
  const [reference, setReference] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!reference.trim() && !email.trim()) {
      setStatus("Please enter your booking reference or email address so we can look it up.");
      setBooking(null);
      return;
    }

    setIsLoading(true);
    setStatus(null);
    setBooking(null);

    try {
      const query = reference.trim()
        ? `reference=${encodeURIComponent(reference.trim())}`
        : `email=${encodeURIComponent(email.trim())}`;
      const response = await fetch(`/api/bookings?${query}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        setStatus(data.error || "We could not find that booking.");
        return;
      }

      setBooking(data.booking);
      setStatus(`Booking ${data.booking.reference} is ready to review.`);
    } catch {
      setStatus("We could not reach the booking service right now. Please try again shortly.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="bg-slate-50">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[url('/images/hero.jpg')] bg-cover bg-center opacity-35" />
        <div className="absolute inset-0 bg-slate-950/80" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-12 px-6 py-24 lg:px-8 lg:py-32">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Official booking portal</p>
            <h1 className="mt-4 text-4xl font-black sm:text-5xl">
              Manage your booking with confidence
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-200">
              Find your reservation, review pickup details, download your voucher, and keep every part of your trip in one place.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm">
                <ShieldCheck size={16} className="text-cyan-300" /> Secure reservation access
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm">
                <Clock3 size={16} className="text-cyan-300" /> 24/7 assistance
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur">
              <h2 className="text-2xl font-bold">Find my booking</h2>
              <p className="mt-3 text-slate-300">
                Enter your booking reference or email address to access your reservation.
              </p>
              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <label className="block text-sm font-medium text-slate-200">
                  Booking reference
                  <input
                    value={reference}
                    onChange={(event) => setReference(event.target.value)}
                    placeholder="EG-2026-01425"
                    className="mt-2 w-full rounded-xl border border-white/20 bg-slate-950/50 px-4 py-3 text-white outline-none focus:border-cyan-400"
                  />
                </label>
                <label className="block text-sm font-medium text-slate-200">
                  Email address
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="mt-2 w-full rounded-xl border border-white/20 bg-slate-950/50 px-4 py-3 text-white outline-none focus:border-cyan-400"
                  />
                </label>
                <button type="submit" disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70">
                  <Ticket size={18} /> {isLoading ? "Searching..." : "Find my booking"}
                </button>
                <p className="text-sm text-slate-300">Enter just one value — your reference or your email address.</p>
              </form>
              {status ? (
                <div className="mt-5 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-4 text-sm text-cyan-100">
                  {status}
                </div>
              ) : null}

              {booking ? (
                <div className="mt-5 rounded-2xl border border-white/20 bg-slate-950/40 p-4 text-sm text-slate-100">
                  <p className="font-semibold text-white">Booking details</p>
                  <div className="mt-3 space-y-2">
                    <p><span className="text-slate-400">Reference:</span> {booking.reference}</p>
                    <p><span className="text-slate-400">Guest:</span> {booking.customerName}</p>
                    <p><span className="text-slate-400">Phone:</span> {booking.phone}</p>
                    <p><span className="text-slate-400">Status:</span> {booking.status}</p>
                    {booking.date ? <p><span className="text-slate-400">Date:</span> {booking.date}</p> : null}
                    {booking.hotel ? <p><span className="text-slate-400">Pickup:</span> {booking.hotel}</p> : null}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white p-8 text-slate-900 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-cyan-100 p-3 text-cyan-700">
                  <Smartphone size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">Need help?</p>
                  <h2 className="text-2xl font-bold">Talk to our travel team</h2>
                </div>
              </div>
              <div className="mt-8 space-y-4">
                <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "201004933150"}?text=Hi%20Daily%20Red%20Sea%2C%20I%20need%20help%20with%20my%20booking`} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-cyan-400">
                  <span className="flex items-center gap-3 font-semibold text-slate-900"><MessageCircle className="text-green-600" /> WhatsApp support</span>
                  <span className="text-sm text-slate-500">Fastest reply</span>
                </a>
                <a href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@dailyredsea.com"}`} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-cyan-400">
                  <span className="flex items-center gap-3 font-semibold text-slate-900"><CalendarRange className="text-cyan-700" /> Email us</span>
                  <span className="text-sm text-slate-500">hello@dailyredsea.com</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">What you can do here</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">Everything you need to manage your trip in one place</h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {actions.map((action) => (
              <div key={action.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                  <CheckCircle2 size={20} />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-slate-900">{action.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{action.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">Secure and simple</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">Your booking information stays protected</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Only customers with the correct booking reference and matching email address can access reservation details. Your information is handled with care and translated into a clear trip overview.
            </p>
            <div className="mt-8 flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              <ShieldCheck className="text-cyan-700" /> Encrypted connection and private access
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">Frequently asked questions</p>
            <div className="mt-6 space-y-4">
              {faqs.map((faq) => (
                <details key={faq.question} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <summary className="cursor-pointer font-semibold text-slate-900">{faq.question}</summary>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-600">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-3">
          <Link href="/" className="font-semibold text-cyan-700">Home</Link>
          <span>•</span>
          <Link href="/transfers" className="font-semibold text-cyan-700">Transfers</Link>
          <span>•</span>
          <Link href="/booking" className="font-semibold text-cyan-700">Booking portal</Link>
        </div>
      </footer>
    </main>
  );
}
