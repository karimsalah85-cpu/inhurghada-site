import { ArrowRight, BadgeCheck, CalendarDays, CarFront, Clock3, MapPin, ShieldCheck, Sparkles, Ticket, Users } from "lucide-react";
import Link from "next/link";
import TransferBookingForm from "@/components/booking/TransferBookingForm";

const highlights = [
  "Private transfer exclusively for your booking",
  "Comfortable, modern, air-conditioned vehicles",
  "Professional local drivers with door-to-door service",
  "Flexible pickup times and easy hotel coordination",
  "Fixed prices with no hidden charges",
];

const included = [
  "Private air-conditioned vehicle",
  "Professional and licensed driver",
  "Hotel or Senzo Mall pickup",
  "Direct private transfer",
  "Fuel, parking and all taxes included",
];

const notIncluded = [
  "Personal shopping expenses",
  "Food and drinks",
  "Tips and gratuities",
  "Additional stops not included in the booking",
];

const notes = [
  "Please provide your hotel name or pickup address when booking.",
  "If you are returning from Senzo Mall, provide your preferred pickup time.",
  "Child seats are available on request, subject to availability.",
  "Larger luggage or shopping purchases should be mentioned during booking.",
];

export const metadata = {
  title: "Transfer to and from Senzo Mall | Daily Red Sea",
  description: "Private transfer to and from Senzo Mall in Hurghada with modern vehicles, flexible pickup times, and easy booking.",
};

export default function SenzoMallTransferPage() {
  return (
    <main className="bg-slate-50">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[url('/images/transfer.jpg')] bg-cover bg-center opacity-35" />
        <div className="absolute inset-0 bg-slate-950/70" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-10 px-6 py-24 lg:px-8 lg:py-32">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Private transfer</p>
            <h1 className="mt-4 text-4xl font-black sm:text-5xl">Transfer to and from Senzo Mall Hurghada</h1>
            <p className="mt-6 text-lg leading-8 text-slate-200">Enjoy a comfortable door-to-door ride to Hurghada’s largest shopping mall with a private driver and flexible pickup times.</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm"><CarFront size={16} className="text-cyan-300" /> Private vehicle</div>
              <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm"><Clock3 size={16} className="text-cyan-300" /> Flexible pickup</div>
              <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm"><ShieldCheck size={16} className="text-cyan-300" /> Fixed price</div>
            </div>
          </div>
          <div className="grid gap-6 rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur md:grid-cols-3">
            <div><p className="text-sm text-slate-300">Duration</p><p className="mt-2 text-2xl font-bold">1 hour</p></div>
            <div><p className="text-sm text-slate-300">Starting rate</p><p className="mt-2 text-2xl font-bold">From $15</p></div>
            <div><p className="text-sm text-slate-300">Booking</p><p className="mt-2 text-2xl font-bold">Pay on arrival</p></div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">Description</p>
          <h2 className="mt-4 text-3xl font-bold text-slate-900">Travel smoothly with a private door-to-door transfer</h2>
          <p className="mt-6 text-lg leading-8 text-slate-600">Whether you are heading to Senzo Mall for shopping, dining, or family time, our transfer service gives you a stress-free way to reach the destination and return comfortably to your hotel or resort.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><div className="flex items-center gap-3 text-cyan-700"><MapPin size={18} /><span className="font-semibold">Pickup anywhere in Hurghada</span></div><p className="mt-3 text-sm leading-7 text-slate-600">Hotels, resorts, apartments and central points are all supported.</p></div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><div className="flex items-center gap-3 text-cyan-700"><Users size={18} /><span className="font-semibold">Private for your group</span></div><p className="mt-3 text-sm leading-7 text-slate-600">No shared rides, no unnecessary stops, and more space for luggage or shopping bags.</p></div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3"><div className="rounded-2xl bg-cyan-100 p-3 text-cyan-700"><Sparkles size={20} /></div><div><p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">Why travelers love it</p><h3 className="text-2xl font-bold text-slate-900">Comfortable and reliable</h3></div></div>
          <ul className="mt-8 space-y-4">{highlights.map((item) => (<li key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700"><BadgeCheck className="mt-0.5 shrink-0 text-cyan-700" size={18} /><span>{item}</span></li>))}</ul>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"><p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">Included</p><ul className="mt-6 space-y-4">{included.map((item) => (<li key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700"><BadgeCheck className="mt-0.5 shrink-0 text-cyan-700" size={18} /><span>{item}</span></li>))}</ul></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"><p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">Not included</p><ul className="mt-6 space-y-4">{notIncluded.map((item) => (<li key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700"><BadgeCheck className="mt-0.5 shrink-0 text-cyan-700" size={18} /><span>{item}</span></li>))}</ul></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.95fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"><p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">Know before you go</p><ul className="mt-6 space-y-4">{notes.map((item) => (<li key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700"><CalendarDays className="mt-0.5 shrink-0 text-cyan-700" size={18} /><span>{item}</span></li>))}</ul></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"><p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">Select your package</p><div className="mt-6 space-y-4"><div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5"><div className="flex items-center justify-between gap-4"><div><h3 className="text-xl font-bold text-slate-900">Transfer to and from Senzo Mall</h3><p className="mt-2 text-sm text-slate-600">Private transfer between Senzo Mall and your hotel with fixed prices and professional drivers.</p></div><div className="text-right"><p className="text-sm text-slate-500">Starting from</p><p className="text-2xl font-bold text-cyan-700">$15</p></div></div></div><div className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><div className="flex items-center justify-between gap-4"><div><h3 className="text-xl font-bold text-slate-900">Transfer to and from Makadi Bay / Sahl Hasheesh</h3><p className="mt-2 text-sm text-slate-600">Private transfer to and from Senzo Mall for resorts and hotels in the surrounding areas.</p></div><div className="text-right"><p className="text-sm text-slate-500">Starting from</p><p className="text-2xl font-bold text-slate-800">$20</p></div></div></div></div><div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5"><p className="text-sm font-medium text-slate-600">We will confirm your pickup time and location via WhatsApp before the trip.</p><div className="mt-4 flex items-center gap-2 text-sm font-semibold text-cyan-700"><Ticket size={16} /> Book now and confirm instantly</div></div></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"><p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">Booking</p><h2 className="mt-4 text-3xl font-bold text-slate-900">Reserve your transfer in minutes</h2><p className="mt-5 text-lg leading-8 text-slate-600">Fill in the details below and send your request on WhatsApp for a fast confirmation.</p><div className="mt-6 flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600"><ShieldCheck className="text-cyan-700" /> No hidden fees. Flexible pickup. Private service.</div></div>
          <TransferBookingForm />
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white px-6 py-12"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 lg:px-8"><div><p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">More transfers</p><h3 className="mt-2 text-2xl font-bold text-slate-900">Explore other door-to-door routes</h3></div><Link href="/transfers" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-700">View all transfers <ArrowRight size={16} /></Link></div></section>
    </main>
  );
}
