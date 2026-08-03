import { describe, expect, it } from "vitest";
import { calculateBookingPrice } from "@/lib/booking-pricing";

const tour = { type: "tour" as const, tourName: "Orange Bay Island Snorkeling Boat Trip", adults: 1, youth: 0, infants: 0, service: "", pickup: "", dropoff: "", passengers: 0, travelBags: 0 };
const transfer = { type: "transfer" as const, tourName: "", adults: 0, youth: 0, infants: 0, service: "airport", pickup: "Hurghada Airport", dropoff: "Hurghada Hotels", passengers: 2, travelBags: 2 };

describe("authoritative booking pricing", () => {
  it("calculates adult, youth and infant tour pricing", () => {
    expect(calculateBookingPrice({ ...tour, adults: 2, youth: 1, infants: 1 }).data).toMatchObject({ amount: 118.63, guests: 4 });
  });

  it("adds the Orange Bay remote pickup supplement once per booking", () => {
    expect(calculateBookingPrice({ ...tour, tourSlug: "orange-bay", extras: ["remote-pickup"] }).data?.amount).toBeCloseTo(53.61);
  });

  it("rejects an unknown tour", () => {
    expect(calculateBookingPrice({ ...tour, tourName: "Fake tour" }).error).toMatch(/valid tour/i);
  });

  it("requires an adult", () => {
    expect(calculateBookingPrice({ ...tour, adults: 0 }).error).toMatch(/travelers/i);
  });

  it("rejects unsupported youth pricing", () => {
    expect(calculateBookingPrice({ ...tour, tourName: "Professional Underwater Photographer", youth: 1 }).error).toMatch(/not available/i);
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
    const result = calculateBookingPrice({ ...tour, tourName: "Private Day Trip to Luxor from Hurghada", adults: 2 });
    expect(result).toEqual({ data: { amount: 240, guests: 2, guestSummary: "2 adults", tourName: "Private Day Trip to Luxor from Hurghada", price: "$240.00 total" } });
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
    expect(result.data).toMatchObject({ amount: 173.63, guests: 4, guestSummary: "2 trips · 4 participant places" });
    expect(result.data && "items" in result.data ? result.data.items : []).toHaveLength(2);
  });
});
