import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl } from "@/lib/seo";
import { languageAlternates, localePath } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Hurghada Tours and Transfers FAQ",
  description: "Answers about booking, payment, pickup, cancellation, passports, children, and private transfers with Daily Red Sea.",
  alternates: { canonical: "/faq", languages: { ...languageAlternates("/faq"), "x-default": localePath("en", "/faq") } },
};

const faqs = [
  { question: "How do I book?", answer: "Choose an experience, select the available date, time, and travelers, then submit your details. We confirm availability and pickup information by email or WhatsApp." },
  { question: "When and how do I pay?", answer: "Most bookings are reserved online and paid in cash on arrival. The payment method and total are shown before you submit the booking." },
  { question: "Is hotel pickup included?", answer: "Pickup information is listed on each tour page. Some resort areas can have an additional transfer charge; any applicable amount is shown or confirmed before service." },
  { question: "Do I need a passport?", answer: "Tours and excursions may require a valid passport, ID, or copy for travel permits. This requirement does not apply to ordinary private transfer services unless authorities specifically request identification." },
  { question: "Can children and infants join?", answer: "Age rules and child prices depend on the experience. Available adult, youth, and infant options are shown in the booking form." },
  { question: "Can I cancel or change a booking?", answer: "Contact us as early as possible. Tour-specific cancellation terms apply, and availability determines whether a date, time, or group-size change is possible." },
  { question: "How is my pickup time confirmed?", answer: "Select a listed time where available. When timing depends on the hotel, flight, weather, or sunset, our team confirms the exact pickup time by WhatsApp." },
  { question: "Are transfer prices per person?", answer: "Airport and Senzo Mall transfers use the fixed one-way fare described on their booking pages. Tours normally show per-person pricing unless clearly marked otherwise." },
];

const germanFaqs = [
  { question: "Wie buche ich?", answer: "Wähle ein Erlebnis, Datum, Uhrzeit und die Anzahl der Reisenden und sende anschließend deine Angaben. Wir bestätigen Verfügbarkeit und Abholung per E-Mail oder WhatsApp." },
  { question: "Wann und wie bezahle ich?", answer: "Die meisten Buchungen werden online reserviert und bei Ankunft bar bezahlt. Zahlungsart und Gesamtpreis werden vor dem Absenden angezeigt." },
  { question: "Ist die Hotelabholung inklusive?", answer: "Die Abholinformationen stehen auf jeder Ausflugsseite. Für einige Resortgebiete kann ein Zuschlag gelten, der vor der Leistung angezeigt oder bestätigt wird." },
  { question: "Brauche ich einen Reisepass?", answer: "Für Ausflüge kann ein gültiger Reisepass, Ausweis oder eine Kopie für Reisegenehmigungen erforderlich sein. Für gewöhnliche Privattransfers gilt dies normalerweise nicht." },
  { question: "Können Kinder und Kleinkinder teilnehmen?", answer: "Altersregeln und Kinderpreise hängen vom Erlebnis ab. Verfügbare Optionen werden im Buchungsformular angezeigt." },
  { question: "Kann ich eine Buchung stornieren oder ändern?", answer: "Kontaktiere uns so früh wie möglich. Es gelten die Bedingungen des jeweiligen Ausflugs; Änderungen hängen von der Verfügbarkeit ab." },
  { question: "Wie wird meine Abholzeit bestätigt?", answer: "Wähle eine angegebene Uhrzeit. Wenn die Zeit von Hotel, Flug, Wetter oder Sonnenuntergang abhängt, bestätigt unser Team sie per WhatsApp." },
  { question: "Gelten Transferpreise pro Person?", answer: "Flughafen- und Senzo-Mall-Transfers haben den auf der Buchungsseite beschriebenen Festpreis für eine einfache Fahrt. Ausflüge werden normalerweise pro Person berechnet." },
];

export default function FaqPage({ locale = "en" }: { locale?: "en" | "de" }) {
  const de = locale === "de";
  const displayedFaqs = de ? germanFaqs : faqs;
  const schema = { "@context": "https://schema.org", "@type": "FAQPage", url: absoluteUrl(de ? "/de/faq" : "/faq"), mainEntity: displayedFaqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })) };
  return (
    <main className="min-h-screen bg-slate-50 px-6 pb-20 pt-32 sm:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <div className="mx-auto max-w-4xl">
        <p className="font-semibold uppercase tracking-[0.28em] text-cyan-700">{de ? "Hilfreiche Antworten" : "Helpful answers"}</p>
        <h1 className="mt-4 text-4xl font-black text-slate-950 sm:text-6xl">{de ? "FAQ zu Ausflügen und Transfers" : "Tours and transfers FAQ"}</h1>
        <p className="mt-6 text-lg leading-8 text-slate-600">{de ? "Klare Antworten auf praktische Fragen vor der Buchung in Hurghada." : "Clear answers to the practical questions travelers ask before booking in Hurghada."}</p>
        <div className="mt-10 divide-y divide-slate-200 rounded-3xl border border-slate-200 bg-white px-7 shadow-sm">{displayedFaqs.map((faq) => <details key={faq.question} className="py-6"><summary className="cursor-pointer text-lg font-bold text-slate-950">{faq.question}</summary><p className="mt-4 leading-8 text-slate-600">{faq.answer}</p></details>)}</div>
        <div className="mt-8 flex flex-wrap gap-3"><Link href={de ? "/de#tours" : "/#tours"} className="rounded-full bg-blue-700 px-6 py-3 font-bold text-white">{de ? "Ausflüge entdecken" : "Explore tours"}</Link><Link href={de ? "/de/contact" : "/contact"} className="rounded-full border border-slate-300 px-6 py-3 font-bold text-slate-800">{de ? "Kontakt" : "Contact us"}</Link></div>
      </div>
    </main>
  );
}
