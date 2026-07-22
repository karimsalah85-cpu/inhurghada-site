import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The Daily Red Sea page you requested could not be found.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6 py-24">
      <section className="max-w-xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-700">Error 404</p>
        <h1 className="mt-4 text-4xl font-black text-slate-950">This page is not available</h1>
        <p className="mt-4 leading-7 text-slate-600">
          The link may be outdated, or the page may have moved. Explore our current Hurghada tours and transfers instead.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="rounded-full bg-cyan-700 px-5 py-3 font-bold text-white hover:bg-cyan-800">Explore tours</Link>
          <Link href="/transfers" className="rounded-full border border-slate-300 px-5 py-3 font-bold text-slate-800 hover:border-cyan-700 hover:text-cyan-800">Book a transfer</Link>
        </div>
      </section>
    </main>
  );
}
