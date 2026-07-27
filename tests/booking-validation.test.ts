import { describe, expect, it } from "vitest";
import { validateBookingInput } from "@/lib/booking-validation";

const valid = { type: "tour", customerName: "Test Guest", phone: "+20 100 000 0000", customerEmail: "guest@example.com", hotel: "Test Hotel", date: "2099-01-01", tourName: "Orange Bay Island Snorkeling Boat Trip", adults: 1 };

describe("booking input validation", () => {
  it("accepts and normalizes valid input", () => {
    const result = validateBookingInput(valid);
    expect(result.data).toMatchObject({ customerName: "Test Guest", customerEmail: "guest@example.com", currency: "usd" });
  });

  it("rejects arrays and empty payloads", () => {
    expect(validateBookingInput(null).error).toBeDefined();
    expect(validateBookingInput([]).error).toBeDefined();
  });

  it("silently accepts the honeypot as spam", () => {
    expect(validateBookingInput({ ...valid, website: "bot" }).spam).toBe(true);
  });

  it("rejects invalid contact details", () => {
    expect(validateBookingInput({ ...valid, customerName: "A" }).error).toBeDefined();
    expect(validateBookingInput({ ...valid, phone: "123" }).error).toBeDefined();
    expect(validateBookingInput({ ...valid, customerEmail: "bad" }).error).toBeDefined();
  });

  it("rejects malformed and past dates", () => {
    expect(validateBookingInput({ ...valid, date: "tomorrow" }).error).toBeDefined();
    expect(validateBookingInput({ ...valid, date: "2020-01-01" }).error).toMatch(/future/i);
  });

  it("ignores a client-supplied currency and amount", () => {
    const result = validateBookingInput({ ...valid, amount: 0.01, currency: "xxx" });
    expect(result.data?.currency).toBe("usd");
    expect(result.data).not.toHaveProperty("amount");
  });

  it("requires one hour of lead time for transfer bookings", () => {
    const now = new Date("2026-07-27T10:00:00Z");
    const transfer = { ...valid, type: "transfer", date: "2026-07-27" };
    expect(validateBookingInput({ ...transfer, time: "13:30" }, now).error).toMatch(/at least 1 hour/i);
    expect(validateBookingInput({ ...transfer, time: "14:01" }, now).data?.time).toBe("14:01");
  });

  it("requires a valid diving-license confirmation for diving bookings", () => {
    const diving = { ...valid, tourSlug: "full-day-diving", tourName: "Full Day Scuba Diving Trip" };
    expect(validateBookingInput(diving).error).toMatch(/valid diving license/i);
    expect(validateBookingInput({ ...diving, divingLicenseConfirmed: true }).data?.divingLicenseConfirmed).toBe(true);
  });
});
