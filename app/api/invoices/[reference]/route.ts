import { NextRequest, NextResponse } from "next/server";
import { getStripeCheckoutSession } from "@/lib/booking-service";
import { createInvoicePdf } from "@/lib/invoice-service";

export const runtime = "nodejs";

export async function GET(request: NextRequest, context: { params: Promise<{ reference: string }> }) {
  const { reference } = await context.params;
  const sessionId = request.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "A Stripe checkout session is required." }, { status: 400 });
  }

  const result = await getStripeCheckoutSession(sessionId);

  if (!result.success) {
    return NextResponse.json({ error: "We could not verify this payment." }, { status: 404 });
  }

  const session = result.session;

  if (session.payment_status !== "paid" || session.metadata?.bookingReference !== reference) {
    return NextResponse.json({ error: "This invoice is not available." }, { status: 403 });
  }

  const lineItem = session.line_items?.data?.[0];
  const amount = Number(session.amount_total || 0) / 100;
  const pdf = await createInvoicePdf({
    reference,
    issuedAt: new Date((session.created || Math.floor(Date.now() / 1000)) * 1000),
    customerName: session.customer_details?.name || session.metadata?.customerName || "Guest",
    customerEmail: session.customer_details?.email || session.customer_email || undefined,
    customerPhone: session.customer_details?.phone || session.metadata?.customerPhone || undefined,
    itemName: lineItem?.description || session.metadata?.tourName || "Daily Red Sea booking",
    quantity: Number(lineItem?.quantity || 1),
    amount,
    currency: session.currency || "usd",
    paymentMethod: session.payment_method_types?.[0]?.replace(/_/g, " ").toUpperCase() || "Stripe",
    paymentId: session.payment_intent?.id || session.payment_intent || undefined,
    date: session.metadata?.bookingDate || undefined,
    hotel: session.metadata?.hotel || undefined,
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="daily-red-sea-invoice-${reference}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
