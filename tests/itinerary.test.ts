import { describe, expect, it } from "vitest";
import { parseItineraryStep } from "@/lib/itinerary";

describe("itinerary timeline parser", () => {
  it("separates stop, activity and duration", () => {
    expect(parseItineraryStep("Red Sea · Boat cruise (45 minutes)")).toEqual({ title: "Red Sea", detail: "Boat cruise", duration: "45 minutes", optional: false });
  });
  it("recognizes localized optional markers", () => {
    expect(parseItineraryStep("Snorkeling (45 minutes) · 可选").optional).toBe(true);
    expect(parseItineraryStep("Снорклинг (45 minutes) · По желанию").optional).toBe(true);
  });
});
