import { describe, expect, it } from "vitest";
import { buildBookingAndPaymentStatusEmail } from "@/lib/booking-status-notification";

describe("predefined booking status emails", () => {
  it("includes the current booking and payment statuses", () => {
    const email = buildBookingAndPaymentStatusEmail({
      reference: "DRS-123",
      customer_name: "Sam",
      customer_email: "sam@example.com",
      tour_name: "Orange Bay",
      date: "2026-08-10",
      status: "confirmed",
      payment_status: "paid",
      amount: 50,
      currency: "USD",
    });

    expect(email?.subject).toContain("Confirmed · Payment Paid");
    expect(email?.html).toContain("Booking status");
    expect(email?.html).toContain("Payment status");
    expect(email?.html).toContain("$50.00");
  });

  it("escapes customer-controlled values and rejects unknown statuses", () => {
    const email = buildBookingAndPaymentStatusEmail({
      reference: "DRS-<script>",
      customer_name: "<img>",
      customer_email: "sam@example.com",
      tour_name: "<b>Trip</b>",
      date: null,
      status: "new",
      payment_status: "unpaid",
    });
    expect(email?.html).not.toContain("<script>");
    expect(email?.html).not.toContain("<img>");
    expect(buildBookingAndPaymentStatusEmail({
      reference: "DRS-123",
      customer_name: "Sam",
      customer_email: "sam@example.com",
      tour_name: null,
      date: null,
      status: "unknown",
      payment_status: "paid",
    })).toBeNull();
  });
});
