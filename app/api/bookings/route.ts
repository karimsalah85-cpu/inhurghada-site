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
import { bookingLocale, buildCustomerConfirmationEmail } from "@/lib/booking-communications-i18n";
import { tours } from "@/data/tours";
import { localizeTour } from "@/lib/tour-localization";

// Tour listings often use free-text time labels ("Gathering 9:15 AM...", "Time
// confirmed by WhatsApp") that Postgres's `time` column can't parse. Only pass
// through a value the DB can actually store; the full label still reaches the
// customer via the booking message/notes. Mirrors the guard already used by
// reserve_multi_trip_booking for cart items.
function parsableStartTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : null;
}

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
    const currencySymbol = currency === "EUR" ? "€" : currency === "SAR" ? "SAR " : "$";
    const locale = bookingLocale(body.locale);
    const sourceTour = body.tourSlug ? tours.find((tour) => tour.slug === body.tourSlug) : undefined;
    const localizedTour = sourceTour ? localizeTour(sourceTour, locale) : undefined;
    const localizedGuestSummary = bookingType === "tour"
      ? formatTravelerSummary(body.adults, body.youth, body.infants, locale)
      : formatPassengerSummary(body.passengers, locale);
    const pickupOrMeetingPoint = hotel || localizedTour?.departureMarina || localizedTour?.location || "";
    const localizedItemName = bookingType === "transfer"
      ? localizedTransferName(body.service, locale)
      : body.tourSlug === "multi-trip"
        ? localizedMultiTripName(locale)
        : localizedTour?.title || tourName;
    const localizedTripLines = tripItems?.map((item, index) => {
      const source = tours.find((tour) => tour.slug === body.cartItems[index]?.tourSlug);
      const title = source ? localizeTour(source, locale).title : item.tourName;
      return `${index + 1}. ${title} - ${item.date} - ${currencySymbol}${item.amount.toFixed(2)}`;
    });
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
      p_start_time: parsableStartTime(body.time),
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
    // The booking is already persisted above: a PDF failure (e.g. a font or
    // library issue) must not fail the whole request and hide a booking that
    // actually saved. Fall back to sending confirmations without the PDF.
    let confirmationPdf: Buffer | null = null;
    try {
      confirmationPdf = await createInvoicePdf({
        reference, issuedAt: new Date(), customerName, customerEmail, customerPhone: phone,
        itemName: localizedItemName,
        quantity: guestCount, travelerSummary: localizedGuestSummary, amount, currency: currency.toLowerCase(),
        paymentMethod: "Cash on arrival", date: body.date, time: body.time || extractBookingValue(String(body.message || ""), "Time"), hotel: pickupOrMeetingPoint,
        tripLines: localizedTripLines,
        locale: body.locale,
      });
    } catch (error) {
      console.error("Booking confirmation PDF generation failed", error);
    }
    const confirmationAttachment = confirmationPdf
      ? { filename: `daily-red-sea-booking-${reference}.pdf`, content: confirmationPdf }
      : undefined;

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
        ? deliverBookingNotification(supabase, bookingId, "customer_email", () => {
          const customerConfirmation = buildCustomerConfirmationEmail({
            locale, customerName, reference, itemName: localizedItemName, date: body.date,
            time: body.time || undefined, travelers: localizedGuestSummary,
            pickup: pickupOrMeetingPoint || undefined, amount, currency,
          });
          return sendBookingEmail(customerEmail, customerConfirmation.subject, customerConfirmation.html, confirmationAttachment);
        })
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
      bookingConfirmationPdf: confirmationPdf ? confirmationPdf.toString("base64") : null,
      paymentUrl: null,
      paymentStatus: "cash-on-arrival",
    });
  } catch (error) {
    console.error("Booking submission failed", error);
    return bookingJson({ success: false, error: "Booking submission failed" }, { status: 500 });
  }
}

function formatTravelerSummary(adults: number, youth: number, infants: number, locale: string) {
  const counts = { adults, youth, infants };
  const labels = {
    en: ["adult", "youth", "infant"], de: ["Erwachsene", "Kinder", "Kleinkinder"],
    ru: ["взрослых", "детей", "младенцев"], ar: ["بالغ", "طفل", "رضيع"],
    pl: ["dorosłych", "dzieci", "niemowląt"], zh: ["位成人", "位儿童", "位婴儿"],
  }[locale] ?? ["adult", "youth", "infant"];
  return (Object.values(counts) as number[])
    .map((count, index) => count > 0 ? `${count} ${labels[index]}${locale === "en" && count !== 1 && index !== 1 ? "s" : ""}` : "")
    .filter(Boolean)
    .join(" · ");
}

function formatPassengerSummary(passengers: number, locale: string) {
  const label = { en: "passenger", de: "Fahrgäste", ru: "пассажиров", ar: "مسافر", pl: "pasażerów", zh: "位乘客" }[locale] || "passenger";
  return `${passengers} ${label}${locale === "en" && passengers !== 1 ? "s" : ""}`;
}

function localizedTransferName(service: string, locale: string) {
  const airport = { en: "Hurghada Airport one-way transfer", de: "Einfacher Transfer zum Flughafen Hurghada", ru: "Трансфер в одну сторону до аэропорта Хургады", ar: "خدمة نقل باتجاه واحد من أو إلى مطار الغردقة", pl: "Transfer w jedną stronę na lotnisko w Hurghadzie", zh: "赫尔格达机场单程接送" };
  const senzo = { en: "Senzo Mall one-way transfer", de: "Einfacher Transfer zur Senzo Mall", ru: "Трансфер в одну сторону до Senzo Mall", ar: "خدمة نقل باتجاه واحد من أو إلى سنزو مول", pl: "Transfer w jedną stronę do Senzo Mall", zh: "Senzo Mall 单程接送" };
  return (service === "airport" ? airport : senzo)[locale as keyof typeof airport] || (service === "airport" ? airport.en : senzo.en);
}

function localizedMultiTripName(locale: string) {
  return { en: "Multi-trip booking", de: "Buchung mehrerer Ausflüge", ru: "Бронирование нескольких экскурсий", ar: "حجز رحلات متعددة", pl: "Rezerwacja wielu wycieczek", zh: "多行程预订" }[locale] || "Multi-trip booking";
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
