import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquareText, ShieldCheck } from "lucide-react";
import { googleReviewUrl } from "@/lib/contact";
import GoogleReviews from "@/components/reviews/GoogleReviews";
import TripReviewForm from "@/components/reviews/TripReviewForm";

export const metadata: Metadata = {
  title: "Review Your Trip | Daily Red Sea",
  description: "Share your experience after a Daily Red Sea tour, activity or transfer.",
  robots: { index: false, follow: true },
};

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ ref?: string; email?: string }> }) {
  const params = await searchParams;
  return <main className="min-h-screen bg-slate-50 px-6 pb-20 pt-32">
    <GoogleReviews className="mx-auto mb-10 max-w-6xl" />
    <section className="mx-auto max-w-3xl overflow-hidden rounded-3xl bg-white shadow-xl">
      <div className="bg-slate-950 p-8 text-white sm:p-12">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">Post-trip feedback</p>
        <h1 className="mt-4 text-4xl font-black sm:text-5xl">Review your Daily Red Sea trip</h1>
        <p className="mt-4 max-w-2xl leading-7 text-slate-300">Thank you for travelling with us. Your honest feedback helps future guests and helps our team improve every experience.</p>
      </div>
      <div className="space-y-8 p-8 sm:p-12">
        <div>
          <h2 className="font-black text-slate-950">Rate the trip you booked</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">This review is checked by our team and shown on the trip&apos;s own page once approved. It&apos;s only open to guests with a completed booking.</p>
          <div className="mt-4"><TripReviewForm initialReference={params.ref || ""} initialEmail={params.email || ""} /></div>
        </div>
        <div className="border-t border-slate-100 pt-8">
          <h2 className="font-black text-slate-950">Prefer Google?</h2>
          <a href={googleReviewUrl} target="_blank" rel="noopener noreferrer" className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-6 py-4 text-lg font-black text-white hover:bg-blue-800"><MessageSquareText size={21}/>Write your Google review</a>
          <div className="mt-3 flex items-start gap-3 text-sm leading-6 text-slate-600"><ShieldCheck className="mt-0.5 shrink-0 text-emerald-600" size={19}/><p>Reviews are submitted directly to Google under Google’s policies. Daily Red Sea cannot edit your review.</p></div>
        </div>
        <Link href="/#tours" className="block text-center font-bold text-cyan-800 hover:underline">Return to tours</Link>
      </div>
    </section>
  </main>;
}
