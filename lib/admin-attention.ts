/**
 * "Needs attention" list for the admin overview. Pure: the page loads the rows,
 * this derives the items, so the rules are testable without a database.
 *
 * Each input is optional. `undefined` means "not loaded" (no permission, or the
 * table is missing in this environment) and the matching item is skipped
 * rather than reported as zero.
 */
import { bookingSearchHref } from "@/lib/admin-search";

export type AttentionBookingRow = {
  id: string;
  reference: string;
  customer_name: string | null;
  tour_name: string | null;
  date: string | null;
  start_time?: string | null;
  hotel?: string | null;
  status: string | null;
  archived_at?: string | null;
  guests?: number | null;
  adults?: number | null;
  youth?: number | null;
  infants?: number | null;
};
export type AttentionAssignmentRow = { booking_id: string; pickup_time: string | null; status: string | null };
export type AttentionSupplierRequestRow = {
  id: string;
  booking_id: string;
  supplier_id: string;
  status: string;
  sent_at: string | null;
  last_sent_at: string | null;
  responded_at: string | null;
  supplier_name?: string | null;
};
export type AttentionQueueRow = {
  id: string;
  booking_id: string | null;
  channel: string;
  recipient: string;
  attempts: number | null;
  scheduled_for: string;
  last_error?: string | null;
};

export type AttentionEntry = { key: string; title: string; detail: string; href: string };
export type AttentionItem = {
  id: "tomorrow-unassigned" | "tomorrow-no-pickup" | "supplier-waiting" | "failed-messages";
  label: string;
  note: string;
  count: number;
  href: string;
  linkLabel: string;
  entries: AttentionEntry[];
};
export type TomorrowPickups = { date: string; bookings: number; guests: number; href: string };
export type AdminAttention = { items: AttentionItem[]; tomorrow: TomorrowPickups | null };

export type AttentionInput = {
  now: Date;
  /** Bookings dated tomorrow (Cairo). Needed for both tomorrow items and the pickups line. */
  tomorrowBookings?: AttentionBookingRow[];
  /** Assignments for `tomorrowBookings`. Without them the tomorrow items are skipped. */
  tomorrowAssignments?: AttentionAssignmentRow[];
  /** Open supplier requests (status "sent"), with the bookings they belong to. */
  supplierRequests?: AttentionSupplierRequestRow[];
  supplierRequestBookings?: AttentionBookingRow[];
  /** communication_queue rows with status "failed". */
  failedMessages?: AttentionQueueRow[];
  /** How many entries to show under each item. */
  topN?: number;
};

/** Supplier request statuses where we are still waiting for the supplier to answer. */
export const SUPPLIER_WAITING_STATUSES = ["sent"] as const;
export const SUPPLIER_WAIT_HOURS = 12;
export const FAILED_MESSAGE_DAYS = 7;
const HOUR = 3_600_000;

export function cairoDate(now: Date) {
  return now.toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
}
export function addDays(date: string, days: number) {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}
export function cairoTomorrow(now: Date) {
  return addDays(cairoDate(now), 1);
}
/** Oldest `last_sent_at` that still counts as "waiting too long". */
export function supplierWaitCutoff(now: Date) {
  return new Date(now.getTime() - SUPPLIER_WAIT_HOURS * HOUR).toISOString();
}
export function failedMessagesSince(now: Date) {
  return new Date(now.getTime() - FAILED_MESSAGE_DAYS * 24 * HOUR).toISOString();
}

export function attentionGuestCount(booking: AttentionBookingRow) {
  const counted = [booking.adults, booking.youth, booking.infants].reduce<number>((sum, value) => sum + Math.max(0, Number(value) || 0), 0);
  return counted || Math.max(0, Number(booking.guests) || 0);
}

const isLive = (booking: AttentionBookingRow) => !booking.archived_at && booking.status !== "cancelled";
const liveAssignment = (row: AttentionAssignmentRow) => row.status !== "cancelled";
const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;
const bookingTitle = (booking: AttentionBookingRow) => `${booking.reference} · ${booking.customer_name || "Guest"}`;

function hoursAgo(value: string, now: Date) {
  return Math.max(0, Math.floor((now.getTime() - Date.parse(value)) / HOUR));
}

export function buildAdminAttention(input: AttentionInput): AdminAttention {
  const { now } = input;
  const topN = input.topN ?? 3;
  const items: AttentionItem[] = [];
  const today = cairoDate(now);
  const tomorrow = addDays(today, 1);
  const manifestHref = `/admin/operations/manifest?date=${tomorrow}`;
  let tomorrowSummary: TomorrowPickups | null = null;

  if (input.tomorrowBookings) {
    const trips = input.tomorrowBookings
      .filter((booking) => booking.date === tomorrow && isLive(booking))
      .sort((a, b) => (a.start_time || "99").localeCompare(b.start_time || "99") || a.reference.localeCompare(b.reference));
    tomorrowSummary = { date: tomorrow, bookings: trips.length, guests: trips.reduce((sum, booking) => sum + attentionGuestCount(booking), 0), href: manifestHref };

    if (input.tomorrowAssignments) {
      const byBooking = new Map<string, AttentionAssignmentRow[]>();
      for (const row of input.tomorrowAssignments.filter(liveAssignment)) byBooking.set(row.booking_id, [...(byBooking.get(row.booking_id) || []), row]);
      const unassigned = trips.filter((booking) => !byBooking.get(booking.id)?.length);
      const noPickup = trips.filter((booking) => byBooking.get(booking.id)?.length && !booking.start_time && !byBooking.get(booking.id)!.some((row) => row.pickup_time));
      const entry = (booking: AttentionBookingRow): AttentionEntry => ({ key: booking.id, title: bookingTitle(booking), detail: [booking.tour_name || "Transfer", booking.hotel].filter(Boolean).join(" · "), href: manifestHref });
      if (unassigned.length) items.push({
        id: "tomorrow-unassigned", label: "Tomorrow: nobody assigned", count: unassigned.length,
        note: `${plural(unassigned.length, "trip")} on ${tomorrow} without a boat, driver or guide`,
        href: manifestHref, linkLabel: "Open manifest", entries: unassigned.slice(0, topN).map(entry),
      });
      if (noPickup.length) items.push({
        id: "tomorrow-no-pickup", label: "Tomorrow: no pickup time", count: noPickup.length,
        note: `${plural(noPickup.length, "trip")} assigned but without a pickup or start time`,
        href: manifestHref, linkLabel: "Open manifest", entries: noPickup.slice(0, topN).map(entry),
      });
    }
  }

  if (input.supplierRequests && input.supplierRequestBookings) {
    const cutoff = now.getTime() - SUPPLIER_WAIT_HOURS * HOUR;
    const bookings = new Map(input.supplierRequestBookings.map((booking) => [booking.id, booking]));
    const waiting = input.supplierRequests
      .flatMap((request) => {
        const booking = bookings.get(request.booking_id);
        const since = request.last_sent_at || request.sent_at;
        if (!booking || !isLive(booking) || booking.status === "completed") return [];
        if (booking.date && booking.date < today) return [];
        if (!(SUPPLIER_WAITING_STATUSES as readonly string[]).includes(request.status) || request.responded_at) return [];
        if (!since || Number.isNaN(Date.parse(since)) || Date.parse(since) > cutoff) return [];
        return [{ request, booking, since }];
      })
      .sort((a, b) => a.since.localeCompare(b.since));
    if (waiting.length) items.push({
      id: "supplier-waiting", label: "Suppliers not answering", count: waiting.length,
      note: `Requests sent over ${SUPPLIER_WAIT_HOURS}h ago with no reply`,
      href: bookingSearchHref(waiting[0].booking.reference, waiting[0].booking.date), linkLabel: "Open oldest",
      entries: waiting.slice(0, topN).map(({ request, booking, since }) => ({
        key: request.id, title: bookingTitle(booking),
        detail: `${request.supplier_name || "Supplier"} · ${booking.date || "no date"} · waiting ${hoursAgo(since, now)}h`,
        href: bookingSearchHref(booking.reference, booking.date),
      })),
    });
  }

  if (input.failedMessages) {
    const since = now.getTime() - FAILED_MESSAGE_DAYS * 24 * HOUR;
    const failed = input.failedMessages
      .filter((row) => Date.parse(row.scheduled_for) >= since)
      .sort((a, b) => b.scheduled_for.localeCompare(a.scheduled_for));
    if (failed.length) items.push({
      id: "failed-messages", label: "Failed messages", count: failed.length,
      note: `Guest messages that could not be delivered in the last ${FAILED_MESSAGE_DAYS} days`,
      href: "/admin/messages", linkLabel: "Open messages",
      entries: failed.slice(0, topN).map((row) => ({
        key: row.id, title: `${row.channel === "whatsapp" ? "WhatsApp" : "Email"} to ${row.recipient}`,
        detail: [row.scheduled_for.slice(0, 10), row.attempts ? plural(row.attempts, "attempt") : null, row.last_error].filter(Boolean).join(" · "),
        href: "/admin/messages",
      })),
    });
  }

  return { items, tomorrow: tomorrowSummary };
}
