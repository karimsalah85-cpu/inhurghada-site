export default function Loading() {
  return <main className="min-h-screen bg-surface-muted px-6 py-28" aria-busy="true" aria-label="Page is loading"><div className="mx-auto max-w-7xl animate-pulse space-y-6" aria-hidden="true"><div className="h-10 w-2/5 rounded bg-line" /><div className="h-64 rounded-3xl bg-line" /><div className="grid gap-6 md:grid-cols-3"><div className="h-48 rounded-3xl bg-line" /><div className="h-48 rounded-3xl bg-line" /><div className="h-48 rounded-3xl bg-line" /></div></div><p className="sr-only" role="status">Page is loading</p></main>;
}
