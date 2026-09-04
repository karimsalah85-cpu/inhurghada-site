"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Application error", error.digest); }, [error]);
  return <main className="grid min-h-screen place-items-center bg-surface-muted p-6"><section className="max-w-lg rounded-3xl border border-line bg-white p-8 text-center shadow-sm"><h1 className="text-3xl font-black text-ink">Something went wrong</h1><p className="mt-3 text-muted">Please try again. If the problem continues, contact Daily Red Sea support.</p><div className="mt-7 flex justify-center gap-3"><button type="button" onClick={reset} className="rounded-full bg-ocean-dark px-5 py-3 font-bold text-white">Try again</button><Link href="/" className="rounded-full border border-line px-5 py-3 font-bold text-ink">Go home</Link></div></section></main>;
}
