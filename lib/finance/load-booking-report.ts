import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { bookingReports, type BookingReportLine, type BookingReportPayment } from "./booking-report";

/** Page all results; never substitute zero for a failed finance query. Uses caller's RLS. */
export async function loadBookingReports(client: SupabaseClient, ids: string[]) {
  const lines: BookingReportLine[] = [];
  const payments: BookingReportPayment[] = [];
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await client.from("booking_financial_lines")
        .select("booking_id,included,outcome,recognised_revenue,margin_amount,supplier_id,supplier_cost_source")
        .in("booking_id", chunk).order("id").range(offset, offset + 499);
      if (error) throw new Error(error.message);
      lines.push(...(data || []));
      if (!data || data.length < 500) break;
    }
    const { data, error } = await client.from("booking_payment_summary")
      .select("booking_id,received,refunded,net_paid,outstanding,entries").in("booking_id", chunk);
    if (error) throw new Error(error.message);
    payments.push(...(data || []));
  }
  return bookingReports(lines, payments);
}
