"use client";

import { useState } from "react";
import { Star } from "lucide-react";

export default function TripReviewForm({ initialReference = "", initialEmail = "" }: { initialReference?: string; initialEmail?: string }) {
  const [reference, setReference] = useState(initialReference);
  const [email, setEmail] = useState(initialEmail);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("submitting");
    setError("");
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, email, rating, body }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || "We could not save your review.");
        setStatus("error");
        return;
      }
      setStatus("done");
    } catch {
      setError("We could not save your review. Please try again.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
      <p className="font-black">Thank you for your review!</p>
      <p className="mt-2 text-sm leading-6">Your review has been submitted and will appear on the trip page once our team approves it.</p>
    </div>;
  }

  return <form onSubmit={handleSubmit} className="space-y-4">
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block text-sm font-bold text-slate-700">Booking reference
        <input required value={reference} onChange={(event) => setReference(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950" placeholder="DRS-20260801-ABC123" />
      </label>
      <label className="block text-sm font-bold text-slate-700">Email used for the booking
        <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950" placeholder="you@example.com" />
      </label>
    </div>
    <div>
      <p className="text-sm font-bold text-slate-700">Your rating</p>
      <div className="mt-1 flex gap-1" role="radiogroup" aria-label="Rating out of 5">
        {[1, 2, 3, 4, 5].map((value) => (
          <button key={value} type="button" onClick={() => setRating(value)} aria-pressed={rating >= value} aria-label={`${value} star${value === 1 ? "" : "s"}`}>
            <Star size={28} className={value <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
          </button>
        ))}
      </div>
    </div>
    <label className="block text-sm font-bold text-slate-700">Your review
      <textarea required minLength={1} maxLength={2000} rows={5} value={body} onChange={(event) => setBody(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950" placeholder="Tell other travelers about your trip..." />
    </label>
    {error ? <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-800">{error}</p> : null}
    <button type="submit" disabled={status === "submitting"} className="w-full rounded-2xl bg-blue-700 px-6 py-4 text-lg font-black text-white hover:bg-blue-800 disabled:opacity-60">
      {status === "submitting" ? "Submitting…" : "Submit review"}
    </button>
    <p className="text-xs leading-5 text-slate-500">Reviews can only be submitted for a completed booking and are checked by our team before they appear publicly.</p>
  </form>;
}
