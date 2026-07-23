import type { Metadata } from "next";
import Link from "next/link";
import { contactEmail, displayPhoneNumber, whatsappUrl } from "@/lib/contact";
import { languageAlternates, localePath } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Contact Daily Red Sea",
  description: "Contact the Daily Red Sea team for Hurghada tour, pickup, booking, and private-transfer assistance.",
  alternates: { canonical: "/contact", languages: { ...languageAlternates("/contact"), "x-default": localePath("en", "/contact") } },
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 pb-20 pt-32 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="font-semibold uppercase tracking-[0.28em] text-cyan-700">We are here to help</p>
        <h1 className="mt-4 text-4xl font-black text-slate-950 sm:text-6xl">Contact Daily Red Sea</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">For the fastest response, send your travel date, hotel, number of adults and children, and the tour or transfer you are considering.</p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <a href={whatsappUrl("Hello Daily Red Sea, I need help with a booking.")} target="_blank" rel="noopener noreferrer" className="rounded-3xl border border-emerald-200 bg-emerald-50 p-7 transition hover:-translate-y-1"><p className="text-sm font-bold uppercase tracking-wider text-emerald-700">Fastest</p><h2 className="mt-3 text-2xl font-black text-slate-950">WhatsApp</h2><p className="mt-3 text-slate-600">Tour advice, availability, pickup changes, and booking help.</p></a>
          <a href={`mailto:${contactEmail}`} className="rounded-3xl border border-slate-200 bg-white p-7 transition hover:-translate-y-1"><p className="text-sm font-bold uppercase tracking-wider text-cyan-700">Email</p><h2 className="mt-3 text-xl font-black text-slate-950">{contactEmail}</h2><p className="mt-3 text-slate-600">Useful for detailed requests and documents.</p></a>
          <a href={`tel:${displayPhoneNumber.replace(/\s/g, "")}`} className="rounded-3xl border border-slate-200 bg-white p-7 transition hover:-translate-y-1"><p className="text-sm font-bold uppercase tracking-wider text-cyan-700">Telephone</p><h2 className="mt-3 text-xl font-black text-slate-950">{displayPhoneNumber}</h2><p className="mt-3 text-slate-600">For urgent same-day assistance.</p></a>
        </div>
        <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-8"><h2 className="text-2xl font-black text-slate-950">Already booked?</h2><p className="mt-4 leading-7 text-slate-600">Include your booking reference when contacting us. For pickup changes or urgent questions close to departure, use WhatsApp so the team can identify your booking quickly.</p><Link href="/booking" className="mt-6 inline-flex rounded-full bg-blue-700 px-6 py-3 font-bold text-white">Find my booking</Link></section>
      </div>
    </main>
  );
}
