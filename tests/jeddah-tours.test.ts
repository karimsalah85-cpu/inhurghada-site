import { describe, expect, it } from "vitest";
import { tours } from "@/data/tours";
import { getDestination } from "@/lib/destinations";
import { applyTourMediaSafety } from "@/lib/tour-media-safety";

describe("Jeddah destination", () => {
  it("publishes Jeddah with SAR pricing and its first active listing", () => {
    const destination = getDestination("jeddah");
    const listing = tours.find((tour) => tour.slug === "basic-diver-jeddah");

    expect(destination).toMatchObject({ status: "live", defaultCurrency: "SAR", country: "Saudi Arabia" });
    expect(listing).toMatchObject({ destinationSlug: "jeddah", currency: "SAR", price: "550", originalPrice: "600", listingStatus: "active" });
    expect(listing?.availableTimes).toEqual(["10:15 AM", "11:00 AM", "12:00 AM"]);
  });

  it("keeps the supplied Basic Diver artwork assigned to the listing", () => {
    const listing = tours.find((tour) => tour.slug === "basic-diver-jeddah");
    expect(applyTourMediaSafety(listing!).image).toBe("/images/owned/basic-diver-jeddah.jpg");
  });
});
