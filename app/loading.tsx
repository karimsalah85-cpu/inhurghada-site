export default function Loading() {
  return <main className="min-h-screen bg-slate-50 px-6 py-28" aria-busy="true" aria-label="Loading content"><div className="mx-auto max-w-7xl animate-pulse space-y-6"><div className="h-10 w-2/5 rounded bg-slate-200" /><div className="h-64 rounded-3xl bg-slate-200" /><div className="grid gap-6 md:grid-cols-3"><div className="h-48 rounded-3xl bg-slate-200" /><div className="h-48 rounded-3xl bg-slate-200" /><div className="h-48 rounded-3xl bg-slate-200" /></div><p className="sr-only" role="status">Loading content</p></div></main>;
}
