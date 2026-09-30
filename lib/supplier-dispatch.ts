/**
 * Pure building blocks for supplier booking requests: what we share with a
 * supplier, how the WhatsApp/email message reads, and which responses are
 * allowed from which state. No database or network access here, so it is all
 * unit-testable (see tests/supplier-dispatch.test.ts).
 *
 * Privacy rule (agreed with the owner): suppliers may see the booking details,
 * including the guest's name and phone, but NEVER the guest's email address.
 * The guest's price is only shared when the admin explicitly ticks it (useful
 * when the supplier collects cash on arrival).
 */

export type SupplierBookingRow = {
  reference: string;
  type?: string | null;
  customer_name: string;
  phone?: string | null;
  tour_name?: string | null;
  date?: string | null;
  start_time?: string | null;
  guests?: number | null;
  adults?: number | null;
  youth?: number | null;
  infants?: number | null;
  hotel?: string | null;
  notes?: string | null;
  amount?: number | string | null;
  currency?: string | null;
  payment_status?: string | null;
  status?: string | null;
  pricing_snapshot?: unknown;
  transfer_details?: unknown;
};

export type SupplierTrip = {
  name: string;
  date: string | null;
  time: string | null;
  guests: number;
  adults: number | null;
  youth: number | null;
  infants: number | null;
  extras: string[];
};

export type SupplierTransfer = {
  route: string;
  flight: string | null;
  returnLeg: string | null;
  luggage: string | null;
  childSeats: string | null;
  wheelchair: string | null;
  vehicles: string | null;
};

export type SupplierBookingDetails = {
  version: 1;
  reference: string;
  kind: "tour" | "transfer";
  guestName: string;
  guestPhone: string | null;
  pickup: string | null;
  trips: SupplierTrip[];
  notes: string | null;
  transfer: SupplierTransfer | null;
  /** Present only when the admin chose to share the guest's price. */
  guestPayment: { status: "paid" | "to_collect" | "refunded"; amount: number; currency: string } | null;
};

const text = (value: unknown, max = 500) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/\s+\n/g, "\n");
  return trimmed ? trimmed.slice(0, max) : null;
};
const count = (value: unknown) => (typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null);
const human = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim().replace(/_/g, " ") : null);
const hhmm = (value: unknown) => {
  const raw = text(value, 20);
  const match = raw ? /^(\d{1,2}):(\d{2})/.exec(raw) : null;
  return match ? `${match[1].padStart(2, "0")}:${match[2]}` : raw;
};

/** Removes anything that looks like an email address from free text (e.g. booking notes). */
export function redactEmails(value: string) {
  return value.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email hidden]");
}

function tripsFrom(booking: SupplierBookingRow): SupplierTrip[] {
  const snapshot = booking.pricing_snapshot as { trips?: unknown } | null | undefined;
  const raw = Array.isArray(snapshot?.trips) ? (snapshot.trips as Record<string, unknown>[]).slice(0, 20) : [];
  const trips = raw.flatMap((trip): SupplierTrip[] => {
    if (!trip || typeof trip !== "object") return [];
    const name = text(trip.name, 200);
    if (!name) return [];
    const participants = (trip.participants && typeof trip.participants === "object" ? trip.participants : null) as Record<string, unknown> | null;
    const lines = Array.isArray(trip.lines) ? (trip.lines as Record<string, unknown>[]) : [];
    const extras = lines
      .filter((line) => line && line.kind === "extra")
      .map((line) => {
        const label = text(line.label, 120) || "Extra";
        const quantity = count(line.quantity);
        return quantity && quantity > 1 ? `${label} ×${quantity}` : label;
      });
    return [{
      name,
      date: text(trip.date, 20),
      time: hhmm(trip.time),
      guests: count(trip.guests) ?? count(booking.guests) ?? 0,
      adults: participants ? count(participants.adults) : null,
      youth: participants ? count(participants.youth) : null,
      infants: participants ? count(participants.infants) : null,
      extras,
    }];
  });
  if (trips.length) return trips;
  return [{
    name: text(booking.tour_name, 200) || (booking.type === "transfer" ? "Transfer" : "Booking"),
    date: text(booking.date, 20),
    time: hhmm(booking.start_time),
    guests: count(booking.guests) ?? 0,
    adults: count(booking.adults),
    youth: count(booking.youth),
    infants: count(booking.infants),
    extras: [],
  }];
}

function transferFrom(value: unknown): SupplierTransfer | null {
  if (!value || typeof value !== "object") return null;
  const t = value as Record<string, unknown>;
  const luggage = (t.luggage && typeof t.luggage === "object" ? t.luggage : null) as Record<string, unknown> | null;
  const returnLeg = (t.return_leg && typeof t.return_leg === "object" ? t.return_leg : null) as Record<string, unknown> | null;
  const seats = t.child_seats && typeof t.child_seats === "object"
    ? Object.entries(t.child_seats as Record<string, unknown>).filter(([, n]) => Number(n) > 0).map(([kind, n]) => `${Number(n)} ${kind.replace(/_/g, " ")}`)
    : [];
  const vehicles = Array.isArray(t.allocated_vehicles)
    ? (t.allocated_vehicles as Record<string, unknown>[]).map((v) => `${Number(v?.count) || 1}× ${human(v?.vehicle_class) || "vehicle"}`)
    : [];
  const oversized = Array.isArray(luggage?.oversized_items)
    ? (luggage.oversized_items as Record<string, unknown>[]).map((o) => `${Number(o?.quantity) || 1}× ${human(o?.type) || "item"}`)
    : [];
  const luggageParts = luggage ? [
    count(luggage.large_bags) ? `${luggage.large_bags} large` : "",
    count(luggage.cabin_bags) ? `${luggage.cabin_bags} cabin` : "",
    oversized.length ? `oversized: ${oversized.join(", ")}` : "",
  ].filter(Boolean) : [];
  const wheelchair = human(t.wheelchair);
  return {
    route: [human(t.direction), human(t.zone), t.trip_type === "round_trip" ? "round trip" : "one way"].filter(Boolean).join(" · "),
    flight: text(t.flight_number, 40),
    returnLeg: returnLeg ? [text(returnLeg.date, 20), hhmm(returnLeg.time), text(returnLeg.flight_number, 40)].filter(Boolean).join(" ") || null : null,
    luggage: luggageParts.length ? luggageParts.join(" · ") : null,
    childSeats: seats.length ? seats.join(", ") : null,
    wheelchair: wheelchair && wheelchair !== "none" ? wheelchair : null,
    vehicles: vehicles.length ? vehicles.join(" + ") : null,
  };
}

export function buildSupplierBookingDetails(booking: SupplierBookingRow, options: { includeGuestPrice?: boolean } = {}): SupplierBookingDetails {
  const notes = text(booking.notes, 1500);
  const amount = Number(booking.amount);
  const currency = (text(booking.currency, 3) || "USD").toUpperCase();
  const paymentStatus = booking.payment_status === "paid" ? "paid" : booking.payment_status === "refunded" ? "refunded" : "to_collect";
  return {
    version: 1,
    reference: booking.reference,
    kind: booking.type === "transfer" ? "transfer" : "tour",
    guestName: text(booking.customer_name, 200) || "Guest",
    guestPhone: text(booking.phone, 40),
    pickup: text(booking.hotel, 300),
    trips: tripsFrom(booking),
    notes: notes ? redactEmails(notes) : null,
    transfer: transferFrom(booking.transfer_details),
    guestPayment: options.includeGuestPrice && Number.isFinite(amount) ? { status: paymentStatus, amount, currency } : null,
  };
}

export function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function formatTripDate(value: string | null) {
  if (!value) return "Date to be confirmed";
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

export function participantsLabel(trip: Pick<SupplierTrip, "guests" | "adults" | "youth" | "infants">) {
  const parts = [
    trip.adults ? `${trip.adults} adult${trip.adults === 1 ? "" : "s"}` : "",
    trip.youth ? `${trip.youth} child${trip.youth === 1 ? "" : "ren"}` : "",
    trip.infants ? `${trip.infants} infant${trip.infants === 1 ? "" : "s"}` : "",
  ].filter(Boolean);
  return parts.length ? `${parts.join(", ")} (${trip.guests} total)` : `${trip.guests} guest${trip.guests === 1 ? "" : "s"}`;
}

export type DetailRow = [label: string, value: string];

/** One flat list of label/value rows, shared by the WhatsApp text, the email and the supplier page. */
export function detailRows(details: SupplierBookingDetails, amountDue?: { amount: number; currency: string } | null): DetailRow[] {
  const rows: DetailRow[] = [["Booking", details.reference], ["Guest", details.guestName]];
  if (details.guestPhone) rows.push(["Guest phone", details.guestPhone]);
  details.trips.forEach((trip, index) => {
    const prefix = details.trips.length > 1 ? `Trip ${index + 1}` : "Trip";
    rows.push([prefix, trip.name]);
    rows.push([details.trips.length > 1 ? `${prefix} date` : "Date", `${formatTripDate(trip.date)}${trip.time ? ` · ${trip.time}` : ""}`]);
    rows.push([details.trips.length > 1 ? `${prefix} guests` : "Guests", participantsLabel(trip)]);
    if (trip.extras.length) rows.push([details.trips.length > 1 ? `${prefix} extras` : "Extras", trip.extras.join(", ")]);
  });
  rows.push(["Pickup", details.pickup || "To be confirmed"]);
  if (details.transfer) {
    const t = details.transfer;
    if (t.route) rows.push(["Route", t.route]);
    if (t.flight) rows.push(["Flight", t.flight]);
    if (t.returnLeg) rows.push(["Return", t.returnLeg]);
    if (t.vehicles) rows.push(["Vehicles", t.vehicles]);
    if (t.luggage) rows.push(["Luggage", t.luggage]);
    if (t.childSeats) rows.push(["Child seats", t.childSeats]);
    if (t.wheelchair) rows.push(["Wheelchair", t.wheelchair]);
  }
  if (details.guestPayment) {
    const p = details.guestPayment;
    rows.push(["Guest payment", p.status === "paid" ? "Paid to Daily Red Sea" : p.status === "refunded" ? "Refunded" : `To collect: ${formatMoney(p.amount, p.currency)}`]);
  }
  if (amountDue) rows.push(["Your payment", formatMoney(amountDue.amount, amountDue.currency)]);
  if (details.notes) rows.push(["Notes", details.notes]);
  return rows;
}

export type MessageKind = "request" | "reminder" | "update" | "cancelled" | "payment_sent";

export type SupplierMessageInput = {
  kind: MessageKind;
  supplierName: string;
  details: SupplierBookingDetails;
  link: string;
  adminNote?: string | null;
  amountDue?: { amount: number; currency: string } | null;
  payment?: { amount: number; currency: string; method?: string | null; reference?: string | null } | null;
};

const headline: Record<MessageKind, string> = {
  request: "New booking request",
  reminder: "Reminder: please confirm this booking",
  update: "Booking updated — please re-confirm",
  cancelled: "Booking cancelled — no service needed",
  payment_sent: "Payment sent",
};

const arabicAction: Record<MessageKind, string> = {
  request: "للتأكيد أو الاعتذار اضغط على الرابط",
  reminder: "برجاء التأكيد من خلال الرابط",
  update: "برجاء إعادة التأكيد من خلال الرابط",
  cancelled: "تم إلغاء هذا الحجز",
  payment_sent: "برجاء تأكيد استلام المبلغ من خلال الرابط",
};

const methodLabel = (method: string | null | undefined) => (method ? method.replace(/_/g, " ") : null);

/** Plain-text body used for WhatsApp (and as the email's text part). */
export function buildSupplierMessage(input: SupplierMessageInput) {
  const { details } = input;
  const lines = [`Daily Red Sea — ${headline[input.kind]}`, "", `Hello ${input.supplierName},`, ""];
  if (input.kind === "cancelled") {
    lines.push(`Booking ${details.reference} (${details.trips.map((t) => `${t.name}, ${formatTripDate(t.date)}`).join(" / ")}) has been cancelled. Please release the place — no service is needed.`);
  } else if (input.kind === "payment_sent" && input.payment) {
    const via = methodLabel(input.payment.method);
    lines.push(`We sent you ${formatMoney(input.payment.amount, input.payment.currency)} for booking ${details.reference}${via ? ` by ${via}` : ""}${input.payment.reference ? ` (ref ${input.payment.reference})` : ""}.`);
    lines.push("Please confirm once you have received it.");
  } else {
    for (const [label, value] of detailRows(details, input.amountDue)) lines.push(`• ${label}: ${value}`);
  }
  if (input.adminNote) lines.push("", `Note from Daily Red Sea: ${input.adminNote}`);
  if (input.kind !== "cancelled") {
    lines.push("", input.kind === "payment_sent" ? "Confirm receipt here:" : "Confirm, decline or ask for a change here:", input.link, arabicAction[input.kind]);
  } else {
    lines.push("", arabicAction.cancelled);
  }
  return lines.join("\n");
}

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[c] || c);

export function buildSupplierEmail(input: SupplierMessageInput) {
  const { details } = input;
  const subject = `${headline[input.kind]} · ${details.reference} · ${details.trips[0]?.name || "Booking"} · ${formatTripDate(details.trips[0]?.date ?? null)}`;
  const rows = input.kind === "request" || input.kind === "reminder" || input.kind === "update" ? detailRows(details, input.amountDue) : [];
  const table = rows.length
    ? `<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:560px">${rows.map(([label, value]) => `<tr><th align="left" valign="top" style="padding:8px;border-bottom:1px solid #e2e8f0;color:#475569;width:140px">${escapeHtml(label)}</th><td style="padding:8px;border-bottom:1px solid #e2e8f0;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`).join("")}</table>`
    : "";
  const body = buildSupplierMessage(input).split("\n").slice(4);
  const intro = input.kind === "cancelled" || input.kind === "payment_sent" ? `<p>${escapeHtml(body[0] || "")}</p>${input.kind === "payment_sent" ? "<p>Please confirm once you have received it.</p>" : ""}` : "<p>Please check the booking below and let us know if you can take it.</p>";
  const note = input.adminNote ? `<p style="padding:12px;background:#fef9c3;border-radius:8px"><strong>Note from Daily Red Sea:</strong> ${escapeHtml(input.adminNote)}</p>` : "";
  const button = input.kind === "cancelled"
    ? ""
    : `<p style="margin:24px 0"><a href="${escapeHtml(input.link)}" style="display:inline-block;padding:14px 22px;background:#0369a1;color:#fff;border-radius:10px;font-weight:bold;text-decoration:none">${input.kind === "payment_sent" ? "Confirm payment received" : "Confirm or decline"}</a></p><p dir="rtl" style="color:#475569">${escapeHtml(arabicAction[input.kind])}</p>`;
  const html = `<div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.5"><p>Hello ${escapeHtml(input.supplierName)},</p>${intro}${table}${note}${button}<p style="color:#64748b;font-size:12px">This link is personal to you. Please do not forward it.</p></div>`;
  return { subject, html, text: buildSupplierMessage(input) };
}

// ---------------------------------------------------------------------------
// State machine
// ---------------------------------------------------------------------------

export type RequestStatus = "sent" | "confirmed" | "declined" | "change_requested" | "cancelled";
export type PaymentStatus = "none" | "sent" | "received" | "disputed";
export type SupplierAction = "confirm" | "decline" | "change" | "payment_received" | "payment_disputed";

export const supplierActions: SupplierAction[] = ["confirm", "decline", "change", "payment_received", "payment_disputed"];

export type Transition =
  | { ok: true; noop: boolean; status?: RequestStatus; paymentStatus?: PaymentStatus; event: "confirmed" | "declined" | "change_requested" | "payment_received" | "payment_disputed" }
  | { ok: false; reason: "cancelled" | "not_allowed" | "note_required" | "no_payment" };

/** What a supplier response does from the request's current state. Repeating the same answer is a harmless no-op. */
export function supplierTransition(current: { status: RequestStatus; payment_status: PaymentStatus }, action: SupplierAction, note?: string | null): Transition {
  const hasNote = Boolean(note && note.trim().length >= 3);
  if (action === "payment_received" || action === "payment_disputed") {
    if (current.payment_status === "none") return { ok: false, reason: "no_payment" };
    if (action === "payment_received") {
      if (current.payment_status === "received") return { ok: true, noop: true, event: "payment_received" };
      return { ok: true, noop: false, paymentStatus: "received", event: "payment_received" };
    }
    if (!hasNote) return { ok: false, reason: "note_required" };
    if (current.payment_status === "disputed") return { ok: true, noop: true, event: "payment_disputed" };
    if (current.payment_status !== "sent") return { ok: false, reason: "not_allowed" };
    return { ok: true, noop: false, paymentStatus: "disputed", event: "payment_disputed" };
  }
  if (current.status === "cancelled") return { ok: false, reason: "cancelled" };
  switch (action) {
    case "confirm":
      if (current.status === "confirmed") return { ok: true, noop: true, event: "confirmed" };
      if (current.status === "sent" || current.status === "change_requested") return { ok: true, noop: false, status: "confirmed", event: "confirmed" };
      return { ok: false, reason: "not_allowed" };
    case "decline":
      if (current.status === "declined") return { ok: true, noop: true, event: "declined" };
      return { ok: true, noop: false, status: "declined", event: "declined" };
    case "change":
      if (!hasNote) return { ok: false, reason: "note_required" };
      if (current.status === "declined") return { ok: false, reason: "not_allowed" };
      return { ok: true, noop: false, status: "change_requested", event: "change_requested" };
  }
}

export const statusLabels: Record<RequestStatus, string> = {
  sent: "Waiting for reply",
  confirmed: "Confirmed",
  declined: "Declined",
  change_requested: "Change requested",
  cancelled: "Cancelled",
};

export const paymentLabels: Record<PaymentStatus, string> = {
  none: "Not paid yet",
  sent: "Payment sent · awaiting receipt",
  received: "Payment received",
  disputed: "Payment not received",
};

export const paymentMethods = ["cash", "bank_transfer", "instapay", "vodafone_cash", "other"] as const;

/** WhatsApp numbers are stored free-form; Twilio and wa.me need digits in international form. */
export function whatsappDigits(value: string | null | undefined) {
  if (!value) return null;
  let digits = value.replace(/[^\d+]/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  digits = digits.replace(/\+/g, "");
  // Egyptian local mobile format (01xxxxxxxxx) → +20 1xxxxxxxxx
  if (/^01[0125]\d{8}$/.test(digits)) digits = `2${digits}`;
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}
