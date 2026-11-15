import { fromMinor, toMinor } from "./money";

export type BookingReportLine = {
  booking_id: string; included: boolean; outcome: string; recognised_revenue: string | number;
  margin_amount: string | number | null; supplier_cost_source: string; supplier_id: string | null;
};
export type BookingReportPayment = {
  booking_id: string; received: string | number; refunded: string | number; net_paid: string | number;
  outstanding: string | number; entries: number;
};
export type BookingReport = {
  revenue: number | null; costs: number | null; margin: number | null; received: number; refunded: number;
  netPaid: number; outstanding: number; paymentRecorded: boolean; costComplete: boolean;
};
const number = (value: bigint) => Number(fromMinor(value));
/** Booking-currency finance amounts. Margin is before VAT and company overhead. */
export function bookingReports(lines: BookingReportLine[], payments: BookingReportPayment[]): Record<string, BookingReport> {
  const result: Record<string, BookingReport> = {};
  for (const p of payments) {
    const bookingLines = lines.filter(l => l.booking_id === p.booking_id && l.included && l.outcome !== "removed");
    const costComplete = lines.some(l => l.booking_id === p.booking_id) && bookingLines.every(l => l.margin_amount != null &&
      (l.outcome === "cancelled" || (l.supplier_id != null && l.supplier_cost_source !== "none")));
    const revenue = bookingLines.reduce((sum, l) => sum + toMinor(l.recognised_revenue), 0n);
    const margin = bookingLines.reduce((sum, l) => sum + toMinor(l.margin_amount ?? 0), 0n);
    result[p.booking_id] = {
      revenue: lines.some(l => l.booking_id === p.booking_id) ? number(revenue) : null, costs: costComplete ? number(revenue - margin) : null,
      margin: costComplete ? number(margin) : null, costComplete,
      received: Number(p.received), refunded: Number(p.refunded), netPaid: Number(p.net_paid),
      outstanding: Number(p.outstanding), paymentRecorded: p.entries > 0,
    };
  }
  return result;
}
