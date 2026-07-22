import Link from "next/link";

export const metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for Daily Red Sea tours and transfer bookings.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-24 lg:px-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">Legal</p>
        <h1 className="mt-4 text-4xl font-black text-slate-900">Privacy Policy</h1>
        <p className="mt-6 text-lg leading-8 text-slate-600">
          This privacy policy explains how Daily Red Sea collects, uses, and protects your personal information when you book a tour or transfer.
        </p>
        <div className="mt-10 space-y-6 text-slate-700">
          <section>
            <h2 className="text-xl font-bold text-slate-900">Information we collect</h2>
            <p className="mt-3 leading-8">We collect your name, phone number, email address, travel date, hotel or pickup details, and booking preferences when you submit an inquiry or booking request.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-slate-900">How we use it</h2>
            <p className="mt-3 leading-8">We use your information to confirm availability, coordinate pickups, communicate about your trip, and provide support before and after your booking.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-slate-900">Contact</h2>
            <p className="mt-3 leading-8">If you have questions about this policy, contact us on WhatsApp or by email at info@dailyredsea.com.</p>
          </section>
        </div>
        <Link href="/" className="mt-10 inline-flex text-sm font-semibold text-cyan-700">← Back to home</Link>
      </div>
    </main>
  );
}
