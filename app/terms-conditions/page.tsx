import Link from "next/link";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Terms & Conditions",
  description: "Terms and conditions for Daily Red Sea bookings and transfers.",
  path: "/terms-conditions",
});

export default function TermsConditionsPage({ locale = "en" }: { locale?: "en" | "de" }) {
  const de = locale === "de";
  return (
    <main className="mx-auto max-w-5xl px-6 py-24 lg:px-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">{de ? "Rechtliches" : "Legal"}</p>
        <h1 className="mt-4 text-4xl font-black text-slate-900">{de ? "Allgemeine Geschäftsbedingungen" : "Terms & Conditions"}</h1>
        <p className="mt-6 text-lg leading-8 text-slate-600">
          {de ? "Mit einer Buchung bei Daily Red Sea stimmst du den folgenden Bedingungen für Ausflüge und Transfers in Hurghada zu." : "By booking with Daily Red Sea, you agree to the following terms for tours, transfers, and excursions in Hurghada."}
        </p>
        <div className="mt-10 space-y-6 text-slate-700">
          <section>
            <h2 className="text-xl font-bold text-slate-900">{de ? "Buchungsbestätigung" : "Booking confirmation"}</h2>
            <p className="mt-3 leading-8">{de ? "Alle Buchungen werden nach Prüfung durch unser Team bestätigt. Die endgültigen Details senden wir per WhatsApp oder E-Mail." : "All bookings are confirmed after review and confirmation from our team. Final details will be shared on WhatsApp or by email."}</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-slate-900">{de ? "Stornierungen" : "Cancellations"}</h2>
            <p className="mt-3 leading-8">{de ? "Die Stornierungsbedingungen können je nach Ausflug variieren. Kontaktiere uns vor der Reise, wenn du eine Buchung ändern oder stornieren musst." : "Cancellation terms may vary by tour. Please contact us before your trip if you need to change or cancel a booking."}</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-slate-900">{de ? "Haftung" : "Liability"}</h2>
            <p className="mt-3 leading-8">{de ? "Daily Red Sea vermittelt und koordiniert Leistungen lokaler Anbieter und bemüht sich um einen reibungslosen Ablauf." : "Daily Red Sea acts as a booking and coordination service for local providers and will do its best to ensure a smooth experience."}</p>
          </section>
        </div>
        <Link href={de ? "/de" : "/"} className="mt-10 inline-flex text-sm font-semibold text-cyan-700">← {de ? "Zur Startseite" : "Back to home"}</Link>
      </div>
    </main>
  );
}
