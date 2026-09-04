import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The Daily Red Sea page you requested could not be found.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-surface-muted px-6 py-24">
      <section className="max-w-xl rounded-3xl border border-line bg-white p-10 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-ocean-dark">Error 404</p>
        <h1 className="mt-4 text-4xl font-black text-ink">This page is not available</h1>
        <p className="mt-4 leading-7 text-muted">
          The link may be outdated, or the page may have moved. Explore our current Red Sea tours and transfers instead.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="rounded-full bg-ocean-dark px-5 py-3 font-bold text-white hover:brightness-90">Explore tours</Link>
          <Link href="/transfers" className="rounded-full border border-line px-5 py-3 font-bold text-ink hover:border-ocean-dark hover:text-ocean-dark">Book a transfer</Link>
        </div>
      </section>
    </main>
  );
}
