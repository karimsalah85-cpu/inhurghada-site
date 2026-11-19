import { NextRequest, NextResponse } from "next/server";
import { getAdminAuthorization } from "@/lib/admin-permission";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { sendBookingEmail } from "@/lib/booking-service";
import { buildQuotationEmail, customerWhatsAppLink, parseQuotePrice, quoteBlocker, quotedSnapshot, quotedTransferDetails, quotationWhatsAppText } from "@/lib/transfer-quotation";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

/** Staff set the price of a transfer quote request and send the customer the quotation. */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  if (process.env.VERCEL_ENV === "preview") return json({ error: "Administration changes are disabled in this preview until an isolated test database is configured." }, 503);
  const { id } = await context.params;
  if (!uuidPattern.test(id)) return json({ error: "Invalid booking identifier." }, 400);
  const { supabase, user, allowed } = await getAdminAuthorization("edit_bookings");
  if (!allowed) return json({ error: "Booking-editing permission required." }, 403);

  const body = await request.json().catch(() => null) as { price?: unknown; message?: unknown; sendEmail?: unknown } | null;
  const parsed = parseQuotePrice(body?.price);
  if (!parsed.ok) return json({ error: parsed.error }, 400);
  const message = typeof body?.message === "string" ? body.message.trim().slice(0, 1000) : "";
  const sendEmail = body?.sendEmail !== false;

  const { data: before, error: readError } = await supabase.from("bookings").select("*").eq("id", id).single();
  if (readError || !before) return json({ error: "Booking not found." }, 404);
  const blocker = quoteBlocker(before);
  if (blocker) return json({ error: blocker }, 409);

  const currency = String(before.currency || "USD").toUpperCase();
  const update = {
    amount: parsed.price,
    subtotal: parsed.price,
    pricing_snapshot: quotedSnapshot(before.pricing_snapshot, parsed.price, currency, before.tour_name || "Private transfer"),
    transfer_details: quotedTransferDetails(before.transfer_details, parsed.price, user?.email),
  };
  const { data: booking, error } = await supabase.from("bookings").update(update).eq("id", id).select().single();
  if (error || !booking) return json({ error: "Could not save the quoted price." }, 500);
  await supabase.rpc("record_admin_audit", { action_name: "update", resource_name: "booking", resource_identifier: id, summary_text: `Quoted transfer ${booking.reference} at ${parsed.price} ${currency}`, before_value: { amount: before.amount, pricing_snapshot: before.pricing_snapshot }, after_value: { amount: booking.amount, actor: user?.email } });

  const quote = { reference: booking.reference, customer_name: booking.customer_name, tour_name: booking.tour_name, date: booking.date, start_time: booking.start_time, guests: booking.guests, hotel: booking.hotel, price: parsed.price, currency, message };
  const whatsappLink = customerWhatsAppLink(booking.phone, quotationWhatsAppText(quote));
  let email: { attempted: boolean; sent: boolean; recipient?: string; reason?: string } = { attempted: false, sent: false };
  if (sendEmail && booking.customer_email) {
    const content = buildQuotationEmail(quote);
    const result = await sendBookingEmail(booking.customer_email, content.subject, content.html);
    email = { attempted: true, sent: result.success, recipient: booking.customer_email, ...(!result.success && "reason" in result ? { reason: String(result.reason) } : {}) };
    if (!result.success) console.error("Transfer quotation email failed", { reference: booking.reference, reason: email.reason });
  }
  return json({ booking, email, whatsappLink });
}
