"use client";
import { useEffect, useState } from "react";
import { Copy, MessageCircle, Stethoscope } from "lucide-react";
import {
  certificationLabels, certificationLevels, guestRequirementLimits, readGuestRequirements, type GuestRequirements,
} from "@/lib/guest-requirements";

type WaiverSummary = {
  id: string; participant_name: string; date_of_birth: string | null; certification: string | null; signature_name: string;
  signed_at: string; waiver_version: string; photo_consent: boolean; medical_flagged: boolean; medical_yes: string[];
};
type WaiverPayload =
  | { required: false }
  | { required: true; pending: boolean; needed: number; signed: number; label: string; link: string | null; whatsapp_url: string | null; template_notice: string | null; current_version: string; waivers: WaiverSummary[] };

const stamp = (value: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Cairo" }).format(new Date(value));
type Form = { nonSwimmers: string; medical: string; dietary: string; certification: string; certificationNumber: string; other: string };
const toForm = (value: GuestRequirements): Form => ({
  nonSwimmers: value.nonSwimmers ? String(value.nonSwimmers) : "",
  medical: value.medical || "", dietary: value.dietary || "", certification: value.certification || "",
  certificationNumber: value.certificationNumber || "", other: value.other || "",
});

/**
 * Guest requirements (editable) and diving waiver status for the booking
 * detail panel. `requirements` is undefined when the bookings column has not
 * been migrated yet — the section then shows "database upgrade pending".
 */
export default function BookingGuestNeeds({ bookingId, requirements, migrated }: { bookingId: string; requirements: unknown; migrated: boolean }) {
  const [saved, setSaved] = useState<GuestRequirements>(() => readGuestRequirements(requirements));
  const [form, setForm] = useState<Form>(() => toForm(readGuestRequirements(requirements)));
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [waivers, setWaivers] = useState<WaiverPayload | null>(null);
  const [waiverError, setWaiverError] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`/api/admin/bookings/${bookingId}/waivers`, { cache: "no-store" })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || "Waivers could not be loaded."); return data as WaiverPayload; })
      .then((data) => { if (active) setWaivers(data); })
      .catch((error) => { if (active) setWaiverError(error instanceof Error ? error.message : "Waivers could not be loaded."); });
    return () => { active = false; };
  }, [bookingId]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setMessage(null);
    try {
      const payload = { ...form, nonSwimmers: form.nonSwimmers === "" ? null : Number(form.nonSwimmers) };
      const response = await fetch(`/api/admin/bookings/${bookingId}/requirements`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ guest_requirements: payload }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save.");
      const next = readGuestRequirements(data.guest_requirements);
      setSaved(next); setForm(toForm(next)); setEditing(false); setMessage({ tone: "ok", text: "Guest requirements saved." });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Could not save." });
    } finally { setBusy(false); }
  }

  async function copyLink(link: string) {
    try { await navigator.clipboard.writeText(link); setMessage({ tone: "ok", text: "Waiver link copied." }); }
    catch { window.prompt("Copy the waiver link:", link); }
  }

  const summary: [string, string][] = [
    ...(saved.nonSwimmers ? [["Non-swimmers", String(saved.nonSwimmers)] as [string, string]] : []),
    ...(saved.medical ? [["Medical", saved.medical] as [string, string]] : []),
    ...(saved.certification ? [["Certification", `${certificationLabels[saved.certification]}${saved.certificationNumber ? ` · #${saved.certificationNumber}` : ""}`] as [string, string]] : []),
    ...(saved.dietary ? [["Dietary", saved.dietary] as [string, string]] : []),
    ...(saved.other ? [["Other", saved.other] as [string, string]] : []),
  ];
  const field = "mt-1 w-full rounded-xl border bg-white p-2 text-sm font-normal";

  return <section aria-labelledby={`guest-needs-${bookingId}`} className="rounded-2xl border-2 border-sky-200 bg-sky-50 p-5">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <b id={`guest-needs-${bookingId}`} className="text-xs uppercase tracking-wider text-sky-900">Guest needs · crew & supplier</b>
      {migrated && !editing ? <button type="button" onClick={() => { setForm(toForm(saved)); setEditing(true); setMessage(null); }} className="rounded-lg border border-sky-300 bg-white px-3 py-1.5 text-xs font-bold text-sky-900">Edit requirements</button> : null}
    </div>
    {message ? <p role={message.tone === "error" ? "alert" : "status"} className={`mt-3 rounded-xl p-2 text-sm ${message.tone === "error" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-800"}`}>{message.text}</p> : null}

    {!migrated ? <p className="mt-3 text-sm text-slate-600">Guest requirements: database upgrade pending (apply the guest requirements migration).</p>
      : editing ? <form onSubmit={save} className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold">Non-swimmers<input type="number" min={0} max={guestRequirementLimits.nonSwimmers} step={1} value={form.nonSwimmers} onChange={(e) => setForm({ ...form, nonSwimmers: e.target.value })} className={field} /></label>
        <label className="text-sm font-semibold">Diving certification<select value={form.certification} onChange={(e) => setForm({ ...form, certification: e.target.value })} className={field}><option value="">Not recorded</option>{certificationLevels.map((level) => <option key={level} value={level}>{certificationLabels[level]}</option>)}</select></label>
        <label className="text-sm font-semibold">Certification number<input maxLength={guestRequirementLimits.certificationNumber} value={form.certificationNumber} onChange={(e) => setForm({ ...form, certificationNumber: e.target.value })} className={field} /></label>
        <label className="text-sm font-semibold">Dietary needs<input maxLength={guestRequirementLimits.dietary} placeholder="e.g. vegetarian, nut allergy" value={form.dietary} onChange={(e) => setForm({ ...form, dietary: e.target.value })} className={field} /></label>
        <label className="text-sm font-semibold sm:col-span-2">Medical notes<textarea rows={2} maxLength={guestRequirementLimits.medical} placeholder="e.g. asthma (inhaler on board), pregnant" value={form.medical} onChange={(e) => setForm({ ...form, medical: e.target.value })} className={field} /></label>
        <label className="text-sm font-semibold sm:col-span-2">Other<textarea rows={2} maxLength={guestRequirementLimits.other} value={form.other} onChange={(e) => setForm({ ...form, other: e.target.value })} className={field} /></label>
        <div className="flex gap-2 sm:col-span-2"><button disabled={busy} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">{busy ? "Saving…" : "Save requirements"}</button><button type="button" onClick={() => setEditing(false)} className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600">Cancel</button></div>
        <p className="text-xs text-slate-600 sm:col-span-2">Shown on the pickup manifest and in new supplier requests. Never include the guest&apos;s email.</p>
      </form>
      : summary.length ? <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">{summary.map(([label, value]) => <div key={label} className={label === "Medical" || label === "Other" ? "sm:col-span-2" : ""}><dt className="text-xs font-semibold text-slate-600">{label}</dt><dd className={`whitespace-pre-wrap wrap-break-word ${label === "Medical" ? "font-semibold text-rose-700" : ""}`}>{value}</dd></div>)}</dl>
      : <p className="mt-3 text-sm text-slate-600">No special requirements recorded.</p>}

    {waiverError ? <p className="mt-4 text-sm text-rose-700">{waiverError}</p> : null}
    {waivers?.required ? <div className="mt-5 border-t border-sky-200 pt-4">
      <div className="flex flex-wrap items-center gap-2">
        <b className="text-sm">Diving waiver</b>
        {waivers.pending ? <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-700">Database upgrade pending</span>
          : <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${waivers.signed >= waivers.needed && waivers.needed > 0 ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}`}>{waivers.label}</span>}
        {!waivers.pending && waivers.waivers.some((w) => w.medical_flagged) ? <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-800"><Stethoscope size={14} aria-hidden="true" />Medical flag — doctor&apos;s clearance needed</span> : null}
      </div>
      {waivers.template_notice ? <p className="mt-2 rounded-lg bg-amber-100 p-2 text-xs font-semibold text-amber-900">⚠ {waivers.template_notice}</p> : null}
      {waivers.link && !waivers.pending ? <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => copyLink(waivers.link!)} className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-2 text-xs font-bold"><Copy size={14} aria-hidden="true" />Copy waiver link</button>
        {waivers.whatsapp_url ? <a href={waivers.whatsapp_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white"><MessageCircle size={14} aria-hidden="true" />Send on WhatsApp</a> : <span className="self-center text-xs text-slate-500">No guest phone for WhatsApp</span>}
      </div> : null}
      {!waivers.pending && waivers.waivers.length ? <ul className="mt-3 space-y-2">{waivers.waivers.map((w) => <li key={w.id} className={`rounded-xl bg-white p-3 text-sm ${w.medical_flagged ? "border-2 border-rose-300" : ""}`}>
        <div className="flex flex-wrap justify-between gap-2"><b>{w.participant_name}</b><span className="text-xs text-slate-500">{stamp(w.signed_at)} · signed “{w.signature_name}”</span></div>
        <p className="text-xs text-slate-600">{w.certification ? certificationLabels[w.certification as keyof typeof certificationLabels] || w.certification : "Certification not given"}{w.date_of_birth ? ` · born ${w.date_of_birth}` : ""} · photos {w.photo_consent ? "OK" : "not OK"}{w.waiver_version !== waivers.current_version ? ` · version ${w.waiver_version}` : ""}</p>
        {w.medical_yes.length ? <div className="mt-1 text-rose-700"><p className="font-bold">Answered YES — doctor&apos;s clearance required:</p><ul className="list-disc pl-5">{w.medical_yes.map((q) => <li key={q}>{q}</li>)}</ul></div> : null}
      </li>)}</ul> : null}
    </div> : null}
  </section>;
}
