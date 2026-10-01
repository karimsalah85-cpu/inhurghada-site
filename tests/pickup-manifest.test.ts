import { describe, expect, it } from "vitest";
import { buildManifest, manifestText, whatsappLink, type ManifestBooking } from "@/lib/pickup-manifest";
import type { PickupZoneData } from "@/lib/pickup-zones";

const booking = (over: Partial<ManifestBooking>): ManifestBooking => ({ id: "b", reference: "DRS-1", type: "tour", customer_name: "Anna", phone: "+201001", tour_name: "Orange Bay", tour_slug: "orange-bay", date: "2026-10-02", start_time: null, hotel: "Steigenberger", notes: null, guests: 2, adults: 2, youth: 0, infants: 0, status: "confirmed", payment_status: "unpaid", amount: 60, currency: "USD", ...over });
const people = [
  { id: "s1", name: "Captain Ali boat", phone: "+20 100 111", whatsapp: "+20 100 222", kind: "supplier" as const },
  { id: "g1", name: "Mona", phone: "0100", role: "guide", kind: "staff" as const },
];

describe("pickup manifest", () => {
  it("groups by assigned supplier first, then staff, with unassigned last", () => {
    const groups = buildManifest(
      [booking({ id: "b1" }), booking({ id: "b2", reference: "DRS-2" }), booking({ id: "b3", reference: "DRS-3" })],
      [
        { booking_id: "b1", supplier_id: null, staff_member_id: "g1", assignment_type: "guide", pickup_time: null, status: "assigned", notes: null },
        { booking_id: "b1", supplier_id: "s1", staff_member_id: null, assignment_type: "supplier", pickup_time: null, status: "assigned", notes: null },
        { booking_id: "b2", supplier_id: null, staff_member_id: "g1", assignment_type: "guide", pickup_time: null, status: "assigned", notes: null },
      ],
      people,
    );
    expect(groups.map((group) => group.title)).toEqual(["Captain Ali boat", "Mona", "Not assigned yet"]);
    expect(groups[0].contactPhone).toBe("+20 100 222");
    expect(groups[2].stops[0].reference).toBe("DRS-3");
  });

  it("orders stops by pickup time (Cairo) then hotel, with unknown times last", () => {
    const [group] = buildManifest(
      [booking({ id: "b1", reference: "A", hotel: "Zeta" }), booking({ id: "b2", reference: "B", hotel: "Alpha", start_time: "09:30:00" }), booking({ id: "b3", reference: "C" })],
      [{ booking_id: "b1", supplier_id: null, staff_member_id: null, assignment_type: "driver", pickup_time: "2026-10-02T05:15:00Z", status: "assigned", notes: "Wheelchair" }],
      people,
    );
    expect(group.stops.map((stop) => [stop.reference, stop.time])).toEqual([["A", "08:15"], ["B", "09:30"], ["C", null]]);
    expect(group.stops[0].notes).toBe("Wheelchair");
  });

  it("counts guests, falling back to the total when the split was not recorded", () => {
    const [group] = buildManifest([booking({ id: "b1", adults: 0, youth: 0, infants: 0, guests: 7 }), booking({ id: "b2", adults: 2, youth: 1, infants: 1, guests: 4 })], [], people);
    expect(group.guests).toBe(11);
    expect(group.stops.find((stop) => stop.bookingId === "b1")).toMatchObject({ adults: 7, total: 7 });
  });

  it("skips cancelled bookings and cancelled assignments", () => {
    const groups = buildManifest([booking({ id: "b1", status: "cancelled" }), booking({ id: "b2" })], [{ booking_id: "b2", supplier_id: "s1", staff_member_id: null, assignment_type: "supplier", pickup_time: null, status: "cancelled", notes: null }], people);
    expect(groups).toHaveLength(1);
    expect(groups[0].key).toBe("unassigned");
  });

  it("keeps the guest price out of shared text unless asked", () => {
    const [group] = buildManifest([booking({ id: "b1", start_time: "08:00:00" })], [], people);
    expect(manifestText("2026-10-02", group)).not.toContain("Collect");
    expect(manifestText("2026-10-02", group, { includeCash: true })).toContain("Collect: 60.00 USD");
    expect(manifestText("2026-10-02", group)).toContain("08:00 · Steigenberger");
  });

  describe("zone pickup times", () => {
    const zoneData: PickupZoneData = {
      zones: [{ id: "z1", name: "Sahl Hasheesh", destination: "hurghada", active: true }],
      hotels: [{ id: "h1", name: "Baron Palace Sahl Hasheesh", normalized_name: "baron palace sahl hasheesh", aliases: [], zone_id: "z1", active: true }],
      times: [{ zone_id: "z1", tour_slug: "orange-bay", pickup_time: "07:15:00" }],
    };

    it("uses assignment time, then zone time, then departure time", () => {
      const [group] = buildManifest(
        [
          booking({ id: "b1", reference: "A", hotel: "baron palace sahl hasheesh hotel", start_time: "09:00:00" }),
          booking({ id: "b2", reference: "B", hotel: "Baron Palace Sahl Hasheesh", start_time: "09:00:00" }),
          booking({ id: "b3", reference: "C", hotel: "Unknown Hotel", start_time: "09:00:00" }),
          booking({ id: "b4", reference: "D", hotel: "Baron Palace Sahl Hasheesh", tour_slug: "safari", start_time: "10:00:00" }),
        ],
        [{ booking_id: "b1", supplier_id: null, staff_member_id: null, assignment_type: "driver", pickup_time: "2026-10-02T04:30:00Z", status: "assigned", notes: null }],
        people,
        zoneData,
      );
      expect(group.stops.map((stop) => [stop.reference, stop.time, stop.timeSource, stop.zone])).toEqual([
        ["A", "07:30", "assignment", "Sahl Hasheesh"],
        ["B", "07:15", "zone", "Sahl Hasheesh"],
        ["C", "09:00", "booking", null],
        ["D", "10:00", "booking", "Sahl Hasheesh"],
      ].sort((a, b) => String(a[1]).localeCompare(String(b[1]))));
    });

    it("behaves as before without zone data", () => {
      const [group] = buildManifest([booking({ id: "b1", hotel: "Baron Palace Sahl Hasheesh", start_time: "09:00:00" })], [], people, null);
      expect(group.stops[0]).toMatchObject({ time: "09:00", timeSource: "booking", zone: null });
    });

    it("shows the zone in shared text", () => {
      const [group] = buildManifest([booking({ id: "b1", hotel: "Baron Palace Sahl Hasheesh" })], [], people, zoneData);
      expect(manifestText("2026-10-02", group)).toContain("07:15 · Baron Palace Sahl Hasheesh (Sahl Hasheesh)");
    });
  });

  it("builds WhatsApp links with digits only", () => {
    expect(whatsappLink("+20 100 222", "hi")).toBe("https://wa.me/20100222?text=hi");
    expect(whatsappLink(null, "hi there")).toBe("https://wa.me/?text=hi%20there");
  });

  it("puts a compact requirements summary first in the stop notes", () => {
    const [group] = buildManifest([
      booking({ id: "b1", notes: "Birthday", guest_requirements: { nonSwimmers: 1, dietary: "Veg", certification: "open_water" } }),
      booking({ id: "b2", reference: "DRS-2", guest_requirements: {} }),
      booking({ id: "b3", reference: "DRS-3" }),
    ], [{ booking_id: "b1", supplier_id: null, staff_member_id: null, assignment_type: "driver", pickup_time: null, status: "assigned", notes: "Wheelchair" }], people);
    expect(group.stops.find((stop) => stop.bookingId === "b1")?.notes).toBe("1 non-swimmer · Diet: Veg · OW cert · Birthday · Wheelchair");
    expect(group.stops.find((stop) => stop.bookingId === "b2")?.notes).toBe("");
    expect(group.stops.find((stop) => stop.bookingId === "b3")?.notes).toBe("");
    expect(manifestText("2026-10-02", group)).toContain("Note: 1 non-swimmer · Diet: Veg · OW cert · Birthday · Wheelchair");
  });
});
