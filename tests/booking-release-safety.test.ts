import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const route = readFileSync("app/api/bookings/route.ts", "utf8");

describe("booking release safety", () => {
  it("fails closed when capacity reservation RPCs are unavailable", () => {
    expect(route).toContain('supabase.rpc("reserve_booking"');
    expect(route).toContain('supabase.rpc("reserve_multi_trip_booking"');
    expect(route).not.toMatch(/PGRST202|42883/);
    expect(route).not.toMatch(/from\("bookings"\)\.insert/);
  });

  it("persists before sending customer or operator notifications", () => {
    expect(route.indexOf('if (bookingError)')).toBeLessThan(route.indexOf("const [whatsappResult"));
  });
});
