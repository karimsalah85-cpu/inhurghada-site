"use client";
import { useEffect, useState, type FormEvent } from "react";
import { tours } from "@/data/tours";
import type { PromoCode } from "@/lib/promo-codes";
export default function AdminPromoCodes() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [truncated, setTruncated] = useState(false);
  const [kind, setKind] = useState("percent");
  async function load() {
    const response = await fetch("/api/admin/promo-codes", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not load codes.");
    setCodes(result.codes); setTruncated(Boolean(result.truncated));
  }
  useEffect(() => {
    const timeout = window.setTimeout(() => { void load().catch(reason => setError(reason.message)); }, 0);
    return () => window.clearTimeout(timeout);
  }, []);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget;
    setBusy(true); setError(""); setNotice("");
    try {
      const data = Object.fromEntries(new FormData(form));
      for (const key of ["starts_at", "expires_at"]) if (data[key]) data[key] = new Date(String(data[key])).toISOString();
      const response = await fetch("/api/admin/promo-codes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not create code.");
      form.reset(); setKind("percent"); setNotice(`Promo code ${result.code.code} created.`); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not create code."); }
    finally { setBusy(false); }
  }
  async function toggle(code: PromoCode) {
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/promo-codes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: code.id, active: !code.active }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Could not update code.");
      setNotice(`${code.code} ${code.active ? "disabled" : "enabled"}.`); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not update code."); }
    finally { setBusy(false); }
  }
  const field = "mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal";
  return <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-8">
    <h1 className="text-3xl font-black">Promo codes</h1><p className="mt-2 text-sm text-slate-600">Create discounts customers can apply to trip bookings. Codes are redeemed when a booking is saved, including cash-on-arrival bookings.</p>
    {error ? <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-4 text-rose-800">{error}</p> : null}
    {notice ? <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-4 text-emerald-800">{notice}</p> : null}
    <form onSubmit={create} className="mt-6 grid gap-4 rounded-2xl bg-slate-50 p-5 sm:grid-cols-2">
      <label className="text-sm font-bold">Code<input name="code" required minLength={3} maxLength={32} pattern="[A-Za-z0-9][A-Za-z0-9_-]{2,31}" placeholder="WELCOME10" className={`${field} uppercase`}/></label>
      <label className="text-sm font-bold">Discount type<select name="discount_type" value={kind} onChange={e => setKind(e.target.value)} className={field}><option value="percent">Percentage</option><option value="fixed">Fixed amount</option></select></label>
      <label className="text-sm font-bold">{kind === "percent" ? "Discount (%)" : "Discount amount"}<input name="discount_value" type="number" required min="0.01" step="0.01" max={kind === "percent" ? 100 : undefined} className={field}/></label>
      <label className="text-sm font-bold">Currency<select name="currency" required={kind === "fixed"} className={field}><option value="">Any currency (percentage only)</option><option>USD</option><option>EUR</option><option>SAR</option></select></label>
      <label className="text-sm font-bold">Minimum booking amount<input name="minimum_amount" type="number" min="0" step="0.01" defaultValue="0" className={field}/><span className="text-xs font-normal text-slate-500">Select a currency when setting a minimum.</span></label>
      <label className="text-sm font-bold">Maximum bookings<input name="max_redemptions" type="number" min="1" step="1" placeholder="Unlimited" className={field}/></label>
      <label className="text-sm font-bold">Starts at<input name="starts_at" type="datetime-local" className={field}/></label>
      <label className="text-sm font-bold">Expires at<input name="expires_at" type="datetime-local" className={field}/></label>
      <p className="text-xs text-slate-500 sm:col-span-2">Dates use your device timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}. Leave blank for no date restriction.</p>
      <label className="text-sm font-bold sm:col-span-2">Eligible trip<select name="tour_slug" className={field}><option value="">All trips</option>{tours.map(tour => <option key={tour.slug} value={tour.slug}>{tour.title}</option>)}</select></label>
      <p className="text-xs text-slate-500 sm:col-span-2">A trip-specific code applies only when every trip in the booking matches. Transfers are excluded. Cancellations do not restore uses. Discount terms stay fixed; disable a code and create a new one to change them.</p>
      <button disabled={busy} className="rounded-xl bg-cyan-700 px-5 py-3 font-bold text-white disabled:opacity-50 sm:col-span-2">{busy ? "Saving…" : "Create promo code"}</button>
    </form>
    <h2 className="mt-8 text-xl font-black">Existing codes</h2>
    {truncated ? <p className="mt-2 text-sm text-amber-800">Showing the latest 200 codes.</p> : null}
    <div className="mt-4 grid gap-3">{codes.map(code => <article key={code.id} className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 p-4"><div className="min-w-0"><h3 className="break-all font-mono text-lg font-black">{code.code}</h3><p className="mt-1 text-sm">{code.discount_value}{code.discount_type === "percent" ? "%" : ` ${code.currency}`} off · {code.active ? "Enabled" : "Disabled"}</p><p className="mt-1 text-xs text-slate-500">{code.redeemed_count} / {code.max_redemptions ?? "unlimited"} uses · {code.tour_slug || "All trips"}{code.currency ? ` · ${code.currency} bookings` : ""}</p><p className="mt-1 text-xs text-slate-500">Minimum: {code.minimum_amount} {code.currency || ""} · Starts: {code.starts_at ? new Date(code.starts_at).toLocaleString() : "Immediately"} · Expires: {code.expires_at ? new Date(code.expires_at).toLocaleString() : "Never"}</p></div><button type="button" disabled={busy} onClick={() => void toggle(code)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold disabled:opacity-50">{code.active ? "Disable" : "Enable"} {code.code}</button></article>)}</div>
    {!codes.length ? <p className="mt-4 text-sm text-slate-500">No promo codes loaded.</p> : null}
  </section>;
}
