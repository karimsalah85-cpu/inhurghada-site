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
});
