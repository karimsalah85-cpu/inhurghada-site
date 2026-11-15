import { describe, expect, it } from "vitest";
import { bookingReports, type BookingReportLine } from "@/lib/finance/booking-report";
const line: BookingReportLine = { booking_id: "b", included: true, outcome: "completed", recognised_revenue: "88.30", margin_amount: "19.82", supplier_cost_source: "manual_amount", supplier_id: "supplier" };
const payment = { booking_id: "b", received: "110.38", refunded: "22.08", net_paid: "88.30", outstanding: 0, entries: 2 };
describe("booking report reconciles to Finance", () => {
  it("includes the refund and both partners instead of treating the sale as profit", () => {
    expect(bookingReports([line], [payment]).b).toEqual({ revenue: 88.30, costs: 68.48, margin: 19.82, received: 110.38, refunded: 22.08, netPaid: 88.30, outstanding: 0, paymentRecorded: true, costComplete: true });
  });
  it("does not invent a profit when supplier costs or FX are missing", () => {
    for (const pending of [{ ...line, supplier_id: null }, { ...line, supplier_cost_source: "none" }, { ...line, margin_amount: null }])
      expect(bookingReports([pending], [payment]).b).toMatchObject({ costs: null, margin: null, costComplete: false });
  });
  it("does not substitute marked-paid amounts for missing payment entries", () => {
    expect(bookingReports([line], [{ ...payment, received: 0, refunded: 0, net_paid: 0, outstanding: 110.38, entries: 0 }]).b).toMatchObject({ received: 0, netPaid: 0, outstanding: 110.38, paymentRecorded: false });
  });
  it("excludes archived/removed lines and sums multi-trip lines in integer cents", () => {
    expect(bookingReports([line, { ...line, included: false }, { ...line, outcome: "removed" }, { ...line, recognised_revenue: "0.10", margin_amount: "0.01" }], [payment]).b).toMatchObject({ revenue: 88.40, margin: 19.83, costs: 68.57 });
  });
  it("keeps excluded cancellation lines at zero instead of making the whole month pending", () => {
    expect(bookingReports([{ ...line, included: false, outcome: "cancelled" }], [payment]).b).toMatchObject({ revenue: 0, costs: 0, margin: 0, costComplete: true });
  });
  it("leaves missing finance lines pending", () => {
    expect(bookingReports([], [payment]).b.costs).toBeNull();
  });
});
