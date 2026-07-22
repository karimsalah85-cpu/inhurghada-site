"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Application error", error.digest); }, [error]);
  return <main className="grid min-h-screen place-items-center bg-slate-50 p-6"><section className="max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm"><h1 className="text-3xl font-black text-slate-950">Something went wrong</h1><p className="mt-3 text-slate-600">Please try again. If the problem continues, contact Daily Red Sea support.</p><div className="mt-7 flex justify-center gap-3"><button type="button" onClick={reset} className="rounded-full bg-cyan-700 px-5 py-3 font-bold text-white">Try again</button><Link href="/" className="rounded-full border border-slate-300 px-5 py-3 font-bold text-slate-800">Go home</Link></div></section></main>;
}
