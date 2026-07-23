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

export default function AboutPage({ locale = "en" }: { locale?: "en" | "de" }) {
  const de = locale === "de";
  return (
    <main className="min-h-screen bg-slate-50 px-6 pb-20 pt-32 sm:px-8">
      <article className="mx-auto max-w-5xl">
        <p className="font-semibold uppercase tracking-[0.28em] text-cyan-700">{de ? "Lokale Hilfe in Hurghada" : "Local help in Hurghada"}</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-black text-slate-950 sm:text-6xl">{de ? "Unvergessliche Tage am Roten Meer – einfach geplant." : "Memorable Red Sea days, made easier."}</h1>
        <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-600">{de ? "Daily Red Sea hilft Reisenden bei der Auswahl und Organisation von Ausflügen, Bootstouren, Wüstenerlebnissen, historischen Tagesausflügen und privaten Transfers in und um Hurghada. Wir setzen auf klare Informationen, praktische lokale Unterstützung und eine unkomplizierte Buchung." : "Daily Red Sea helps travelers choose and arrange tours, boat trips, desert experiences, historical day trips, and private transfers in and around Hurghada. We focus on clear information, practical local support, and straightforward booking."}</p>

        <section className="mt-12 grid gap-5 md:grid-cols-2">
          {[
            { icon: MapPin, title: de ? "Lokale Kenntnisse" : "Local knowledge", text: de ? "Praktische Beratung zu Abholgebieten, Zeiten und wichtigen Details in Hurghada." : "Advice grounded in Hurghada pickup areas, trip timings, and the practical details visitors need." },
            { icon: BadgeCheck, title: de ? "Ausgewählte Erlebnisse" : "Selected experiences", text: de ? "Eine übersichtliche Auswahl an Ausflügen und Transfers mit klaren Leistungen und Startpreisen." : "A focused collection of tours and transfers with clear inclusions and starting prices." },
            { icon: MessageCircle, title: de ? "Persönliche Bestätigung" : "Human confirmation", text: de ? "Unser Team bestätigt Verfügbarkeit und Abholdetails direkt per WhatsApp." : "Our team confirms availability and pickup details directly by WhatsApp." },
            { icon: ShieldCheck, title: de ? "Transparente Buchung" : "Transparent booking", text: de ? "Datum, Reisende, Gesamtpreis, Zahlungsart und wichtige Anforderungen werden vor der Bestätigung angezeigt." : "Your date, travelers, total, payment method, and important requirements are shown before confirmation." },
          ].map(({ icon: Icon, title, text }) => <div key={title} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"><Icon className="text-cyan-700" /><h2 className="mt-5 text-xl font-black text-slate-950">{title}</h2><p className="mt-3 leading-7 text-slate-600">{text}</p></div>)}
        </section>

        <section className="mt-12 rounded-[2rem] bg-slate-950 p-8 text-white sm:p-10"><h2 className="text-3xl font-black">{de ? "Planst du etwas Besonderes?" : "Planning something specific?"}</h2><p className="mt-4 max-w-2xl leading-7 text-slate-300">{de ? "Nenne uns Reisedaten, Hotel, Gruppengröße und Interessen. Wir helfen dir, ein passendes verfügbares Erlebnis ohne versteckte Kosten zu finden." : "Tell us your dates, hotel, group size, and interests. We will help you choose an appropriate available experience without adding hidden costs."}</p><div className="mt-7 flex flex-wrap gap-3"><a href={whatsappUrl(de ? "Hallo Daily Red Sea, ich möchte Hilfe bei der Planung meiner Hurghada-Reise." : "Hello Daily Red Sea, I would like help planning my Hurghada trip.")} target="_blank" rel="noopener noreferrer" className="rounded-full bg-green-600 px-6 py-3 font-bold text-white">{de ? "Lokales Team fragen" : "Ask our local team"}</a><Link href={de ? "/de#tours" : "/#tours"} className="rounded-full border border-white/20 px-6 py-3 font-bold">{de ? "Ausflüge entdecken" : "Explore tours"}</Link></div></section>
      </article>
    </main>
  );
}
