import { createZoneLookup, type PickupZoneData } from "@/lib/pickup-zones";
import { compactRequirementsSummary } from "@/lib/guest-requirements";

export type ManifestBooking = {
  id: string;
  reference: string;
  type: string | null;
  customer_name: string | null;
  phone: string | null;
  tour_name: string | null;
  tour_slug: string | null;
  date: string | null;
  start_time: string | null;
  hotel: string | null;
  notes: string | null;
  guests: number | null;
  adults: number | null;
  youth: number | null;
  infants: number | null;
  status: string | null;
  payment_status: string | null;
  amount: number | null;
  currency: string | null;
  /** bookings.guest_requirements; absent until the 20261001065646 migration is applied. */
  guest_requirements?: unknown;
};
export type ManifestAssignment = { booking_id: string; supplier_id: string | null; staff_member_id: string | null; assignment_type: string | null; pickup_time: string | null; status: string | null; notes: string | null };
export type ManifestPerson = { id: string; name: string; phone: string | null; whatsapp?: string | null; kind: "supplier" | "staff"; role?: string | null };

export type ManifestStop = {
  bookingId: string;
  reference: string;
  time: string | null;
  /** Where the time came from: set on the assignment, the zone's standard time, or the tour departure. */
  timeSource: "assignment" | "zone" | "booking" | null;
  hotel: string;
  /** Pickup zone of the matched hotel, when the hotel is on the hotel list and has a zone. */
  zone: string | null;
  guest: string;
  phone: string;
  tour: string;
  adults: number;
  children: number;
  infants: number;
  total: number;
  notes: string;
  cashToCollect: string | null;
  status: string;
};
export type ManifestGroup = { key: string; title: string; subtitle: string; contactPhone: string | null; stops: ManifestStop[]; guests: number };

const cairoTime = (value: string) => new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Africa/Cairo" }).format(new Date(value));

function guestCounts(booking: ManifestBooking) {
  const adults = Math.max(0, Number(booking.adults || 0));
  const children = Math.max(0, Number(booking.youth || 0));
  const infants = Math.max(0, Number(booking.infants || 0));
  const counted = adults + children + infants;
  const total = counted || Math.max(0, Number(booking.guests || 0));
  // Older bookings only recorded a total; treat it as adults so the driver still sees the headcount.
  return counted ? { adults, children, infants, total } : { adults: total, children: 0, infants: 0, total };
}

/**
 * Builds the day's run sheet: one group per boat / vehicle / guide (whoever is assigned first to the
 * booking — suppliers before staff), stops ordered by pickup time then hotel. Unassigned bookings go
 * in their own group at the end so nothing is missed.
 *
 * Pickup time: the assignment's pickup time, else the standard time for the hotel's pickup zone and
 * the tour (when `zoneData` is given), else the booking's departure time.
 */
export function buildManifest(bookings: ManifestBooking[], assignments: ManifestAssignment[], people: ManifestPerson[], zoneData?: PickupZoneData | null): ManifestGroup[] {
  const zoneFor = createZoneLookup(zoneData);
  const peopleById = new Map(people.map((person) => [`${person.kind}:${person.id}`, person]));
  const assignmentsByBooking = new Map<string, ManifestAssignment[]>();
  for (const assignment of assignments) {
    if (assignment.status === "cancelled") continue;
    assignmentsByBooking.set(assignment.booking_id, [...(assignmentsByBooking.get(assignment.booking_id) || []), assignment]);
  }
  const groups = new Map<string, ManifestGroup>();
  for (const booking of bookings) {
    if (booking.status === "cancelled") continue;
    const own = (assignmentsByBooking.get(booking.id) || []).slice().sort((a, b) => Number(Boolean(b.supplier_id)) - Number(Boolean(a.supplier_id)));
    const lead = own[0];
    const person = lead ? (lead.supplier_id ? peopleById.get(`supplier:${lead.supplier_id}`) : lead.staff_member_id ? peopleById.get(`staff:${lead.staff_member_id}`) : undefined) : undefined;
    const key = person ? `${person.kind}:${person.id}` : "unassigned";
    const pickup = own.map((assignment) => assignment.pickup_time).filter((value): value is string => Boolean(value) && !Number.isNaN(new Date(value!).getTime())).sort()[0];
    const zoned = zoneFor(booking.hotel, booking.tour_slug);
    const time = pickup ? cairoTime(pickup) : zoned.time ?? (booking.start_time ? booking.start_time.slice(0, 5) : null);
    const timeSource: ManifestStop["timeSource"] = pickup ? "assignment" : zoned.time ? "zone" : time ? "booking" : null;
    const counts = guestCounts(booking);
    const extraNotes = own.map((assignment) => assignment.notes).filter(Boolean).join(" · ");
    const stop: ManifestStop = {
      bookingId: booking.id,
      reference: booking.reference,
      time,
      timeSource,
      hotel: booking.hotel?.trim() || "Hotel not recorded",
      zone: zoned.zone?.name ?? null,
      guest: booking.customer_name?.trim() || "Guest",
      phone: booking.phone?.trim() || "",
      tour: booking.tour_name?.trim() || booking.tour_slug || "Service",
      ...counts,
      notes: [compactRequirementsSummary(booking.guest_requirements), booking.notes?.trim(), extraNotes].filter(Boolean).join(" · "),
      cashToCollect: booking.payment_status !== "paid" && Number(booking.amount) > 0 ? `${Number(booking.amount).toFixed(2)} ${booking.currency || "USD"}` : null,
      status: booking.status || "new",
    };
    if (!groups.has(key)) {
      groups.set(key, person
        ? { key, title: person.name, subtitle: person.kind === "supplier" ? "Supplier" : (person.role ? person.role[0].toUpperCase() + person.role.slice(1) : "Staff"), contactPhone: person.whatsapp || person.phone || null, stops: [], guests: 0 }
        : { key, title: "Not assigned yet", subtitle: "Assign a boat, vehicle or guide under Dispatch & calendar", contactPhone: null, stops: [], guests: 0 });
    }
    const group = groups.get(key)!;
    group.stops.push(stop);
    group.guests += stop.total;
  }
  const byTime = (a: ManifestStop, b: ManifestStop) => (a.time || "99:99").localeCompare(b.time || "99:99") || a.hotel.localeCompare(b.hotel) || a.reference.localeCompare(b.reference);
  for (const group of groups.values()) group.stops.sort(byTime);
  return [...groups.values()].sort((a, b) => Number(a.key === "unassigned") - Number(b.key === "unassigned") || a.title.localeCompare(b.title));
}

/**
 * Plain-text list for WhatsApp: short lines, one stop per block. The guest price is left out unless
 * asked for, because the list usually goes to a supplier who should not see what the guest paid.
 */
export function manifestText(date: string, group: ManifestGroup, { includeCash = false }: { includeCash?: boolean } = {}) {
  const lines = [`Daily Red Sea — pickups ${date}`, `${group.title}: ${group.stops.length} booking${group.stops.length === 1 ? "" : "s"}, ${group.guests} guest${group.guests === 1 ? "" : "s"}`, ""];
  for (const stop of group.stops) {
    const pax = [stop.adults && `${stop.adults}A`, stop.children && `${stop.children}C`, stop.infants && `${stop.infants}I`].filter(Boolean).join(" ") || `${stop.total}`;
    lines.push(`${stop.time || "Time TBC"} · ${stop.hotel}${stop.zone ? ` (${stop.zone})` : ""}`);
    lines.push(`${stop.guest} (${pax}) · ${stop.phone || "no phone"} · ${stop.reference}`);
    lines.push(stop.tour);
    if (includeCash && stop.cashToCollect) lines.push(`Collect: ${stop.cashToCollect}`);
    if (stop.notes) lines.push(`Note: ${stop.notes}`);
    lines.push("");
  }
  return lines.join("\n").trim();
}

export function whatsappLink(phone: string | null, text: string) {
  const digits = (phone || "").replace(/\D/g, "").replace(/^00/, "");
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
}
