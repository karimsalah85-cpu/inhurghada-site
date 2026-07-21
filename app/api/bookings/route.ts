import { NextRequest, NextResponse } from "next/server";
import {
  addBooking,
  buildBookingMessage,
  createStripeCheckoutSession,
  sendBookingEmail,
  sendWhatsAppMessage,
} from "@/lib/booking-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const bookingType = body.type === "transfer" ? "transfer" : "tour";
    const customerName = String(body.customerName || "").trim();
    const phone = String(body.phone || "").trim();
    const customerEmail = String(body.customerEmail || "").trim();

    if (!customerName || !phone) {
      return NextResponse.json({ success: false, error: "A name and phone number are required." }, { status: 400 });
    }

    const reference = `${bookingType === "transfer" ? "DRS-T" : "DRS"}-${Date.now().toString().slice(-6)}`;
    const message = buildBookingMessage({
      reference,
      customerName,
      phone,
      tourName: body.tourName,
      location: body.location,
      duration: body.duration,
      price: body.price,
      date: body.date,
      guests: body.guests,
      hotel: body.hotel,
      message: body.message,
    });

    const booking = addBooking({
      reference,
      type: bookingType,
      customerName,
      phone,
      status: "submitted",
      createdAt: new Date().toISOString(),
      amount: Number(body.amount || 0),
      currency: body.currency || "usd",
    });

    const [whatsappResult, emailResult, paymentResult] = await Promise.all([
      sendWhatsAppMessage(phone, message),
      sendBookingEmail(customerEmail || process.env.CONTACT_EMAIL, `Your ${bookingType === "transfer" ? "transfer" : "tour"} request has been received`, `<p>Hello ${customerName},</p><p>Your request has been received and our team will confirm the details shortly.</p><p>Reference: ${reference}</p>`),
      createStripeCheckoutSession({
        bookingReference: reference,
        amount: Number(body.amount || 0),
        currency: body.currency || "usd",
        customerEmail: customerEmail || undefined,
        bookingType,
      }),
    ]);

    return NextResponse.json({
      success: true,
      booking,
      reference,
      whatsappSent: whatsappResult.success,
      emailSent: emailResult.success,
      paymentUrl: paymentResult.success ? paymentResult.url : null,
      paymentStatus: paymentResult.success ? "ready" : paymentResult.reason,
    });
  } catch (error) {
    console.error("Booking submission failed", error);
    return NextResponse.json({ success: false, error: "Booking submission failed" }, { status: 500 });
  }
}
