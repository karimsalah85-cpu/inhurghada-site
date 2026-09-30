import type { Metadata } from "next";
import { headers } from "next/headers";
import { CheckCircle2, Clock, ShieldAlert, Wallet, XCircle } from "lucide-react";
import { detailRows, formatMoney, paymentLabels, type PaymentStatus, type RequestStatus } from "@/lib/supplier-dispatch";
import { amountDueOf, recordEvent, type SupplierRequestRow } from "@/lib/supplier-dispatch-server";
import { verifySupplierRequestToken } from "@/lib/supplier-request-token";
import { createAdminClient } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Booking request | Daily Red Sea",
  robots: { index: false, follow: false },
};

// WhatsApp, email and chat apps fetch links to build previews; those visits must not count as "seen".
const previewAgents = /whatsapp|facebookexternalhit|facebot|telegrambot|slackbot|twitterbot|discordbot|linkedinbot|skypeuripreview|googleimageproxy|bot\b|crawler|spider|preview/i;

const doneMessages: Record<string, { en: string; ar: string }> = {
  confirm: { en: "Thank you — the booking is confirmed.", ar: "شكراً، تم تأكيد الحجز." },
  decline: { en: "Thank you for letting us know. We will arrange another supplier.", ar: "شكراً لإبلاغنا، سنقوم بالترتيب مع مورد آخر." },
  change: { en: "Your change request was sent to Daily Red Sea. We will contact you.", ar: "تم إرسال طلب التعديل، سنتواصل معك." },
  payment_received: { en: "Thank you — payment receipt confirmed.", ar: "شكراً، تم تأكيد استلام المبلغ." },
  payment_disputed: { en: "Thank you. Our team will check the payment and contact you.", ar: "شكراً، سيقوم فريقنا بمراجعة الدفع والتواصل معك." },
};

const errorMessages: Record<string, string> = {
  note_required: "Please write a short note (at least 3 characters) so we know what to change.",
  cancelled: "This booking request was cancelled by Daily Red Sea.",
  not_allowed: "That answer is not possible for this request any more.",
  no_payment: "No payment has been recorded for this booking yet.",
  changed: "This request was just updated. Please check it again below.",
  busy: "Too many attempts. Please wait a few minutes and try again.",
  invalid: "Something went wrong. Please try again.",
  unavailable: "We could not save your answer right now. Please try again, or reply on WhatsApp.",
  missing: "This request no longer exists.",
};

const banner: Record<RequestStatus, { tone: string; title: string; ar: string }> = {
  sent: { tone: "bg-primary text-white", title: "Please confirm this booking", ar: "برجاء تأكيد هذا الحجز" },
  change_requested: { tone: "bg-amber-500 text-white", title: "Change requested — Daily Red Sea will contact you", ar: "تم طلب تعديل — سنتواصل معك" },
  confirmed: { tone: "bg-ocean text-white", title: "Confirmed", ar: "تم التأكيد" },
  declined: { tone: "bg-slate-600 text-white", title: "Declined", ar: "تم الاعتذار" },
  cancelled: { tone: "bg-cta text-white", title: "Cancelled — no service needed", ar: "تم الإلغاء — لا حاجة للخدمة" },
};

function formatStamp(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Cairo" }).format(new Date(value));
}

function Invalid() {
  return (
    <main className="min-h-screen bg-surface-muted px-4 py-10">
      <div className="mx-auto max-w-md rounded-2xl bg-white p-6 text-center shadow-sm">
        <ShieldAlert className="mx-auto h-10 w-10 text-cta" aria-hidden="true" />
        <h1 className="mt-3 text-xl font-bold text-ink">Link not recognised</h1>
        <p className="mt-2 text-sm text-muted">This booking link is not valid or no longer exists. Please contact Daily Red Sea on WhatsApp.</p>
      </div>
    </main>
  );
}

const button = "w-full rounded-xl px-4 py-3 text-base font-bold focus-visible:outline-2 focus-visible:outline-offset-2";

export default async function SupplierRequestPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ done?: string; error?: string }> }) {
  const { token } = await params;
  const { done, error } = await searchParams;
  const requestId = verifySupplierRequestToken(token);
  const database = createAdminClient();
  if (!requestId || !database) return <Invalid />;
  const { data } = await database.from("supplier_booking_requests").select("*").eq("id", requestId).maybeSingle();
  if (!data) return <Invalid />;
  const request = data as SupplierRequestRow;
  const { data: supplier } = await database.from("suppliers").select("name,contact_name").eq("id", request.supplier_id).maybeSingle();

  const userAgent = (await headers()).get("user-agent") || "";
  if (!previewAgents.test(userAgent)) {
    const now = new Date().toISOString();
    if (!request.first_viewed_at) {
      const { data: firstView } = await database.from("supplier_booking_requests").update({ first_viewed_at: now, last_viewed_at: now }).eq("id", request.id).is("first_viewed_at", null).select("id").maybeSingle();
      if (firstView) await recordEvent(database, request.id, "viewed", `Supplier: ${supplier?.name || "supplier"}`, null);
    } else {
      await database.from("supplier_booking_requests").update({ last_viewed_at: now }).eq("id", request.id);
    }
  }

  const details = request.details;
  const rows = detailRows(details, amountDueOf(request));
  const status = banner[request.status];
  const open = request.status === "sent" || request.status === "change_requested";
  const paymentStatus = request.payment_status as PaymentStatus;
  const action = `/api/supplier-requests/${encodeURIComponent(token)}`;
  const doneMessage = done ? doneMessages[done] : null;
  const errorMessage = error ? errorMessages[error] || errorMessages.invalid : null;

  return (
    <main className="min-h-screen bg-surface-muted px-4 py-8">
      <div className="mx-auto max-w-md overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className={`px-5 py-4 ${status.tone}`}>
          <div className="flex items-center gap-2 text-lg font-bold">
            {request.status === "confirmed" ? <CheckCircle2 className="h-6 w-6" aria-hidden="true" /> : request.status === "sent" || request.status === "change_requested" ? <Clock className="h-6 w-6" aria-hidden="true" /> : <XCircle className="h-6 w-6" aria-hidden="true" />}
            {status.title}
          </div>
          <p dir="rtl" lang="ar" className="mt-1 text-sm opacity-90">{status.ar}</p>
          {request.responded_at && !open ? <p className="mt-1 text-xs opacity-80">Answered {formatStamp(request.responded_at)}</p> : null}
        </div>

        {doneMessage ? (
          <div role="status" className="border-b border-line bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-900">
            <p>{doneMessage.en}</p><p dir="rtl" lang="ar">{doneMessage.ar}</p>
          </div>
        ) : null}
        {errorMessage ? <p role="alert" className="border-b border-line bg-cta-soft px-5 py-3 text-sm font-semibold text-cta-dark">{errorMessage}</p> : null}

        <div className="border-b border-line px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-wider text-cta">Daily Red Sea · booking request</p>
          <h1 className="mt-1 text-xl font-extrabold text-ink">{details.trips[0]?.name || "Booking"}</h1>
          <p className="mt-1 text-sm text-muted">For {supplier?.contact_name || supplier?.name || "you"} · <span className="font-mono font-semibold text-primary">{details.reference}</span></p>
        </div>

        <dl className="divide-y divide-line px-5">
          {rows.map(([label, value], index) => (
            <div key={`${label}-${index}`} className="grid grid-cols-[7.5rem_1fr] gap-3 py-2.5 text-sm">
              <dt className="text-muted">{label}</dt>
              <dd className="whitespace-pre-wrap break-words font-semibold text-ink">
                {label === "Guest phone" ? <a className="text-primary underline" href={`tel:${value.replace(/[^+\d]/g, "")}`}>{value}</a> : value}
              </dd>
            </div>
          ))}
        </dl>

        {request.admin_note ? <p className="mx-5 my-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900"><b>Note from Daily Red Sea:</b> {request.admin_note}</p> : null}
        {request.supplier_note && !open ? <p className="mx-5 my-3 rounded-xl bg-primary-tint p-3 text-sm text-ink"><b>Your note:</b> {request.supplier_note}</p> : null}

        {request.status !== "cancelled" && request.status !== "declined" ? (
          <section aria-label="Your answer" className="space-y-3 border-t border-line bg-primary-tint px-5 py-5">
            {open ? (
              <form method="post" action={action}>
                <label className="mb-1 block text-xs font-semibold text-muted" htmlFor="responder">Your name (optional) · الاسم</label>
                <input type="hidden" name="action" value="confirm" />
                <input id="responder" name="name" maxLength={60} autoComplete="name" className="mb-3 w-full rounded-xl border border-line bg-white p-3 text-sm" />
                <button className={`${button} bg-ocean text-white`}>✓ Confirm booking · تأكيد</button>
              </form>
            ) : <p className="rounded-xl bg-white p-3 text-sm text-ink">You confirmed this booking. If anything changes, tell us below.</p>}
            <details className="rounded-xl bg-white p-3">
              <summary className="cursor-pointer text-sm font-bold text-ink">Ask for a change · طلب تعديل</summary>
              <form method="post" action={action} className="mt-3 space-y-2">
                <input type="hidden" name="action" value="change" />
                <textarea name="note" required minLength={3} maxLength={1000} rows={3} placeholder="e.g. pickup at 08:30 instead, or a different boat" className="w-full rounded-xl border border-line p-3 text-sm" />
                <button className={`${button} bg-amber-500 text-white`}>Send change request</button>
              </form>
            </details>
            <details className="rounded-xl bg-white p-3">
              <summary className="cursor-pointer text-sm font-bold text-cta-dark">{open ? "I can't take this booking" : "I can no longer do it"} · اعتذار</summary>
              <form method="post" action={action} className="mt-3 space-y-2">
                <input type="hidden" name="action" value="decline" />
                <textarea name="note" maxLength={1000} rows={2} placeholder="Reason (optional) · السبب" className="w-full rounded-xl border border-line p-3 text-sm" />
                <button className={`${button} bg-cta text-white`}>Decline booking</button>
              </form>
            </details>
          </section>
        ) : null}

        {paymentStatus !== "none" && request.payment_amount != null && request.payment_currency ? (
          <section aria-label="Payment" className="border-t border-line px-5 py-5">
            <p className="flex items-center gap-2 text-sm font-bold text-ink"><Wallet className="h-5 w-5 text-ocean" aria-hidden="true" />Payment · الدفع</p>
            <p className="mt-2 text-lg font-extrabold text-ink">{formatMoney(Number(request.payment_amount), request.payment_currency)}</p>
            <p className="text-sm text-muted">
              Sent {formatStamp(request.payment_sent_at)}{request.payment_method ? ` · ${request.payment_method.replace(/_/g, " ")}` : ""}{request.payment_reference ? ` · ref ${request.payment_reference}` : ""}
            </p>
            {request.payment_note ? <p className="mt-2 text-sm text-ink">{request.payment_note}</p> : null}
            <p className="mt-2 text-sm font-semibold text-ink">{paymentLabels[paymentStatus]}{paymentStatus === "received" && request.payment_confirmed_at ? ` · ${formatStamp(request.payment_confirmed_at)}` : ""}</p>
            {paymentStatus !== "received" ? (
              <div className="mt-3 space-y-3">
                <form method="post" action={action}>
                  <input type="hidden" name="action" value="payment_received" />
                  <button className={`${button} bg-ocean text-white`}>✓ I received the payment · تم الاستلام</button>
                </form>
                {paymentStatus === "sent" ? (
                  <details className="rounded-xl bg-primary-tint p-3">
                    <summary className="cursor-pointer text-sm font-bold text-cta-dark">I did not receive it · لم يتم الاستلام</summary>
                    <form method="post" action={action} className="mt-3 space-y-2">
                      <input type="hidden" name="action" value="payment_disputed" />
                      <textarea name="note" required minLength={3} maxLength={1000} rows={2} placeholder="What is wrong? e.g. amount different, nothing arrived" className="w-full rounded-xl border border-line bg-white p-3 text-sm" />
                      <button className={`${button} bg-cta text-white`}>Report problem</button>
                    </form>
                  </details>
                ) : null}
              </div>
            ) : null}
          </section>
        ) : null}

        <p className="border-t border-line px-5 py-4 text-xs text-muted">This page is personal to you. Please do not forward the link. Questions? Reply on WhatsApp to Daily Red Sea.</p>
      </div>
    </main>
  );
}
