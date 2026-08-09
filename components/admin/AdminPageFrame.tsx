import Link from "next/link";

export default function AdminPageFrame({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-10"><div className="mx-auto max-w-6xl"><header className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-700">{eyebrow}</p><h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">{title}</h1><p className="mt-2 max-w-3xl leading-7 text-slate-600">{description}</p></div><Link href="/admin" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:border-slate-500">Dashboard</Link></header><div className="mt-8">{children}</div></div></main>;
}
