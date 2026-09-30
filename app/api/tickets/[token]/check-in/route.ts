import { NextRequest, NextResponse } from "next/server";
import { hasLivePermission } from "@/lib/admin-permission";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { loadTicket } from "@/lib/ticket-service";
import { verifyTicketToken } from "@/lib/ticket-token";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

const json = (body: unknown, status: number) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

/** Marks one trip ticket as used. Staff only; a repeat scan is a no-op, not an error. */
export async function POST(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  const { token } = await context.params;
  const verified = verifyTicketToken(token);
  if (!verified) return json({ error: "Invalid ticket." }, 404);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!(await hasLivePermission(supabase, user, "bookings"))) return json({ error: "Sign in to the admin to check guests in." }, 401);

  const database = createAdminClient();
  if (!database) return json({ error: "Database is not configured." }, 503);
  const ticket = await loadTicket(database, verified.reference, verified.tripIndex);
  if (!ticket) return json({ error: "Ticket not found." }, 404);

  const back = new URL(`/ticket/${encodeURIComponent(token)}`, request.url);
  if (ticket.bookingStatus === "cancelled") return json({ error: "This booking is cancelled." }, 409);
  if (!ticket.checkedInAt) {
    const { error } = await database.from("booking_ticket_checkins")
      .upsert({ booking_id: ticket.bookingId, trip_index: ticket.tripIndex, checked_in_by: user?.email ?? null }, { onConflict: "booking_id,trip_index", ignoreDuplicates: true });
    if (error) {
      console.error("Ticket check-in failed", { reference: ticket.reference, tripIndex: ticket.tripIndex, message: error.message });
      back.searchParams.set("checkin", "error");
      return NextResponse.redirect(back, 303);
    }
    await supabase.rpc("record_admin_audit", {
      action_name: "update", resource_name: "booking_ticket_checkin", resource_identifier: ticket.bookingId,
      summary_text: `Checked in ${ticket.reference} trip ${ticket.tripIndex + 1}`, before_value: null,
      after_value: { trip_index: ticket.tripIndex, actor: user?.email },
    });
  }
  back.searchParams.set("checkin", "done");
  return NextResponse.redirect(back, 303);
}
