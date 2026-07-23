import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, MapPin, MessageCircle, ShieldCheck } from "lucide-react";
import { whatsappUrl } from "@/lib/contact";
import { languageAlternates, localePath } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "About Daily Red Sea",
  description: "Meet the local Hurghada team behind Daily Red Sea tours, excursions, and private transfers.",
  alternates: { canonical: "/about", languages: { ...languageAlternates("/about"), "x-default": localePath("en", "/about") } },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 pb-20 pt-32 sm:px-8">
      <article className="mx-auto max-w-5xl">
        <p className="font-semibold uppercase tracking-[0.28em] text-cyan-700">Local help in Hurghada</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-black text-slate-950 sm:text-6xl">Memorable Red Sea days, made easier.</h1>
        <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-600">Daily Red Sea helps travelers choose and arrange tours, boat trips, desert experiences, historical day trips, and private transfers in and around Hurghada. We focus on clear information, practical local support, and straightforward booking.</p>

        <section className="mt-12 grid gap-5 md:grid-cols-2">
          {[
            { icon: MapPin, title: "Local knowledge", text: "Advice grounded in Hurghada pickup areas, trip timings, and the practical details visitors need." },
            { icon: BadgeCheck, title: "Selected experiences", text: "A focused collection of tours and transfers with clear inclusions and starting prices." },
            { icon: MessageCircle, title: "Human confirmation", text: "Our team confirms availability and pickup details directly by WhatsApp." },
            { icon: ShieldCheck, title: "Transparent booking", text: "Your date, travelers, total, payment method, and important requirements are shown before confirmation." },
          ].map(({ icon: Icon, title, text }) => <div key={title} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"><Icon className="text-cyan-700" /><h2 className="mt-5 text-xl font-black text-slate-950">{title}</h2><p className="mt-3 leading-7 text-slate-600">{text}</p></div>)}
        </section>

        <section className="mt-12 rounded-[2rem] bg-slate-950 p-8 text-white sm:p-10"><h2 className="text-3xl font-black">Planning something specific?</h2><p className="mt-4 max-w-2xl leading-7 text-slate-300">Tell us your dates, hotel, group size, and interests. We will help you choose an appropriate available experience without adding hidden costs.</p><div className="mt-7 flex flex-wrap gap-3"><a href={whatsappUrl("Hello Daily Red Sea, I would like help planning my Hurghada trip.")} target="_blank" rel="noopener noreferrer" className="rounded-full bg-green-600 px-6 py-3 font-bold text-white">Ask our local team</a><Link href="/#tours" className="rounded-full border border-white/20 px-6 py-3 font-bold">Explore tours</Link></div></section>
      </article>
    </main>
  );
}
