import { describe, expect, it } from "vitest";
import { calculateBookingPrice } from "@/lib/booking-pricing";
import { eurToUsd, halfDayBoatOptions } from "@/data/speedboat-booking";

const tour = { type: "tour" as const, tourName: "", tourSlug: "orange-bay", adults: 1, youth: 0, infants: 0, service: "", pickup: "", dropoff: "", passengers: 0, travelBags: 0 };
const transfer = { type: "transfer" as const, tourName: "", adults: 0, youth: 0, infants: 0, service: "airport", pickup: "Hurghada Airport", dropoff: "Hurghada Hotels", passengers: 2, travelBags: 2 };

describe("authoritative booking pricing", () => {
  it("calculates adult, youth and infant tour pricing", () => {
    expect(calculateBookingPrice({ ...tour, adults: 2, youth: 1, infants: 1 }).data).toMatchObject({ amount: 80, guests: 4 });
  });

  it("rejects the removed Orange Bay remote pickup supplement", () => {
    expect(calculateBookingPrice({ ...tour, adults: 2, extras: ["remote-pickup"] }).error).toMatch(/valid optional extras/i);
  });

  it("rejects an unknown tour", () => {
    expect(calculateBookingPrice({ ...tour, tourSlug: undefined, tourName: "Fake tour" }).error).toMatch(/valid tour/i);
  });

  it("requires an adult", () => {
    expect(calculateBookingPrice({ ...tour, adults: 0 }).error).toMatch(/travelers/i);
  });

  it("rejects unsupported youth pricing", () => {
    expect(calculateBookingPrice({ ...tour, tourSlug: undefined, tourName: "Professional Underwater Photographer", youth: 1 }).error).toMatch(/not available/i);
  });

  it("calculates the Hurghada airport base fare", () => {
    expect(calculateBookingPrice(transfer).data?.amount).toBe(20);
  });

  it("adds the resort supplement once", () => {
    expect(calculateBookingPrice({ ...transfer, dropoff: "Soma Bay" }).data?.amount).toBe(27);
  });

  it("rejects airport routes without the airport", () => {
    expect(calculateBookingPrice({ ...transfer, pickup: "Hurghada Hotels", dropoff: "Soma Bay" }).error).toMatch(/airport/i);
  });

  it("enforces airport luggage capacity", () => {
    expect(calculateBookingPrice({ ...transfer, passengers: 2, travelBags: 3 }).error).toMatch(/bags/i);
    expect(calculateBookingPrice({ ...transfer, passengers: 3, travelBags: 6 }).data?.amount).toBe(20);
  });

  it("enforces Senzo passenger and luggage rules", () => {
    const senzo = { ...transfer, service: "senzo", pickup: "Hurghada Hotels", dropoff: "Senzo Mall", passengers: 4, travelBags: 0 };
    expect(calculateBookingPrice(senzo).data?.amount).toBe(10);
    expect(calculateBookingPrice({ ...senzo, passengers: 5 }).error).toMatch(/up to 4/i);
    expect(calculateBookingPrice({ ...senzo, travelBags: 1 }).error).toMatch(/no travel bags/i);
  });

  it("prices the private Luxor day trip from the server-side catalog", () => {
    const result = calculateBookingPrice({ ...tour, tourSlug: undefined, tourName: "Private Day Trip to Luxor from Hurghada", adults: 2 });
    expect(result).toEqual({ data: { amount: 240, guests: 2, guestSummary: "2 adults", tourName: "Private Day Trip to Luxor from Hurghada", price: "$240.00 total", currency: "USD" } });
  });

  it("prices the selected Orange Bay half-day boat and island entrances", () => {
    const result = calculateBookingPrice({ ...tour, tourName: "", tourSlug: "orange-bay-half-day-speedboat", adults: 6, selectedBoatOption: "boat-4" });
    expect(result.data).toMatchObject({ guests: 6, guestSummary: expect.stringContaining("6 passengers") });
    expect(result.data?.amount).toBeCloseTo(halfDayBoatOptions[3].price + 6 * eurToUsd(10));
  });

  it("uses the supplied Dolphin House adult, child and infant prices", () => {
    const result = calculateBookingPrice({ ...tour, tourName: "", tourSlug: "dolphin-house-snorkeling", adults: 2, youth: 1, infants: 1 });
    expect(result.data).toMatchObject({ amount: 65, guests: 4 });
  });

  it("prices multiple cart trips from the server-side catalog", () => {
    const result = calculateBookingPrice({
      ...tour,
      tourName: "Multi-trip booking",
      tourSlug: "multi-trip",
      adults: 0,
      cartItems: [
        { tourSlug: "orange-bay", date: "2099-01-01", time: "08:00", adults: 2, youth: 1, infants: 0, extras: [] },
        { tourSlug: "full-day-diving", date: "2099-01-02", time: "08:00", adults: 1, youth: 0, infants: 0, extras: [] },
      ],
    });
    expect(result.data).toMatchObject({ amount: 135, guests: 4, guestSummary: "2 trips · 4 participant places" });
    expect(result.data && "items" in result.data ? result.data.items : []).toHaveLength(2);
  });

  it("prices a speedboat, island entrance and quantity add-ons server-side", () => {
    const result = calculateBookingPrice({
      ...tour,
      tourName: "",
      tourSlug: "orange-bay-half-day-speedboat",
      adults: 2,
      youth: 1,
      selectedBoatOption: "boat-1",
      extraQuantities: { "mix-grill": 2, refreshments: 3 },
      transferRequired: true,
      transferArea: "Hurghada Hotels",
    });
    const expected = eurToUsd(120) + eurToUsd(10) * 2 + eurToUsd(5) + eurToUsd(15) * 2 + eurToUsd(6) * 3;
    expect(result.data).toMatchObject({ amount: Math.round(expected * 100) / 100, guests: 3 });
  });

  it("preserves same-capacity boats and enforces the selected capacity", () => {
    const valid = calculateBookingPrice({ ...tour, tourName: "", tourSlug: "paradise-island-speedboat", adults: 5, selectedBoatOption: "boat-2" });
    const tooMany = calculateBookingPrice({ ...tour, tourName: "", tourSlug: "paradise-island-speedboat", adults: 6, selectedBoatOption: "boat-2" });
    expect(valid.data?.guestSummary).toContain("Boat 2");
    expect(tooMany.error).toMatch(/up to 5 passengers/i);
  });

  it("validates a requested marina transfer area", () => {
    const result = calculateBookingPrice({ ...tour, tourName: "", tourSlug: "orange-bay-full-day-speedboat", selectedBoatOption: "boat-1", transferRequired: true, transferArea: "Unknown" });
    expect(result.error).toMatch(/valid marina transfer area/i);
  });
});
