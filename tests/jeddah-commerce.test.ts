import { describe, expect, it } from "vitest";
import { tours } from "@/data/tours";
import { codeControlledTourFields } from "@/lib/live-content";

describe("Jeddah commerce authority", () => {
  it("keeps the verified sunset-cruise currency, schedule and fulfillment out of CMS overrides, while the admin sets the price", () => {
    const tour = tours.find((item) => item.slug === "jeddah-yacht-sunset-cruise");
    const controlled = codeControlledTourFields(tour);
    expect(controlled).toMatchObject({
      currency: "USD",
      fulfillmentType: "meeting_point",
      departureMarina: "Rixos Resort Gate 2, Obhur Bay",
      operatingWeekdays: [1, 3, 4],
    });
    expect(controlled).not.toHaveProperty("price");
    expect(controlled).not.toHaveProperty("participantPricing");
  });
});
