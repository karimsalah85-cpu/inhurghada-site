import { describe, expect, it } from "vitest";
import { tours } from "@/data/tours";
import { calculateBookingPrice } from "@/lib/booking-pricing";
import { applyAdminPriceTables, cleanAdminPriceTables, normalizeTourPricing } from "@/lib/tour-pricing";

const input = { type: "tour" as const, tourName: "", adults: 2, youth: 0, infants: 0, service: "", pickup: "", dropoff: "", passengers: 0, travelBags: 0 };
const boatTrip = tours.find((tour) => tour.slug === "orange-bay-half-day-speedboat")!;
const groupTrip = tours.find((tour) => tour.slug === "luxor-private-day-trip")!;

describe("boat prices set in the admin trip editor", () => {
  it("charges the admin price for that boat and leaves the others as coded", () => {
    const live = normalizeTourPricing(applyAdminPriceTables(boatTrip, { adminBoatPrices: { "boat-1": { price: "150", extraHourPrice: 35 }, "boat-2": { price: "" } } }));
    expect(live.boatOptions?.[0]).toMatchObject({ id: "boat-1", price: 150, extraHourPrice: 35, capacity: boatTrip.boatOptions![0].capacity });
    expect(live.boatOptions?.[1]).toEqual(boatTrip.boatOptions![1]);
    expect(live.price).toBe("150"); // the advertised price follows the first boat
    // Island entrance is charged per person on top of the boat, so compare against the coded total.
    const quote = (tour: typeof boatTrip, boat: string) => calculateBookingPrice({ ...input, tourSlug: boatTrip.slug, selectedBoatOption: boat }, [tour]).data!.amount;
    expect(Math.round((quote(live, "boat-1") - quote(boatTrip, "boat-1")) * 100) / 100).toBe(Math.round((150 - boatTrip.boatOptions![0].price) * 100) / 100);
    expect(quote(live, "boat-2")).toBe(quote(boatTrip, "boat-2"));
  });

  it("ignores unknown boats, zero, negative and non-numeric amounts", () => {
    const cleaned = cleanAdminPriceTables(boatTrip, { adminBoatPrices: { "boat-99": { price: 10 }, "boat-1": { price: 0 }, "boat-2": { price: -5 }, "boat-3": { price: "abc" }, "boat-4": { price: "199.999" } } });
    expect(cleaned.adminBoatPrices).toEqual({ "boat-4": { price: 200 } });
    expect(applyAdminPriceTables(boatTrip, { adminBoatPrices: { "boat-1": { price: 0 } } })).toBe(boatTrip);
    expect(applyAdminPriceTables(boatTrip, {})).toBe(boatTrip);
    expect(applyAdminPriceTables(boatTrip, { adminBoatPrices: "nonsense" })).toBe(boatTrip);
  });
});

describe("group-size prices set in the admin trip editor", () => {
  it("changes the rate for that group size only, keeping the coded steps", () => {
    const [first, second] = groupTrip.groupPricing!;
    const live = normalizeTourPricing(applyAdminPriceTables(groupTrip, { adminGroupPrices: { [first.minTravelers]: "200", 999: 1 } }));
    expect(live.groupPricing?.map((tier) => tier.minTravelers)).toEqual(groupTrip.groupPricing!.map((tier) => tier.minTravelers));
    expect(live.groupPricing?.[0].pricePerPerson).toBe(200);
    expect(live.groupPricing?.[1].pricePerPerson).toBe(second.pricePerPerson);
    expect(live.price).toBe("200");
    expect(calculateBookingPrice({ ...input, tourSlug: groupTrip.slug, adults: 2 }, [live]).data?.amount).toBe(400);
    expect(calculateBookingPrice({ ...input, tourSlug: groupTrip.slug, adults: second.minTravelers }, [live]).data?.amount).toBe(second.pricePerPerson * second.minTravelers);
  });

  it("does nothing on trips without a price table", () => {
    const single = tours.find((tour) => tour.slug === "orange-bay")!;
    expect(applyAdminPriceTables(single, { adminBoatPrices: { "boat-1": { price: 5 } }, adminGroupPrices: { 2: 5 } })).toBe(single);
  });
});
