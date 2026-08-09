import { describe, expect, it } from "vitest";
import { matchesServiceCampaign, rankTopServices, totalBookingExpenses } from "@/lib/admin-analytics";

describe("admin analytics", () => {
  it("ranks only confirmed services and calculates trends", () => {
    const current = [{ tour_name: "Orange Bay Speedboat", date: "2026-08-10", status: "confirmed" }, { tour_name: "Orange Bay Speedboat", date: "2026-08-11", status: "confirmed" }, { tour_name: "Safari", date: "2026-08-11", status: "cancelled" }];
    const previous = [{ tour_name: "Orange Bay Speedboat", date: "2026-08-01", status: "confirmed" }];
    expect(rankTopServices(current, previous)[0]).toMatchObject({ service: "Orange Bay Speedboat", bookings: 2, previousBookings: 1, trend: 100 });
  });
  it("matches campaigns only when at least two meaningful words overlap", () => {
    expect(matchesServiceCampaign("Orange Bay Speedboat", "Hurghada Orange Bay Speedboat Search")).toBe(true);
    expect(matchesServiceCampaign("Orange Bay Speedboat", "Generic Hurghada Tours")).toBe(false);
  });
  it("totals multiple expense lines for one booking", () => {
    expect(totalBookingExpenses([{ booking_id: "a", amount: 40 }, { booking_id: "a", amount: "12.50" }, { booking_id: "b", amount: 99 }], "a")).toBe(52.5);
  });
});
