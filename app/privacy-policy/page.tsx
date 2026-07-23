import Link from "next/link";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description: "Privacy policy for Daily Red Sea tours and transfer bookings.",
  path: "/privacy-policy",
});

export default function PrivacyPolicyPage({ locale = "en" }: { locale?: "en" | "de" }) {
  const de = locale === "de";
  return (
    <main className="mx-auto max-w-5xl px-6 py-24 lg:px-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">{de ? "Rechtliches" : "Legal"}</p>
        <h1 className="mt-4 text-4xl font-black text-slate-900">{de ? "Datenschutzerklärung" : "Privacy Policy"}</h1>
        <p className="mt-6 text-lg leading-8 text-slate-600">
          {de ? "Diese Datenschutzerklärung erläutert, wie Daily Red Sea personenbezogene Daten bei der Buchung eines Ausflugs oder Transfers erhebt, verwendet und schützt." : "This privacy policy explains how Daily Red Sea collects, uses, and protects your personal information when you book a tour or transfer."}
        </p>
        <div className="mt-10 space-y-6 text-slate-700">
          <section>
            <h2 className="text-xl font-bold text-slate-900">{de ? "Erhobene Informationen" : "Information we collect"}</h2>
            <p className="mt-3 leading-8">{de ? "Wir erheben Name, Telefonnummer, E-Mail-Adresse, Reisedatum, Hotel- oder Abholdetails und Buchungswünsche, wenn du eine Anfrage oder Buchung sendest." : "We collect your name, phone number, email address, travel date, hotel or pickup details, and booking preferences when you submit an inquiry or booking request."}</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-slate-900">{de ? "Verwendung der Daten" : "How we use it"}</h2>
            <p className="mt-3 leading-8">{de ? "Wir verwenden die Daten, um Verfügbarkeit zu bestätigen, Abholungen zu koordinieren, über die Reise zu informieren und vor und nach der Buchung zu helfen." : "We use your information to confirm availability, coordinate pickups, communicate about your trip, and provide support before and after your booking."}</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-slate-900">{de ? "Kontakt" : "Contact"}</h2>
            <p className="mt-3 leading-8">{de ? "Bei Fragen zu dieser Erklärung kontaktiere uns per WhatsApp oder per E-Mail an info@dailyredsea.com." : "If you have questions about this policy, contact us on WhatsApp or by email at info@dailyredsea.com."}</p>
          </section>
        </div>
        <Link href={de ? "/de" : "/"} className="mt-10 inline-flex text-sm font-semibold text-cyan-700">← {de ? "Zur Startseite" : "Back to home"}</Link>
      </div>
    </main>
  );
}
