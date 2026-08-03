import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquareText, ShieldCheck, Star } from "lucide-react";
import { googleReviewUrl } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Review Your Trip | Daily Red Sea",
  description: "Share your experience after a Daily Red Sea tour, activity or transfer.",
  robots: { index: false, follow: true },
};

export default function ReviewsPage() {
  return <main className="min-h-screen bg-slate-50 px-6 pb-20 pt-32">
    <section className="mx-auto max-w-3xl overflow-hidden rounded-3xl bg-white shadow-xl">
      <div className="bg-slate-950 p-8 text-white sm:p-12">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">Post-trip feedback</p>
        <h1 className="mt-4 text-4xl font-black sm:text-5xl">Review your Daily Red Sea trip</h1>
        <p className="mt-4 max-w-2xl leading-7 text-slate-300">Thank you for travelling with us. Your honest feedback helps future guests and helps our team improve every experience.</p>
      </div>
      <div className="space-y-6 p-8 sm:p-12">
        <div className="flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5"><Star className="mt-0.5 shrink-0 text-amber-600"/><div><h2 className="font-black text-slate-950">Share your public review</h2><p className="mt-2 text-sm leading-6 text-slate-600">Mention the trip you joined, the service date and what you enjoyed. Please do not include private booking or payment details.</p></div></div>
        <a href={googleReviewUrl} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-6 py-4 text-lg font-black text-white hover:bg-blue-800"><MessageSquareText size={21}/>Write your Google review</a>
        <div className="flex items-start gap-3 text-sm leading-6 text-slate-600"><ShieldCheck className="mt-0.5 shrink-0 text-emerald-600" size={19}/><p>Reviews are submitted directly to Google under Google’s policies. Daily Red Sea cannot edit your review.</p></div>
        <Link href="/#tours" className="block text-center font-bold text-cyan-800 hover:underline">Return to tours</Link>
      </div>
    </section>
  </main>;
}
