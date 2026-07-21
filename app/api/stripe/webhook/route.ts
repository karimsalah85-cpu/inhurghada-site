import { NextRequest, NextResponse } from "next/server";
import { markBookingStatus, verifyStripeSignature } from "@/lib/booking-service";

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json({ received: true, skipped: true, reason: "missing-webhook-secret" });
  }

  if (!verifyStripeSignature(payload, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const event = JSON.parse(payload);

    if (event.type === "checkout.session.completed") {
      const bookingReference = event.data?.object?.metadata?.bookingReference;
      if (bookingReference) {
        markBookingStatus(bookingReference, "paid");
      }
    }

    return NextResponse.json({ received: true, event: event.type });
  } catch (error) {
    console.error("Stripe webhook failed", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
