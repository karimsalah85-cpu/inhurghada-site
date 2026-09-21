"use client";

import { useCallback, useEffect, useState } from "react";

type ReviewData = {
  booking: { referral_code: string | null; referral_exclusion_reason: string | null; referral_discount_percent: number };
  referral: { id: string; referral_code: string; status: string; review_reasons: string[]; rejection_reason: string | null } | null;
  referrer: { customer_name: string | null; referral_code: string } | null;
  attempts: { id: string; referral_code: string | null; outcome: string; reasons: string[]; created_at: string }[];
  participants: { id: string; email: string | null; phone: string | null }[];
  audit: { id: string; decision: string; reason: string; actor: string; created_at: string }[];
  rewards: { balanceUnits: number; pendingUnits: number; ledger: { id: string; type: string; reward_units: number; booking_id: string; note: string | null; created_at: string }[] } | null;
  bookingLedger: { id: string; type: string; reward_units: number; note: string | null }[] | null;
  canReview: boolean;
};
const field = "w-full rounded-xl border border-slate-300 bg-white p-2 text-sm";
const button = "rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white disabled:opacity-50";
const readable = (value: string) => value.replace(/_/g, " ");

export function ReferralReviewPanel({ bookingId }: { bookingId: string }) {
  const [data, setData] = useState<ReviewData | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [exclusion, setExclusion] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const load = useCallback(async (signal?: AbortSignal) => {
    const response = await fetch(`/api/admin/referrals?bookingId=${encodeURIComponent(bookingId)}`, { signal, cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not load referral details.");
    return result as ReviewData;
  }, [bookingId]);
  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal).then(result => { if (!controller.signal.aborted) { setData(result); setExclusion(result.booking.referral_exclusion_reason || ""); } }).catch(err => { if (!controller.signal.aborted) setError(err.message); });
    return () => controller.abort();
  }, [load]);
  async function save(action: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/referrals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingId, ...action }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save referral review.");
      const updated = await load();
      setData(updated);
      setExclusion(updated.booking.referral_exclusion_reason || "");
      if (action.action === "participant") { setEmail(""); setPhone(""); }
      if (action.action === "review") setReason("");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save referral review."); }
    finally { setBusy(false); }
  }
  return <section aria-labelledby="referral-review-heading" className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
    <h3 id="referral-review-heading" className="font-bold">Referral review · internal only</h3>
    {error ? <p role="alert" className="my-2 text-sm text-rose-700">{error} <button type="button" onClick={() => { setError(""); void load().then(result => { setData(result); setExclusion(result.booking.referral_exclusion_reason || ""); }).catch(err => setError(err.message)); }} className="underline">Reload</button></p> : null}
    {!data ? <p className="mt-2 text-sm" role="status">{error ? "Referral details unavailable." : "Loading referral details…"}</p> : <div className="mt-3 space-y-4 text-sm">
      <dl className="grid gap-3 sm:grid-cols-2">
        <div><dt className="text-slate-500">Referral source</dt><dd className="font-mono">{data.referral?.referral_code || data.booking.referral_code || data.attempts[0]?.referral_code || "No referral recorded"}</dd></div>
        <div><dt className="text-slate-500">Referrer</dt><dd>{data.referrer?.customer_name || data.referrer?.referral_code || "—"}</dd></div>
        <div><dt className="text-slate-500">Status</dt><dd className="font-semibold capitalize">{data.referral ? readable(data.referral.status) : data.attempts[0] ? readable(data.attempts[0].outcome) : "Not applicable"}</dd></div>
        <div><dt className="text-slate-500">Booking referral discount</dt><dd>{Number(data.booking.referral_discount_percent || 0)}%</dd></div>
      </dl>
      {data.attempts.filter(attempt => attempt.outcome === "rejected").map(attempt => <div key={attempt.id} className="rounded-xl bg-rose-50 p-3"><p className="font-semibold">Referral not applied · {attempt.referral_code}</p><ul className="mt-1 list-inside list-disc">{attempt.reasons.map(reason => <li key={reason}>{readable(reason)}</li>)}</ul><p className="mt-1 text-xs text-slate-600">Recorded {attempt.created_at.slice(0, 16).replace("T", " ")} UTC</p></div>)}
      {data.referral?.review_reasons?.length ? <div className="rounded-xl bg-amber-50 p-3"><p className="font-semibold">Review signals</p><ul className="mt-1 list-inside list-disc">{data.referral.review_reasons.map(signal => <li key={signal}>{readable(signal)}</li>)}</ul><p className="mt-2">These signals require review; they do not establish fraud.</p></div> : null}
      {data.referral?.rejection_reason ? <p className="rounded-xl bg-rose-50 p-3">Rejection reason: {data.referral.rejection_reason}</p> : null}
      {data.bookingLedger?.length ? <div><p className="font-semibold">This booking · reward entries</p><ul className="mt-1 space-y-1">{data.bookingLedger.map(entry => <li key={entry.id}>{entry.type}: {entry.reward_units > 0 ? "+" : ""}{entry.reward_units * 5}%{entry.note ? ` · ${entry.note}` : ""}</li>)}</ul></div> : null}
      {data.rewards ? <div><p className="font-semibold">Referrer rewards</p><p>Available: {Math.max(0, data.rewards.balanceUnits) * 5}% · Pending: {data.rewards.pendingUnits * 5}%</p>{data.rewards.balanceUnits < 0 ? <p className="text-amber-800">A reversal exceeds the remaining balance. New earnings offset the {Math.abs(data.rewards.balanceUnits) * 5}% adjustment.</p> : null}<details className="mt-2"><summary className="cursor-pointer py-2 font-semibold">Reward ledger (latest 100 entries)</summary><ul className="space-y-2">{data.rewards.ledger.map(entry => <li key={entry.id} className="rounded-lg bg-slate-50 p-2"><span className="font-semibold">{entry.type} {entry.reward_units > 0 ? "+" : ""}{entry.reward_units * 5}%</span> · {entry.created_at.slice(0, 10)}<p>{entry.note}</p><p className="break-all text-xs text-slate-500">Booking: {entry.booking_id}</p></li>)}</ul></details></div> : data.referral ? <p className="text-slate-500">Finance access is required to view balances and make reward decisions.</p> : null}
      {data.canReview && data.referral?.status === "pending_review" ? <form onSubmit={event => { event.preventDefault(); void save({ action: "review", decision: "approve", reason }); }} className="space-y-2 rounded-xl border border-amber-200 p-3"><label className="block font-semibold">Decision reason<textarea required minLength={5} maxLength={500} value={reason} onChange={event => setReason(event.target.value)} className={`${field} mt-1`} /></label><p className="text-xs text-slate-500">Approval clears review only. A reward still requires a legitimate completed, paid trip. Decisions are audited.</p><div className="flex flex-wrap gap-2"><button disabled={busy || reason.trim().length < 5} className={button}>Approve referral</button><button type="button" disabled={busy || reason.trim().length < 5} onClick={() => void save({ action: "review", decision: "reject", reason })} className={`${button} bg-rose-800`}>Reject referral</button></div></form> : null}
      <details><summary className="cursor-pointer py-2 font-semibold">Eligibility and known passengers</summary><div className="space-y-4 pt-2">
        <form onSubmit={event => { event.preventDefault(); void save({ action: "exclude", reason: exclusion || null }); }} className="space-y-2"><label className="block font-semibold">Exclude this booking from referral qualification<select value={exclusion} onChange={event => setExclusion(event.target.value)} className={`${field} mt-1`}><option value="">No exclusion recorded</option><option value="test">Test booking</option><option value="no_show">No-show</option><option value="fraud">Confirmed fraud</option><option value="duplicate">Duplicate booking</option></select></label><p className="text-xs text-slate-500">This can reverse earned rewards. Removing an exclusion does not automatically restore reversed rewards.</p><button disabled={busy || exclusion === (data.booking.referral_exclusion_reason || "")} className={button}>Save eligibility</button></form>
        <p>Record a known passenger&apos;s contact to prevent referrals between people on the same reservation. This evidence does not grant account access or transfer rewards.</p>
        {data.participants.length ? <ul className="space-y-1">{data.participants.map(participant => <li key={participant.id} className="break-all">{[participant.email, participant.phone].filter(Boolean).join(" · ")}</li>)}</ul> : <p className="text-slate-500">No additional passenger contacts recorded.</p>}
        <form onSubmit={event => { event.preventDefault(); void save({ action: "participant", email, phone }); }} className="grid gap-2 sm:grid-cols-2"><label>Passenger email<input type="email" maxLength={254} value={email} onChange={event => setEmail(event.target.value)} className={`${field} mt-1`} /></label><label>International phone<input type="tel" maxLength={30} value={phone} onChange={event => setPhone(event.target.value)} className={`${field} mt-1`} placeholder="+20…" /></label><button disabled={busy || (!email.trim() && !phone.trim())} className={`${button} sm:col-span-2`}>Record passenger evidence</button></form>
      </div></details>
      {data.audit.length ? <details><summary className="cursor-pointer py-2 font-semibold">Decision audit trail</summary><ul className="space-y-2">{data.audit.map(entry => <li key={entry.id} className="rounded-lg bg-slate-50 p-2"><b>{entry.decision}</b> · {entry.created_at.slice(0, 16).replace("T", " ")} UTC<p>{entry.reason}</p><p className="break-all text-xs text-slate-500">Actor: {entry.actor}</p></li>)}</ul></details> : null}
    </div>}
  </section>;
}
