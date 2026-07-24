import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import {
  addBooking,
  buildBookingMessage,
  buildWhatsAppLink,
  findBooking,
  sendBookingEmail,
  sendWhatsAppMessage,
} from "@/lib/booking-service";
import { createClient } from "@/utils/supabase/server";
import { createInvoicePdf } from "@/lib/invoice-service";
import { rateLimit } from "@/lib/rate-limit";
import { validateBookingInput } from "@/lib/booking-validation";
import { calculateBookingPrice } from "@/lib/booking-pricing";
import { createAdminClient } from "@/utils/supabase/admin";

function bookingJson(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "private, no-store");
  return NextResponse.json(body, { ...init, headers });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference")?.trim();
  const email = searchParams.get("email")?.trim();

  if (!reference || !email) {
    return bookingJson({ success: false, error: "Your booking reference and email are required." }, { status: 400 });
  }

  const database = createAdminClient();
  if (database) {
    const { data } = await database.from("bookings").select("reference, customer_name, customer_email, phone, tour_name, date, guests, hotel, notes, amount, currency, status, created_at").eq("reference", reference).eq("customer_email", email.toLowerCase()).maybeSingle();
    if (data) return bookingJson({ success: true, booking: {
      reference: data.reference, type: "tour", customerName: data.customer_name, customerEmail: data.customer_email,
      phone: data.phone, tourName: data.tour_name, date: data.date, guests: String(data.guests || 0), hotel: data.hotel,
      message: data.notes, amount: Number(data.amount || 0), currency: data.currency, status: data.status, createdAt: data.created_at,
    } });
  }

  const booking = findBooking(reference);

  if (!booking || booking.customerEmail?.trim().toLowerCase() !== email.toLowerCase()) {
    return bookingJson({ success: false, error: "Booking not found." }, { status: 404 });
  }

  return bookingJson({ success: true, booking });
}

export async function POST(request: NextRequest) {
  try {
    const clientAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limit = rateLimit(`booking:${clientAddress}`);
    if (!limit.allowed) return bookingJson({ success: false, error: "Too many booking attempts. Please try again shortly." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });

    const origin = request.headers.get("origin");
    if (origin && new URL(origin).host !== request.nextUrl.host) {
      return bookingJson({ success: false, error: "Invalid booking origin." }, { status: 403 });
    }

    const validation = validateBookingInput(await request.json());
    if (validation.spam) return bookingJson({ success: true });
    if (!validation.data) return bookingJson({ success: false, error: validation.error }, { status: 400 });
    const body = validation.data;
    const bookingType = body.type;
    const { customerName, phone, customerEmail, hotel } = body;
    const pricing = calculateBookingPrice(body);
    if (!pricing.data) return bookingJson({ success: false, error: pricing.error }, { status: 400 });
    const { amount, guests: guestCount, guestSummary, tourName, price } = pricing.data;
    const bookingEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "info@dailyredsea.com";
    const bookingWhatsApp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "201004933150";

    const reference = `${bookingType === "transfer" ? "DRS-T" : "DRS"}-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomBytes(3).toString("hex").toUpperCase()}`;
    const message = buildBookingMessage({
      reference,
      customerName,
      phone,
      tourName,
      location: body.location,
      duration: body.duration,
      price,
      date: body.date,
      guests: guestSummary,
      hotel,
      message: body.message,
    });
    const emailHtml = buildBookingEmailHtml({
      bookingType,
      reference,
      customerName,
      phone,
      customerEmail,
      date: body.date,
      guests: guestSummary,
      hotel: body.hotel,
      tourName,
      message: body.message,
    });
    const confirmationPdf = await createInvoicePdf({
      reference, issuedAt: new Date(), customerName, customerEmail, customerPhone: phone,
      itemName: tourName,
      quantity: guestCount, travelerSummary: guestSummary, amount, currency: "usd",
      paymentMethod: "Cash on arrival", date: body.date, time: extractBookingValue(String(body.message || ""), "Time"), hotel,
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
      amount,
      currency: "usd",
      tourName,
      location: body.location,
      duration: body.duration,
      price,
      date: body.date,
      guests: guestSummary,
      hotel,
      message: body.message,
    });

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
      const supabase = await createClient();
      const { error: bookingError } = await supabase.from("bookings").insert({
        reference, type: bookingType, customer_name: customerName, customer_email: customerEmail || null, phone,
        tour_name: tourName, date: body.date || null, guests: guestCount,
        hotel: hotel || null, notes: body.message || null, amount,
        currency: "USD",
      });
      if (bookingError) {
        console.error("Booking database save failed", bookingError);
        return bookingJson({ success: false, error: "We could not save your booking. Please try again or contact us on WhatsApp." }, { status: 503 });
      }
    }

    const [whatsappResult, bookingEmailResult, customerEmailResult] = await Promise.all([
      sendWhatsAppMessage(bookingWhatsApp, message),
      sendBookingEmail(bookingEmail, `New ${bookingType} booking: ${reference}`, emailHtml, confirmationAttachment),
      customerEmail
        ? sendBookingEmail(
          customerEmail,
          body.locale === "de" ? `Deine Buchungsbestätigung: ${reference}` : `Your booking confirmation: ${reference}`,
          body.locale === "de"
            ? `<p>Hallo ${escapeHtml(customerName)},</p><p>deine Buchungsübersicht ist als PDF angehängt. Die Zahlung erfolgt bar bei Ankunft.</p><p>Buchungsnummer: ${escapeHtml(reference)}</p><p>Wir bestätigen die Abholdetails per WhatsApp.</p>`
            : `<p>Hello ${escapeHtml(customerName)},</p><p>Your booking summary is attached. Payment is cash on arrival.</p><p>Reference: ${escapeHtml(reference)}</p><p>We confirm pickup details by WhatsApp.</p>`,
          confirmationAttachment,
        )
        : Promise.resolve({ success: false, reason: "no-customer-email" }),
    ]);

    return bookingJson({
      success: true,
      booking,
      reference,
      whatsappSent: whatsappResult.success,
      whatsappUrl: buildWhatsAppLink(bookingWhatsApp, message),
      emailSent: bookingEmailResult.success,
      customerEmailSent: customerEmailResult.success,
      bookingConfirmationPdf: confirmationPdf.toString("base64"),
      paymentUrl: null,
      paymentStatus: "cash-on-arrival",
    });
  } catch (error) {
    console.error("Booking submission failed", error);
    return bookingJson({ success: false, error: "Booking submission failed" }, { status: 500 });
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

function extractBookingValue(message: string, label: string) {
  return message.split("\n").find((line) => line.startsWith(`${label}:`))?.slice(label.length + 1).trim();
}
