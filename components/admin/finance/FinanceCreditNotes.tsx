"use client";

import { useEffect, useState } from "react";
import { formatMoney, fromMinor, toMinor, type FinanceCurrency } from "@/lib/finance/money";

type Amount = string | number;
type CreditNote = {
  id: string; number: string; booking_id: string; customer_name: string | null; customer_email: string | null; currency: FinanceCurrency;
  amount: Amount; redeemed: Amount; remaining: Amount; status: string; issued_on: string; expires_on: string | null; reason: string;
};
const statuses = [["", "All"], ["open", "Open"], ["partly_used", "Partly used"], ["used", "Used"], ["expired", "Expired"], ["void", "Void"]] as const;
const statusClass: Record<string, string> = {
  open: "bg-emerald-100 text-emerald-800", partly_used: "bg-amber-100 text-amber-800", used: "bg-slate-200 text-slate-700",
  expired: "bg-rose-100 text-rose-800", void: "bg-slate-200 text-slate-500 line-through",
};
const show = (amount: Amount, currency: FinanceCurrency) => formatMoney(fromMinor(toMinor(amount)), currency);

export default function FinanceCreditNotes() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState<CreditNote[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams({ q, status });
      fetch(`/api/admin/finance/credit-notes?${params}`, { cache: "no-store" })
        .then(async (response) => {
          const body = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(body.error || "Could not load credit notes.");
          setError(""); setNotes(body.creditNotes);
        })
        .catch((reason: Error) => setError(reason.message));
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [q, status]);

  const open = new Map<string, bigint>();
  for (const note of notes ?? []) if (note.status === "open" || note.status === "partly_used") open.set(note.currency, (open.get(note.currency) ?? 0n) + toMinor(note.remaining));

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
        <label className="text-sm font-semibold">Search
          <input type="search" value={q} onChange={(event) => setQ(event.target.value)} placeholder="CN number, guest name or email"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-base font-normal sm:text-sm" />
        </label>
        <label className="text-sm font-semibold">Status
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-base font-normal sm:text-sm">
            {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>
      {open.size ? (
        <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          Guests can still use: <b>{[...open].map(([currency, cents]) => show(fromMinor(cents), currency as FinanceCurrency)).join(" + ")}</b> (open credit is money owed to guests, not revenue).
        </p>
      ) : null}
      {error ? <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
      {!notes ? <p role="status" className="mt-4 text-sm">{error ? "" : "Loading…"}</p> : notes.length ? (
        <ul className="mt-4 space-y-3">
          {notes.map((note) => (
            <li key={note.id} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono font-bold">{note.number}</p>
                  <p className="text-slate-600 wrap-break-word">{note.customer_name || "Guest"}{note.customer_email ? ` · ${note.customer_email}` : ""}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass[note.status] ?? "bg-slate-100"}`}>{note.status.replace("_", " ")}</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-slate-50 p-2"><p className="text-xs text-slate-500">Issued</p><b>{show(note.amount, note.currency)}</b></div>
                <div className="rounded-xl bg-slate-50 p-2"><p className="text-xs text-slate-500">Used</p><b>{show(note.redeemed, note.currency)}</b></div>
                <div className="rounded-xl bg-slate-50 p-2"><p className="text-xs text-slate-500">Left</p><b>{show(note.remaining, note.currency)}</b></div>
              </div>
              <p className="mt-2 text-xs text-slate-500">Issued {note.issued_on}{note.expires_on ? ` · expires ${note.expires_on}` : " · no expiry"} · {note.reason}</p>
            </li>
          ))}
        </ul>
      ) : <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No credit notes match.</p>}
    </div>
  );
}
