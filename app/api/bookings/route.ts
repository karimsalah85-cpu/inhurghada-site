import { NextRequest, NextResponse } from "next/server";
import {
  addBooking,
  buildBookingMessage,
  buildWhatsAppLink,
  findBooking,
  findBookingByEmail,
  sendBookingEmail,
  sendWhatsAppMessage,
} from "@/lib/booking-service";
import { createClient } from "@/utils/supabase/server";
import { createInvoicePdf } from "@/lib/invoice-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference")?.trim();
  const email = searchParams.get("email")?.trim();

  if (!reference && !email) {
    return NextResponse.json({ success: false, error: "A booking reference or email is required." }, { status: 400 });
  }

  const booking = reference ? findBooking(reference) : findBookingByEmail(email || "");

  if (!booking) {
    return NextResponse.json({ success: false, error: "Booking not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true, booking });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const bookingType = body.type === "transfer" ? "transfer" : "tour";
    const customerName = String(body.customerName || "").trim();
    const phone = String(body.phone || "").trim();
    const customerEmail = String(body.customerEmail || "").trim();
    const bookingEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "info@dailyredsea.com";
    const bookingWhatsApp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "201004933150";

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
    const emailHtml = buildBookingEmailHtml({
      bookingType,
      reference,
      customerName,
      phone,
      customerEmail,
      date: body.date,
      guests: body.guests,
      hotel: body.hotel,
      tourName: body.tourName,
      message: body.message,
    });
    const confirmationPdf = await createInvoicePdf({
      reference, issuedAt: new Date(), customerName, customerEmail, customerPhone: phone,
      itemName: body.tourName || (bookingType === "transfer" ? "Private transfer" : "Daily Red Sea booking"),
      quantity: Number(body.guests || 1), amount: Number(body.amount || 0), currency: body.currency || "usd",
      paymentMethod: "Cash on arrival", date: body.date, hotel: body.hotel,
    });
    const confirmationAttachment = { filename: `daily-red-sea-booking-${reference}.pdf`, content: confirmationPdf };

    const booking = addBooking({
      reference,
      type: bookingType,
      customerName,
      phone,
      customerEmail: customerEmail || undefined,
      status: "submitted",
      createdAt: new Date().toISOString(),
      amount: Number(body.amount || 0),
      currency: body.currency || "usd",
      tourName: body.tourName,
      location: body.location,
      duration: body.duration,
      price: body.price,
      date: body.date,
      guests: body.guests,
      hotel: body.hotel,
      message: body.message,
    });

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
      const supabase = await createClient();
      const { error: bookingError } = await supabase.from("bookings").insert({
        reference, type: bookingType, customer_name: customerName, customer_email: customerEmail || null, phone,
        tour_name: body.tourName || null, date: body.date || null, guests: Number(body.guests || 0) || null,
        hotel: body.hotel || null, notes: body.message || null, amount: Number(body.amount || 0),
        currency: String(body.currency || "USD").toUpperCase(),
      });
      if (bookingError) {
        console.error("Booking database save failed", bookingError);
        return NextResponse.json({ success: false, error: "We could not save your booking. Please try again or contact us on WhatsApp." }, { status: 503 });
      }
    }

    const [whatsappResult, bookingEmailResult, customerEmailResult] = await Promise.all([
      sendWhatsAppMessage(bookingWhatsApp, message),
      sendBookingEmail(bookingEmail, `New ${bookingType} booking: ${reference}`, emailHtml, confirmationAttachment),
      customerEmail
        ? sendBookingEmail(customerEmail, `Your booking confirmation: ${reference}`, `<p>Hello ${customerName},</p><p>Your booking summary is attached. Payment is cash on arrival.</p><p>Reference: ${reference}</p>`, confirmationAttachment)
        : Promise.resolve({ success: false, reason: "no-customer-email" }),
    ]);

    return NextResponse.json({
      success: true,
      booking,
      reference,
      whatsappSent: whatsappResult.success,
      whatsappUrl: buildWhatsAppLink(bookingWhatsApp, message),
      emailSent: bookingEmailResult.success,
      customerEmailSent: customerEmailResult.success,
      paymentUrl: null,
      paymentStatus: "cash-on-arrival",
    });
  } catch (error) {
    console.error("Booking submission failed", error);
    return NextResponse.json({ success: false, error: "Booking submission failed" }, { status: 500 });
  }
}

function buildBookingEmailHtml({
  bookingType,
  reference,
  customerName,
  phone,
  customerEmail,
  date,
  guests,
  hotel,
  tourName,
  message,
}: Record<string, string | undefined>) {
  const details = [
    ["Reference", reference],
    ["Type", bookingType],
    ["Customer", customerName],
    ["WhatsApp", phone],
    ["Email", customerEmail],
    ["Tour", tourName],
    ["Date", date],
    ["Guests", guests],
    ["Pickup / hotel", hotel],
    ["Notes", message],
  ].filter(([, value]) => value);

  const rows = details
    .map(([label, value]) => `<tr><th align="left" style="padding:8px;border-bottom:1px solid #e2e8f0">${escapeHtml(label || "")}</th><td style="padding:8px;border-bottom:1px solid #e2e8f0">${escapeHtml(value || "")}</td></tr>`)
    .join("");

  return `<h2>New Daily Red Sea booking</h2><table cellpadding="0" cellspacing="0" style="border-collapse:collapse">${rows}</table>`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] || character);
}
