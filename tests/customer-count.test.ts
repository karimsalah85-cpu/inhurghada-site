import { describe, expect, it } from "vitest";
import { countDistinctCustomers } from "@/lib/customer-count";

describe("customer counting", () => {
  it("counts repeat bookings from the same normalized phone once", () => {
    expect(countDistinctCustomers([
      { phone: "+20 100 123 4567", customer_email: "one@example.com", reference: "A" },
      { phone: "201001234567", customer_email: "one@example.com", reference: "B" },
      { phone: "+20 111 999 0000", customer_email: "two@example.com", reference: "C" },
    ])).toBe(2);
  });

  it("uses normalized email when a phone is unavailable", () => {
    expect(countDistinctCustomers([
      { customer_email: " Guest@Example.com ", reference: "A" },
      { customer_email: "guest@example.com", reference: "B" },
    ])).toBe(1);
  });
});
