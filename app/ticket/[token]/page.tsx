import type { Metadata } from "next";
import { CalendarDays, CheckCircle2, Clock, MapPin, ShieldAlert, Ticket, Users, Wallet } from "lucide-react";
import { cookies } from "next/headers";
import { hasLivePermission } from "@/lib/admin-permission";
import { findGuideByCookie, guideCookieName } from "@/lib/guide-checkin";
import { loadTicket, type TicketView } from "@/lib/ticket-service";
import { verifyTicketToken } from "@/lib/ticket-token";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Trip ticket | Daily Red Sea",
  robots: { index: false, follow: false },
};

function formatMoney(amount: number, currency: string) {
  try { return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(amount); } catch { return `${amount.toFixed(2)} ${currency}`; }
}

function formatDate(value: string | null) {
  if (!value) return "To be confirmed";
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

type Verdict = { tone: "valid" | "used" | "invalid"; title: string; detail: string };

function verdictFor(ticket: TicketView): Verdict {
  if (ticket.bookingStatus === "cancelled") return { tone: "invalid", title: "Cancelled booking", detail: "Do not board. Contact the Daily Red Sea office." };
  if (ticket.checkedInAt) {
    const at = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Cairo" }).format(new Date(ticket.checkedInAt));
    return { tone: "used", title: "Already checked in", detail: `Scanned ${at}${ticket.checkedInBy ? ` by ${ticket.checkedInBy}` : ""}.` };
  }
  return { tone: "valid", title: ticket.bookingStatus === "confirmed" || ticket.bookingStatus === "completed" ? "Valid ticket" : "Valid ticket · awaiting final confirmation", detail: "Show this screen to your guide or driver." };
}

const checkinMessages: Record<string, string> = {
  done: "Checked in.",
  error: "Check-in could not be saved. Try again.",
  badpin: "That PIN is not recognised. Check it with the Daily Red Sea office.",
  pin: "Enter your 6-digit PIN.",
  locked: "Too many attempts. Wait 15 minutes and try again.",
  cancelled: "This booking is cancelled. Do not board.",
};

const toneStyles: Record<Verdict["tone"], string> = {
  valid: "bg-ocean text-white",
  used: "bg-amber-500 text-white",
  invalid: "bg-cta text-white",
};

function InvalidTicket() {
  return (
    <main className="min-h-screen bg-surface-muted px-4 py-10">
      <div className="mx-auto max-w-md rounded-2xl bg-white p-6 text-center shadow-sm">
        <ShieldAlert className="mx-auto h-10 w-10 text-cta" aria-hidden="true" />
        <h1 className="mt-3 text-xl font-bold text-ink">Ticket not recognised</h1>
        <p className="mt-2 text-sm text-muted">This QR code is not a valid Daily Red Sea ticket, or the booking no longer exists. Please contact us on WhatsApp with your booking reference.</p>
      </div>
    </main>
  );
}

export default async function TicketPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ checkin?: string }> }) {
  const { token } = await params;
  const { checkin } = await searchParams;
  const verified = verifyTicketToken(token);
  const database = createAdminClient();
  if (!verified || !database) return <InvalidTicket />;
  const ticket = await loadTicket(database, verified.reference, verified.tripIndex);
  if (!ticket) return <InvalidTicket />;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isStaff = await hasLivePermission(supabase, user, "bookings");
  const guide = isStaff ? null : await findGuideByCookie(database, (await cookies()).get(guideCookieName)?.value);
  const canCheckIn = isStaff || Boolean(guide);
  const verdict = verdictFor(ticket);
  const paid = ticket.paymentStatus === "paid";
  const rows = [
    { icon: CalendarDays, label: "Date", value: formatDate(ticket.date) },
    { icon: Clock, label: "Time", value: ticket.time || "To be confirmed" },
    { icon: Users, label: "Travelers", value: ticket.travelers },
    { icon: MapPin, label: "Pickup / meeting point", value: ticket.pickup || "To be confirmed" },
    { icon: Wallet, label: paid ? "Payment" : ticket.tripCount > 1 ? "To collect (whole booking)" : "To collect", value: paid ? "Paid" : ticket.paymentStatus === "refunded" ? "Refunded" : formatMoney(ticket.amount, ticket.currency) },
  ];

  return (
    <main className="min-h-screen bg-surface-muted px-4 py-8">
      <div className="mx-auto max-w-md overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className={`px-5 py-4 ${toneStyles[verdict.tone]}`}>
          <div className="flex items-center gap-2 text-lg font-bold">
            {verdict.tone === "valid" ? <CheckCircle2 className="h-6 w-6" aria-hidden="true" /> : <ShieldAlert className="h-6 w-6" aria-hidden="true" />}
            {verdict.title}
          </div>
          <p className="mt-1 text-sm opacity-90">{verdict.detail}</p>
        </div>

        <div className="border-b border-line px-5 py-5">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cta"><Ticket className="h-4 w-4" aria-hidden="true" />Trip ticket{ticket.tripCount > 1 ? ` ${ticket.tripIndex + 1} of ${ticket.tripCount}` : ""}</p>
          <h1 className="mt-2 text-2xl font-extrabold leading-tight text-ink">{ticket.tripName}</h1>
          <p className="mt-2 text-sm text-muted">{ticket.customerName} · <span className="font-mono font-semibold text-primary">{ticket.reference}</span></p>
        </div>

        <dl className="divide-y divide-line px-5">
          {rows.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3 py-3">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-ocean" aria-hidden="true" />
              <div><dt className="text-xs text-muted">{label}</dt><dd className="font-semibold text-ink">{value}</dd></div>
            </div>
          ))}
        </dl>

        {ticket.checkInAvailable && (
          <div className="border-t border-line bg-primary-tint px-5 py-5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">{isStaff ? "Staff" : guide ? `Guide · ${guide.name}` : "Guide check-in"}</p>
            {canCheckIn && ticket.customerPhone && (
              <p className="mt-2 text-sm text-ink">Guest phone: <a className="font-semibold text-primary underline" href={`tel:${ticket.customerPhone.replace(/[^+\d]/g, "")}`}>{ticket.customerPhone}</a>{isStaff && ticket.customerEmail ? ` · ${ticket.customerEmail}` : ""}</p>
            )}
            {checkin && checkinMessages[checkin] && (
              <p className={`mt-3 rounded-lg px-3 py-2 text-sm font-semibold ${checkin === "done" ? "bg-ocean-soft text-ocean-dark" : "bg-cta-soft text-cta-dark"}`}>{checkinMessages[checkin]}</p>
            )}
            {ticket.checkedInAt || ticket.bookingStatus === "cancelled" ? null : canCheckIn ? (
              <form method="post" action={`/api/tickets/${encodeURIComponent(token)}/check-in`} className="mt-3">
                <button type="submit" className="w-full rounded-xl bg-primary px-4 py-3 text-base font-bold text-white hover:bg-primary-dark">
                  Check in {ticket.guests} guest{ticket.guests === 1 ? "" : "s"}
                </button>
              </form>
            ) : (
              <form method="post" action={`/api/tickets/${encodeURIComponent(token)}/check-in`} className="mt-3">
                <label className="block text-sm font-semibold text-ink" htmlFor="pin">Guides and drivers: enter your check-in PIN</label>
                <div className="mt-2 flex gap-2">
                  <input id="pin" name="pin" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} required placeholder="6 digits" className="min-w-0 flex-1 rounded-xl border border-line bg-white px-3 py-3 text-center font-mono text-lg tracking-[0.3em]" />
                  <button type="submit" className="rounded-xl bg-primary px-4 py-3 font-bold text-white hover:bg-primary-dark">Check in</button>
                </div>
                <p className="mt-2 text-xs text-muted">Your phone will be remembered, so next time it&apos;s one tap.</p>
              </form>
            )}
          </div>
        )}
      </div>
      <p className="mx-auto mt-4 max-w-md text-center text-xs text-muted">Daily Red Sea · dailyredsea.com</p>
    </main>
  );
}
