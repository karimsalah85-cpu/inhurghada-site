import Link from "next/link";
import { BadgeCheck, Bus, Car, Luggage, MapPin, Users } from "lucide-react";
import AirportTransferForm from "@/components/booking/AirportTransferForm";
import AirportTransferPolicy from "@/components/pages/AirportTransferPolicy";
import { localePath, type Locale } from "@/lib/i18n";
import { enabledVehicleClasses } from "@/lib/transfer-config";
import { transferCopy } from "@/lib/transfer-copy";

export default function TransfersPage({ locale = "en" }: { locale?: Locale }) {
  const copy = transferCopy[locale];
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Service", name: copy.title, serviceType: "Private airport, hotel and marina transfers", areaServed: ["Hurghada", "El Gouna", "Sahl Hasheesh", "Makadi Bay", "Soma Bay", "Safaga", "El Quseir", "Port Ghalib", "Marsa Alam"], provider: { "@type": "TravelAgency", name: "Daily Red Sea", url: "https://dailyredsea.com" }, url: `https://dailyredsea.com${localePath(locale, "/transfers")}` },
      { "@type": "FAQPage", mainEntity: copy.faqs.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) },
    ],
  };

  return (
    <main className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <section className="relative bg-ink bg-cover bg-center px-4 pb-8 pt-24 text-white sm:px-8 sm:pb-20 sm:pt-40" style={{ backgroundImage: "linear-gradient(90deg,rgba(4,24,39,.9),rgba(4,24,39,.55)),url('/images/owned/hurghada-transfer-road-sunset.jpg')" }}>
        <div className="mx-auto max-w-6xl">
          <p className="hidden text-sm font-bold uppercase tracking-widest text-ocean-soft sm:block">{copy.intro}</p>
          <h1 className="mt-3 max-w-4xl text-3xl font-black leading-tight sm:text-6xl">{copy.title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 sm:text-lg sm:leading-8 text-white/90">{copy.description}</p>
          <a href="#book-transfer" className="mt-7 inline-flex min-h-12 items-center rounded-xl bg-cta px-6 py-3 font-bold text-white hover:bg-cta-dark">{copy.book}</a>
          <ul className="mt-5 flex flex-wrap gap-x-7 gap-y-2 text-sm font-semibold">
            {copy.benefits.map((benefit) => <li key={benefit} className="flex items-center gap-2"><BadgeCheck size={18} aria-hidden="true" />{benefit}</li>)}
          </ul>
        </div>
      </section>
      <section id="book-transfer" className="scroll-mt-24 bg-surface-muted px-3 py-6 sm:px-8 sm:py-16">
        <div className="mx-auto grid max-w-6xl items-start gap-8 lg:gap-12">
          <div className="order-2 min-w-0">
            <h2 className="text-3xl font-black text-ink">{copy.routeTitle}</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {copy.routeGroups.map((group) => <article key={group.title} className="rounded-2xl border border-line bg-white p-5"><MapPin className="text-ocean-dark" size={22} aria-hidden="true" /><h3 className="mt-3 text-lg font-bold text-ink">{group.title}</h3><p className="mt-2 text-sm leading-6 text-muted">{group.text}</p></article>)}
            </div>
            <div className="mt-8">
              <h2 className="text-2xl font-black text-ink">{copy.vehicleTitle}</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {enabledVehicleClasses().map((vehicle) => {
                  const Icon = vehicle.vehicleClass === "sedan" ? Car : Bus;
                  return <article key={vehicle.vehicleClass} className="rounded-2xl border border-line bg-white p-5"><Icon size={42} className="text-ocean-dark" aria-hidden="true" /><h3 className="mt-3 font-bold text-ink">{vehicle.vehicleClass === "sedan" ? copy.sedan : copy.van}</h3><ul className="mt-3 space-y-2 text-sm text-muted"><li className="flex items-center gap-2"><Users size={16} aria-hidden="true" />{vehicle.passengerCapacity} {copy.passengers}</li><li className="flex items-center gap-2"><Luggage size={16} aria-hidden="true" />{vehicle.largeBagCapacity} {copy.bags} · {vehicle.cabinBagCapacity} {copy.cabinBags}</li></ul></article>;
                })}
              </div>
              <p className="mt-4 text-sm leading-6 text-muted">{copy.fleetNote}</p>
            </div>
          </div>
          <div className="order-1 min-w-0"><AirportTransferForm wide /></div>
        </div>
      </section>
      <section className="px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-black text-ink">{copy.faqTitle}</h2>
          <div className="mt-6 divide-y divide-line rounded-2xl border border-line px-5">
            {copy.faqs.map(({ question, answer }) => <details key={question} className="py-5"><summary className="cursor-pointer font-bold text-ink">{question}</summary><p className="mt-3 leading-7 text-muted">{answer}</p></details>)}
          </div>
        </div>
      </section>
      <AirportTransferPolicy locale={locale} />
      <nav aria-label={copy.routeTitle} className="mx-auto flex max-w-6xl flex-wrap gap-6 px-5 py-10 font-bold text-ocean-dark sm:px-8">
        <Link className="underline underline-offset-4" href={localePath(locale, "/destinations/hurghada")}>Hurghada</Link>
        <Link className="underline underline-offset-4" href={localePath(locale, "/destinations/marsa-alam")}>Marsa Alam</Link>
      </nav>
    </main>
  );
}
