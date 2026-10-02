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
    expect(email?.text).toContain("Booking status: Confirmed");
    expect(email?.text).toContain("Payment status: Paid");
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

  it("leads with the old and new date after staff move a booking", () => {
    const booking = { reference: "DRS-123", customer_name: "Sam", customer_email: "sam@example.com", tour_name: "Orange Bay", date: "2026-08-12", status: "confirmed", payment_status: "unpaid" };
    const moved = buildBookingAndPaymentStatusEmail({ ...booking, dateChange: { from: "2026-08-10", to: "2026-08-12" } });
    expect(moved?.subject).toBe("Booking DRS-123: New date · Confirmed · Payment Unpaid");
    expect(moved?.html).toContain("Your booking date has changed from 2026-08-10 to 2026-08-12.");
    expect(moved?.text).toContain("Your booking date has changed from 2026-08-10 to 2026-08-12.");

    const trip = buildBookingAndPaymentStatusEmail({ ...booking, locale: "de", dateChange: { from: null, to: "2026-08-12", tripName: "<Reef>" } });
    expect(trip?.html).toContain("&lt;Reef&gt;: Das neue Datum deiner Buchung ist 2026-08-12.");

    expect(buildBookingAndPaymentStatusEmail(booking)?.subject).toBe("Booking DRS-123: Confirmed · Payment Unpaid");
  });
});
