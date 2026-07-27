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
          {de ? "Mit einer Buchung bei Daily Red Sea stimmst du den folgenden Bedingungen für Ausflüge und Transfers in Hurghada zu." : "By booking a tour, transfer, or activity with Daily Red Sea, you agree to the terms below. These terms apply alongside any specific conditions shown on an individual tour page."}
        </p>
        <div className="mt-10 space-y-6 text-slate-700">
          <section>
            <h2 className="text-xl font-bold text-slate-900">{de ? "Buchungsbestätigung" : "Bookings & confirmation"}</h2>
            <p className="mt-3 leading-8">{de ? "Alle Buchungen werden nach Prüfung durch unser Team bestätigt. Die endgültigen Details senden wir per WhatsApp oder E-Mail." : "A request submitted through our website or WhatsApp is not confirmed until you receive confirmation from our team, including your final price, pickup details, and payment method. Please check your confirmation carefully and let us know immediately if any details are incorrect."}</p>
          </section>
          {!de ? <>
            <section>
              <h2 className="text-xl font-bold text-slate-900">Pricing & payment</h2>
              <p className="mt-3 leading-8">Prices are shown per person or per booking, in your selected currency, and include the inclusions listed on the tour page. Unless stated otherwise, payment is accepted in cash on arrival; some tours may require online prepayment or a deposit, which will be clearly indicated before you confirm. We do not add hidden fees on top of the listed price.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-slate-900">Pickup & participation</h2>
              <p className="mt-3 leading-8">Pickup times are estimates confirmed the day before (or on the morning of) your activity via WhatsApp, and may shift due to traffic, weather, or hotel location. Some activities have age, health, swimming ability, or fitness requirements listed on the tour page—please read these before booking and let us know of any relevant medical conditions in advance.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-slate-900">Changes to bookings</h2>
              <p className="mt-3 leading-8">If you need to change your date, group size, or pickup details, contact us on WhatsApp as early as possible. Changes are subject to availability and may not always be possible close to the activity date.</p>
            </section>
          </> : null}
          <section id="cancellations" className="scroll-mt-28">
            <h2 className="text-xl font-bold text-slate-900">{de ? "Stornierungen" : "Cancellations & Refunds"}</h2>
            {de
              ? <p className="mt-3 leading-8">Die Stornierungsbedingungen können je nach Ausflug variieren. Kontaktiere uns vor der Reise, wenn du eine Buchung ändern oder stornieren musst.</p>
              : <div className="mt-3 space-y-3 leading-8">
                  <p><strong className="text-slate-900">Free cancellation window:</strong> Unless a different window is stated on the specific tour page, cancellations made at least <strong className="text-slate-900">24 hours</strong> before the scheduled pickup time are eligible for a full refund (or no charge, for cash-on-arrival bookings).</p>
                  <p><strong className="text-slate-900">Late cancellations:</strong> Cancellations made <strong className="text-slate-900">within 24 hours</strong> of pickup, or no-shows, are not eligible for a refund, since local suppliers reserve your place and incur costs.</p>
                  <p><strong className="text-slate-900">Tour-specific terms:</strong> Some activities (for example, private tours, boats with limited capacity, or third-party operated experiences) may have a longer notice period or be non-refundable—this will always be shown on the tour page before you book.</p>
                  <p><strong className="text-slate-900">Cancellations by us:</strong> If we or our local supplier need to cancel or reschedule an activity (weather, safety, insufficient group size, or operational reasons), you&apos;ll be offered a full refund or the option to rebook another date or activity.</p>
                  <p><strong className="text-slate-900">How to cancel:</strong> Message us on WhatsApp with your booking reference as soon as possible. We&apos;ll confirm your refund eligibility and, where applicable, process it to your original payment method within a stated number of business days (for example, 5–7 days)—for cash-on-arrival bookings, no charge is made.</p>
                </div>}
          </section>
          <section>
            <h2 className="text-xl font-bold text-slate-900">{de ? "Haftung" : "Liability"}</h2>
            {de
              ? <p className="mt-3 leading-8">Daily Red Sea vermittelt und koordiniert Leistungen lokaler Anbieter und bemüht sich um einen reibungslosen Ablauf.</p>
              : <div className="mt-3 space-y-3 leading-8">
                  <p>Daily Red Sea operates as a <strong className="text-slate-900">booking and coordination platform</strong>, connecting travelers with local Hurghada-based operators, crews, guides, and drivers who deliver the activity itself.</p>
                  <p>Tours, boat trips, safaris, and transfers are carried out by independent local suppliers in accordance with their own safety standards and applicable Egyptian regulations.</p>
                  <p>Participation in water-based activities (snorkeling, diving, boat trips) and land-based activities (quad biking, desert safaris) carries inherent risk. Guests participate at their own risk and are expected to follow their guide&apos;s or crew&apos;s safety briefing and instructions at all times.</p>
                  <p>Daily Red Sea is not liable for injury, loss, illness, or damage arising from a guest&apos;s failure to follow safety instructions, pre-existing medical conditions not disclosed at booking, or acts outside our reasonable control (including weather, natural events, third-party acts, or force majeure).</p>
                  <p>Itineraries, routes, and timings may be adjusted by the local operator for safety or operational reasons; we&apos;ll aim to notify you of significant changes as early as possible.</p>
                  <p>Nothing in these terms excludes liability that cannot legally be excluded under applicable law.</p>
                </div>}
          </section>
        </div>
        <Link href={de ? "/de" : "/"} className="mt-10 inline-flex text-sm font-semibold text-cyan-700">← {de ? "Zur Startseite" : "Back to home"}</Link>
      </div>
    </main>
  );
}
