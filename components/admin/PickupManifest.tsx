"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Copy, MessageCircle, Printer } from "lucide-react";
import { manifestText, whatsappLink, type ManifestGroup } from "@/lib/pickup-manifest";

const shift = (date: string, days: number) => new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
const longDate = (date: string) => new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));

export default function PickupManifest({ date, groups }: { date: string; groups: ManifestGroup[] }) {
  const [includeCash, setIncludeCash] = useState(false);
  const [copied, setCopied] = useState("");
  const totalGuests = groups.reduce((sum, group) => sum + group.guests, 0);
  const totalStops = groups.reduce((sum, group) => sum + group.stops.length, 0);
  const missingTimes = groups.reduce((sum, group) => sum + group.stops.filter((stop) => !stop.time).length, 0);
  async function copy(group: ManifestGroup) {
    try { await navigator.clipboard.writeText(manifestText(date, group, { includeCash })); setCopied(group.key); window.setTimeout(() => setCopied(""), 2000); } catch { window.alert("Copy failed — select the list and copy it manually."); }
  }
  return <div>
    <div className="flex flex-wrap items-center gap-3 print:hidden">
      <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1">
        <Link href={`?date=${shift(date, -1)}`} aria-label="Previous day" className="rounded-lg p-2 hover:bg-slate-100"><ChevronLeft size={18}/></Link>
        <form className="flex items-center"><label className="sr-only" htmlFor="manifest-date">Date</label><input id="manifest-date" type="date" name="date" defaultValue={date} className="rounded-lg px-2 py-1.5 text-sm font-bold" onChange={(event) => event.currentTarget.form?.requestSubmit()}/></form>
        <Link href={`?date=${shift(date, 1)}`} aria-label="Next day" className="rounded-lg p-2 hover:bg-slate-100"><ChevronRight size={18}/></Link>
      </div>
      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={includeCash} onChange={(event) => setIncludeCash(event.target.checked)}/>Include cash to collect in shared lists</label>
      <button type="button" onClick={() => window.print()} className="ml-auto inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white"><Printer size={16}/>Print</button>
    </div>
    <header className="mt-6"><h2 className="text-2xl font-black">{longDate(date)}</h2><p className="mt-1 text-sm text-slate-600">{totalStops} booking{totalStops === 1 ? "" : "s"} · {totalGuests} guest{totalGuests === 1 ? "" : "s"} · {groups.length} list{groups.length === 1 ? "" : "s"}</p>
      {missingTimes ? <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-900 print:hidden">{missingTimes} pickup{missingTimes === 1 ? " has" : "s have"} no time yet. Set it on the booking&apos;s assignment under Dispatch &amp; calendar — it is also sent to the guest in the reminder.</p> : null}
    </header>
    {!groups.length ? <p className="mt-6 rounded-2xl bg-white p-8 text-center text-slate-500 shadow-sm">No active bookings on this date.</p> : null}
    <div className="mt-6 space-y-6">{groups.map((group) => <section key={group.key} className="break-inside-avoid rounded-2xl border border-slate-200 bg-white shadow-sm print:shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
        <div><h3 className="text-lg font-black">{group.title}</h3><p className="text-xs font-semibold text-slate-500">{group.subtitle}{group.contactPhone ? ` · ${group.contactPhone}` : ""} · {group.stops.length} booking{group.stops.length === 1 ? "" : "s"}, {group.guests} guest{group.guests === 1 ? "" : "s"}</p></div>
        <div className="flex gap-2 print:hidden">
          <button type="button" onClick={() => void copy(group)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"><Copy size={15}/>{copied === group.key ? "Copied" : "Copy"}</button>
          <a href={whatsappLink(group.contactPhone, manifestText(date, group, { includeCash }))} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700"><MessageCircle size={15}/>WhatsApp</a>
        </div>
      </div>
      <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Time</th><th className="p-3">Hotel</th><th className="p-3">Guest</th><th className="p-3">Pax</th><th className="p-3">Tour</th><th className="p-3">Notes</th><th className="p-3">Collect</th></tr></thead>
        <tbody>{group.stops.map((stop) => <tr key={stop.bookingId} className="border-t border-slate-100 align-top">
          <td className={`p-3 font-black ${stop.time ? "" : "text-amber-700"}`}>{stop.time || "TBC"}</td>
          <td className="p-3 font-semibold">{stop.hotel}</td>
          <td className="p-3"><span className="font-semibold">{stop.guest}</span><span className="block text-xs text-slate-500">{stop.phone || "No phone"}</span><Link href={`/admin/bookings?month=${date.slice(0, 7)}&search=${encodeURIComponent(stop.reference)}`} className="text-xs font-bold text-cyan-700 print:text-slate-500">{stop.reference}</Link></td>
          <td className="p-3 whitespace-nowrap"><span className="font-black">{stop.total}</span><span className="block text-xs text-slate-500">{[stop.adults && `${stop.adults} adult${stop.adults === 1 ? "" : "s"}`, stop.children && `${stop.children} child${stop.children === 1 ? "" : "ren"}`, stop.infants && `${stop.infants} infant${stop.infants === 1 ? "" : "s"}`].filter(Boolean).join(", ")}</span></td>
          <td className="p-3">{stop.tour}{stop.status === "new" ? <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase text-amber-800">Not confirmed</span> : null}</td>
          <td className="p-3 text-xs text-slate-600">{stop.notes || "—"}</td>
          <td className="p-3 whitespace-nowrap text-xs font-bold">{stop.cashToCollect || "Paid"}</td>
        </tr>)}</tbody>
      </table></div>
    </section>)}</div>
  </div>;
}
