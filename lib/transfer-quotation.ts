import { pricingLine, roundMoney, type BookingPricingSnapshot } from "@/lib/booking-pricing-snapshot";
import { buildWhatsAppLink } from "@/lib/booking-service";
import { whatsappNumber } from "@/lib/contact";
import { emailDetails, emailIntro, emailPanel, emailParagraph, emailRow, emailSignoff, emailTheme, emailWhatsappLabel, renderEmail } from "@/lib/email/layout";

// Transfers the website cannot price itself (large groups, special luggage, unmapped hotels)
// are saved as a quote request: amount 0 and a pricing snapshot marked `pending`. Staff set
// the price here, which turns the request into a priced booking, and send the customer a
// quotation to accept by replying or on WhatsApp.

export const MAX_QUOTE = 100_000;

export type QuotableBooking = {
  type?: string | null;
  status?: string | null;
  payment_status?: string | null;
  amount?: number | string | null;
  currency?: string | null;
  discount_amount?: number | string | null;
  referral_discount_amount?: number | string | null;
  pricing_snapshot?: unknown;
  transfer_details?: unknown;
};

export function isPendingQuote(booking: QuotableBooking) {
  const snapshot = booking.pricing_snapshot as { pending?: unknown } | null | undefined;
  return booking.type === "transfer" && (snapshot?.pending === true || Number(booking.amount || 0) === 0);
}

/** Why staff cannot (re)quote this booking, or null when they can. */
export function quoteBlocker(booking: QuotableBooking): string | null {
  if (booking.type !== "transfer") return "Quotations are for transfer bookings.";
  if (booking.status === "cancelled") return "This booking is cancelled.";
  if (booking.status === "completed") return "This booking is already completed.";
  if (booking.payment_status === "paid" || booking.payment_status === "refunded") return "This booking already has a payment recorded, so its price can no longer be quoted.";
  if (Number(booking.discount_amount || 0) > 0 || Number(booking.referral_discount_amount || 0) > 0) return "This booking has a discount applied. Adjust the price with the team before quoting.";
  return null;
}

export function parseQuotePrice(value: unknown): { ok: true; price: number } | { ok: false; error: string } {
  const price = typeof value === "string" && value.trim() === "" ? NaN : Number(value);
  if (!Number.isFinite(price) || price <= 0 || price > MAX_QUOTE) return { ok: false, error: "Enter the transfer price, more than 0." };
  return { ok: true, price: roundMoney(price) };
}

/** The pricing snapshot after quoting: no longer pending, one line for the quoted fare. */
export function quotedSnapshot(snapshot: unknown, price: number, currency: string, fallbackName: string): BookingPricingSnapshot {
  const previous = (snapshot && typeof snapshot === "object" ? snapshot : {}) as Partial<BookingPricingSnapshot>;
  const trip = previous.trips?.[0];
  return {
    version: 1,
    currency: currency.toUpperCase(),
    subtotal: price,
    pending: false,
    trips: [{
      name: trip?.name || fallbackName,
      guests: trip?.guests && trip.guests > 0 ? trip.guests : 1,
      participants: trip?.participants ?? null,
      lines: [pricingLine("booking", 1, price, "Private transfer — quoted fare")],
      ...(trip?.date ? { date: trip.date } : {}),
      ...(trip?.time ? { time: trip.time } : {}),
    }],
  };
}

/** Keeps the dispatch record's fare in step with the quoted price. */
export function quotedTransferDetails(details: unknown, price: number, quotedBy: string | null | undefined) {
  if (!details || typeof details !== "object") return details ?? null;
  const record = details as Record<string, unknown>;
  const fare = (record.fare && typeof record.fare === "object" ? record.fare : {}) as Record<string, unknown>;
  return { ...record, fare: { ...fare, total: price, persisted_amount: price, quoted: true, quoted_at: new Date().toISOString(), quoted_by: quotedBy || null } };
}

export type QuotationInput = {
  reference: string;
  customer_name: string;
  tour_name: string | null;
  date: string | null;
  start_time?: string | null;
  guests?: number | null;
  hotel?: string | null;
  price: number;
  currency: string;
  message?: string | null;
};

const formatMoney = (price: number, currency: string) => new Intl.NumberFormat("en", { style: "currency", currency }).format(price);

export function buildQuotationEmail(input: QuotationInput) {
  const theme = emailTheme("en");
  const total = formatMoney(input.price, input.currency);
  const accept = buildWhatsAppLink(whatsappNumber, `Hello Daily Red Sea, I accept the transfer quotation ${input.reference} for ${total}.`);
  const details = [
    { label: "Booking reference", value: input.reference, ltr: true },
    { label: "Transfer", value: input.tour_name || "Private transfer" },
    { label: "Date", value: [input.date || "To be confirmed", input.start_time ? String(input.start_time).slice(0, 5) : ""].filter(Boolean).join(" · ") },
    ...(input.guests ? [{ label: "Passengers", value: String(input.guests) }] : []),
    ...(input.hotel ? [{ label: "Pickup", value: input.hotel }] : []),
  ];
  const html = renderEmail(theme, {
    title: "Your transfer quotation",
    preheader: `Transfer quotation ${input.reference}: ${total}`,
    mastheadNote: { text: input.reference, ltr: true },
    rows: [
      emailIntro(theme, {
        eyebrow: "Quotation",
        headline: "Your transfer quotation",
        body: [
          emailParagraph(theme, `Hello ${input.customer_name},`, { strong: true }),
          emailParagraph(theme, `Thank you for your transfer request. The price for your private transfer is ${total} in total, for the vehicle — not per person.`),
          ...(input.message?.trim() ? [emailParagraph(theme, input.message.trim())] : []),
          emailParagraph(theme, "To confirm, reply to this email or send us a WhatsApp message. Your transfer is booked once our team confirms it. Unless agreed otherwise, payment is due in cash to the driver.", { last: true }),
        ],
      }),
      emailRow(emailDetails(theme, details, { label: "Quoted price", value: total }), "0 42px 30px"),
      emailRow(emailPanel(theme, { lead: "Accept this quotation or ask a question on WhatsApp.", button: { label: emailWhatsappLabel("en"), href: accept } }), "0 42px 30px"),
    ],
    signoff: emailSignoff("en"),
  });
  return { subject: `Transfer quotation ${input.reference}: ${total}`, html };
}

/** Message staff can send from their own WhatsApp to the customer's number. */
export function quotationWhatsAppText(input: QuotationInput) {
  const total = formatMoney(input.price, input.currency);
  return [
    `Hello ${input.customer_name}, thank you for your transfer request with Daily Red Sea.`,
    `${input.tour_name || "Private transfer"}${input.date ? ` on ${input.date}${input.start_time ? ` at ${String(input.start_time).slice(0, 5)}` : ""}` : ""}.`,
    `Price: ${total} in total for the private vehicle (not per person).`,
    ...(input.message?.trim() ? [input.message.trim()] : []),
    `Reference: ${input.reference}. Reply here to confirm and we will book it for you.`,
  ].join("\n");
}

export function customerWhatsAppLink(phone: string | null | undefined, text: string) {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits.length >= 8 ? buildWhatsAppLink(digits, text) : null;
}
