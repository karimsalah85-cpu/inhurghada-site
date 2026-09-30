import { NextRequest, NextResponse } from "next/server";
import { hasLivePermission } from "@/lib/admin-permission";
import { findGuideByCookie, findGuideByPin, guideCookieMaxAge, guideCookieName, guideCookieValue, normalizePin } from "@/lib/guide-checkin";
import { rateLimitShared } from "@/lib/rate-limit";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { loadTicket } from "@/lib/ticket-service";
import { verifyTicketToken } from "@/lib/ticket-token";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

const json = (body: unknown, status: number) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

/**
 * Marks one trip ticket as used. Allowed for signed-in admin staff, or for an
 * external guide/driver identified by their check-in PIN (first time) or the
 * remembered-phone cookie that PIN sets. A repeat scan is a no-op, not an error.
 */
export async function POST(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  const { token } = await context.params;
  const verified = verifyTicketToken(token);
  if (!verified) return json({ error: "Invalid ticket." }, 404);
  const database = createAdminClient();
  if (!database) return json({ error: "Database is not configured." }, 503);
  const back = new URL(`/ticket/${encodeURIComponent(token)}`, request.url);
  const redirect = (state: string) => { back.searchParams.set("checkin", state); return NextResponse.redirect(back, 303); };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let actor: string | null = null;
  let rememberCookie: string | null = null;
  if (user && (await hasLivePermission(supabase, user, "bookings"))) actor = user.email ?? "Admin";
  if (!actor) {
    const guide = await findGuideByCookie(database, request.cookies.get(guideCookieName)?.value);
    if (guide) actor = guide.name;
  }
  if (!actor) {
    const form = await request.formData().catch(() => null);
    const pin = normalizePin(form?.get("pin"));
    if (!pin) return redirect("pin");
    const clientAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limit = await rateLimitShared(`ticket-pin:${clientAddress}`, 8, 15 * 60 * 1000);
    if (!limit.allowed) return redirect("locked");
    const match = await findGuideByPin(database, pin);
    if (!match) return redirect("badpin");
    actor = match.guide.name;
    rememberCookie = guideCookieValue(match.guide.id, match.pinHash);
  }

  const ticket = await loadTicket(database, verified.reference, verified.tripIndex);
  if (!ticket) return json({ error: "Ticket not found." }, 404);
  let state = "done";
  if (ticket.bookingStatus === "cancelled") state = "cancelled";
  else if (!ticket.checkedInAt) {
    const { error } = await database.from("booking_ticket_checkins")
      .upsert({ booking_id: ticket.bookingId, trip_index: ticket.tripIndex, checked_in_by: actor.slice(0, 320) }, { onConflict: "booking_id,trip_index", ignoreDuplicates: true });
    if (error) {
      console.error("Ticket check-in failed", { reference: ticket.reference, tripIndex: ticket.tripIndex, message: error.message });
      state = "error";
    }
  }
  const response = redirect(state);
  if (rememberCookie) response.cookies.set(guideCookieName, rememberCookie, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: guideCookieMaxAge });
  return response;
}
