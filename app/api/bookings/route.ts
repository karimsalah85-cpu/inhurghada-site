import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  addBooking,
  buildBookingMessage,
  buildWhatsAppLink,
  findBooking,
  sendBookingEmail,
  sendWhatsAppMessage,
} from "@/lib/booking-service";
import { createInvoicePdf } from "@/lib/invoice-service";
import { rateLimit } from "@/lib/rate-limit";
import { validateBookingInput } from "@/lib/booking-validation";
import { calculateBookingPrice } from "@/lib/booking-pricing";
import { createAdminClient } from "@/utils/supabase/admin";
import { whatsappNumber } from "@/lib/contact";
import { createRequiredAdminClient } from "@/utils/supabase/admin";
import { getCustomerVisibleAssignment } from "@/lib/booking-assignment";
import { bookingRequestHash } from "@/lib/booking-idempotency";

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
    const { data } = await database.from("bookings").select("id, reference, customer_name, customer_email, phone, tour_name, date, guests, hotel, notes, amount, currency, status, created_at").eq("reference", reference).eq("customer_email", email.toLowerCase()).maybeSingle();
    if (data) {
      const assignment = await getCustomerVisibleAssignment(database, data.id);
      return bookingJson({ success: true, booking: {
      reference: data.reference, type: "tour", customerName: data.customer_name, customerEmail: data.customer_email,
      phone: data.phone, tourName: data.tour_name, date: data.date, guests: String(data.guests || 0), hotel: data.hotel,
      message: data.notes, amount: Number(data.amount || 0), currency: data.currency, status: data.status, createdAt: data.created_at, ...assignment,
    } });
    }
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
    const { amount: calculatedAmount, guests: guestCount, guestSummary, tourName, price, currency } = pricing.data;
    const tripItems = "items" in pricing.data ? pricing.data.items : undefined;
    const currencySymbol = currency === "EUR" ? "€" : "$";
    const tripSummary = tripItems?.map((item, index) => `${index + 1}. ${item.tourName}\nDate: ${item.date}\nTime: ${item.time}\nTravelers: ${item.guestSummary}\nTrip total: ${currencySymbol}${item.amount.toFixed(2)}`).join("\n\n");
    const bookingNotes = [tripSummary, body.message ? `Customer note: ${body.message}` : ""].filter(Boolean).join("\n\n");
    const bookingEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "info@dailyredsea.com";
    const bookingWhatsApp = whatsappNumber;

    const proposedReference = `${bookingType === "transfer" ? "DRS-T" : "DRS"}-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomBytes(3).toString("hex").toUpperCase()}`;
    const supabase = createRequiredAdminClient();
    const { idempotencyKey, ...materialRequest } = body;
    const requestHash = bookingRequestHash(materialRequest);
    const { data: reservation, error: bookingError } = await supabase.rpc("reserve_booking_idempotent", {
      p_idempotency_key: idempotencyKey,
      p_request_hash: requestHash,
      p_reference: proposedReference,
      p_type: bookingType,
      p_customer_name: customerName,
      p_customer_email: customerEmail,
      p_phone: phone,
      p_tour_name: tourName,
      p_tour_slug: body.tourSlug || (bookingType === "transfer" ? body.service : ""),
      p_date: body.date,
      p_start_time: body.time || null,
      p_guests: guestCount,
      p_adults: bookingType === "tour" ? body.adults : 0,
      p_youth: bookingType === "tour" ? body.youth : 0,
      p_infants: bookingType === "tour" ? body.infants : 0,
      p_hotel: hotel,
      p_notes: bookingNotes || null,
      p_amount: calculatedAmount,
      p_currency: currency,
      p_locale: body.locale,
      p_items: body.tourSlug === "multi-trip" ? body.cartItems.map((item) => ({ tour_slug: item.tourSlug, date: item.date, time: item.time, places: item.adults + item.youth + item.infants })) : null,
    });
    if (bookingError) {
      console.error("Booking database save failed", bookingError);
      const conflictMessage = /different booking details/i.test(bookingError.message || "") ? bookingError.message : null;
      const capacityMessage = /sold out|places remain|capacity|unavailable/i.test(bookingError.message || "") ? bookingError.message : null;
      return bookingJson({ success: false, error: conflictMessage || capacityMessage || "We could not save your booking. Please try again or contact us on WhatsApp." }, { status: conflictMessage ? 409 : capacityMessage ? 409 : 503 });
    }
    const persisted = reservation as { booking?: { id?: string; reference?: string; amount?: number | string }; replayed?: boolean } | null;
    const bookingId = persisted?.booking?.id;
    const reference = persisted?.booking?.reference;
    if (!bookingId || !reference) return bookingJson({ success: false, error: "We could not confirm the saved booking." }, { status: 503 });
    const amount = Number(persisted.booking?.amount ?? calculatedAmount);
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
      message: bookingNotes,
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
      message: bookingNotes,
    });
    const confirmationPdf = await createInvoicePdf({
      reference, issuedAt: new Date(), customerName, customerEmail, customerPhone: phone,
      itemName: tourName,
      quantity: guestCount, travelerSummary: guestSummary, amount, currency: currency.toLowerCase(),
      paymentMethod: "Cash on arrival", date: body.date, time: body.time || extractBookingValue(String(body.message || ""), "Time"), hotel,
      tripLines: tripItems?.map((item, index) => `${index + 1}. ${item.tourName} - ${item.date} - ${currencySymbol}${item.amount.toFixed(2)}`),
    });
    const confirmationAttachment = { filename: `daily-red-sea-booking-${reference}.pdf`, content: confirmationPdf };

    const booking = findBooking(reference) || addBooking({
      reference,
      type: bookingType,
      customerName,
      phone,
      customerEmail: customerEmail || undefined,
      status: "submitted",
      createdAt: new Date().toISOString(),
      amount,
      currency: currency.toLowerCase(),
      tourName,
      location: body.location,
      duration: body.duration,
      price,
      date: body.date,
      guests: guestSummary,
      hotel,
      message: bookingNotes,
    });

    const [whatsappResult, bookingEmailResult, customerEmailResult] = await Promise.all([
      deliverBookingNotification(supabase, bookingId, "operator_whatsapp", () => sendWhatsAppMessage(bookingWhatsApp, message)),
      deliverBookingNotification(supabase, bookingId, "operator_email", () => sendBookingEmail(bookingEmail, `New ${bookingType} booking: ${reference}`, emailHtml, confirmationAttachment)),
      customerEmail
        ? deliverBookingNotification(supabase, bookingId, "customer_email", () => sendBookingEmail(
          customerEmail,
          body.locale === "de" ? `Deine Buchungsbestätigung: ${reference}` : body.locale === "ru" ? `Подтверждение бронирования: ${reference}` : body.locale === "ar" ? `تأكيد الحجز: ${reference}` : `Your booking confirmation: ${reference}`,
          body.locale === "de"
            ? `<p>Hallo ${escapeHtml(customerName)},</p><p>deine Buchungsübersicht ist als PDF angehängt. Die Zahlung erfolgt bar bei Ankunft.</p><p>Buchungsnummer: ${escapeHtml(reference)}</p><p>Wir bestätigen die Abholdetails per WhatsApp.</p>`
            : body.locale === "ru"
              ? `<p>Здравствуйте, ${escapeHtml(customerName)}!</p><p>К письму приложена сводка вашего бронирования в формате PDF. Оплата производится наличными по прибытии.</p><p>Номер бронирования: ${escapeHtml(reference)}</p><p>Детали трансфера мы подтвердим в WhatsApp.</p>`
            : body.locale === "ar"
              ? `<p>مرحباً ${escapeHtml(customerName)}،</p><p>ملخص حجزك مرفق بصيغة PDF. يتم الدفع نقداً عند الوصول.</p><p>رقم الحجز: ${escapeHtml(reference)}</p><p>سنؤكد تفاصيل الاستلام عبر واتساب.</p>`
            : `<p>Hello ${escapeHtml(customerName)},</p><p>Your booking summary is attached. Payment is cash on arrival.</p><p>Reference: ${escapeHtml(reference)}</p><p>We confirm pickup details by WhatsApp.</p>`,
          confirmationAttachment,
        ))
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

async function deliverBookingNotification(
  database: SupabaseClient,
  bookingId: string,
  kind: "operator_whatsapp" | "operator_email" | "customer_email",
  deliver: () => Promise<{ success: boolean; reason?: string }>,
) {
  const { data: claimed, error: claimError } = await database.rpc("claim_booking_notification", {
    p_booking_id: bookingId,
    p_notification_kind: kind,
  });
  if (claimError) {
    console.error("Booking notification claim failed", { kind, message: claimError.message });
    return { success: false, reason: "claim-failed" };
  }
  if (!claimed) return { success: true, reason: "already-claimed-or-sent" };

  let result: { success: boolean; reason?: string };
  try {
    result = await deliver();
  } catch (error) {
    result = { success: false, reason: error instanceof Error ? error.message : "Delivery failed." };
  }
  const { error: finishError } = await database.rpc("finish_booking_notification", {
    p_booking_id: bookingId,
    p_notification_kind: kind,
    p_success: result.success,
    p_error: result.reason || null,
  });
  if (finishError) console.error("Booking notification completion failed", { kind, message: finishError.message });
  return result;
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
