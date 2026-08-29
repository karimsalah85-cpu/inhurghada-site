"use client";

import { useState } from "react";
import { Star } from "lucide-react";

type Review = { id: string; tour_slug: string; customer_name: string; rating: number; body: string; status: "pending" | "approved" | "rejected"; created_at: string };

export default function ReviewsModeration({ initialReviews }: { initialReviews: Review[] }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  async function moderate(id: string, status: "approved" | "rejected") {
    setBusyId(id);
    try {
      const response = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        const { review } = await response.json();
        setReviews((current) => current.map((item) => item.id === id ? review : item));
      }
    } finally {
      setBusyId(null);
    }
  }

  const visible = filter === "pending" ? reviews.filter((review) => review.status === "pending") : reviews;

  return <div>
    <div className="flex gap-2">
      <button onClick={() => setFilter("pending")} className={`rounded-xl px-4 py-2 text-sm font-bold ${filter === "pending" ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-700"}`}>Pending ({reviews.filter((review) => review.status === "pending").length})</button>
      <button onClick={() => setFilter("all")} className={`rounded-xl px-4 py-2 text-sm font-bold ${filter === "all" ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-700"}`}>All ({reviews.length})</button>
    </div>
    <div className="mt-6 space-y-4">
      {visible.map((review) => <article key={review.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-black text-slate-950">{review.customer_name} <span className="font-normal text-slate-500">· {review.tour_slug}</span></p>
            <div className="mt-1 flex items-center gap-2">
              <div className="flex">{Array.from({ length: 5 }, (_, star) => <Star key={star} size={14} className={star < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}/>)}</div>
              <span className="text-xs text-slate-500">{new Date(review.created_at).toLocaleDateString()}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold uppercase ${review.status === "approved" ? "bg-emerald-100 text-emerald-800" : review.status === "rejected" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}`}>{review.status}</span>
            </div>
          </div>
          {review.status === "pending" ? <div className="flex gap-2">
            <button disabled={busyId === review.id} onClick={() => moderate(review.id, "approved")} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60">Approve</button>
            <button disabled={busyId === review.id} onClick={() => moderate(review.id, "rejected")} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60">Reject</button>
          </div> : null}
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-700">{review.body}</p>
      </article>)}
      {!visible.length ? <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">No reviews to show.</p> : null}
    </div>
  </div>;
}
