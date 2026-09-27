import { describe, expect, it } from "vitest";
import { startTimeChoices } from "@/lib/tour-times";
import { tours } from "@/data/tours";

describe("startTimeChoices", () => {
  it("offers the El Gouna horse ride's three morning start times", () => {
    const tour = tours.find((item) => item.slug === "horse-riding-el-gouna");
    expect(startTimeChoices(tour?.availableTimes)).toEqual(["07:00", "08:00", "09:00"]);
  });

  it("keeps single or descriptive times out of the choice list", () => {
    expect(startTimeChoices(["08:00"])).toEqual([]);
    expect(startTimeChoices(["Morning pickup confirmed by WhatsApp"])).toEqual([]);
    expect(startTimeChoices(["07:00 pickup", "09:00"])).toEqual([]);
    expect(startTimeChoices(undefined)).toEqual([]);
  });
});
