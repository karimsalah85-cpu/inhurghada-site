import { getPostTripContext } from "@/lib/post-trip-context";
import { createPostTripPdf } from "@/lib/post-trip-pdf";
import { buildReferralMessage } from "@/lib/referral-messages";
import { buildWhatsAppLink, companyStatement, sendBookingEmail } from "@/lib/booking-service";
import { whatsappNumber } from "@/lib/contact";
import type { Locale } from "@/lib/i18n";
import { emailCard, emailCardTitle, emailDetails, emailIntro, emailPanel, emailParagraph, emailRow, emailSignoff, emailTheme, emailWhatsappLabel, renderEmail } from "@/lib/email/layout";
import { createBookingStatusPdf, statusPdfCopy } from "@/lib/invoice-service";
import { bookingLocale } from "@/lib/booking-communications-i18n";

export type StatusBooking = {
  reference: string;
  customer_name: string;
  customer_email: string | null;
  phone?: string | null;
  tour_name: string | null;
  tour_slug?: string | null;
  date: string | null;
  guests?: number | null;
  adults?: number | null;
  youth?: number | null;
  infants?: number | null;
  subtotal?: number | string | null;
  discount_amount?: number | string | null;
  promo_code?: string | null;
  pricing_snapshot?: unknown;
  notes?: string | null;
  hotel?: string | null;
  status?: string;
  payment_status?: string;
  amount?: number | string;
  currency?: string;
  assignedPersonName?: string;
  assignedPersonRole?: "guide" | "driver";
  locale?: string | null;
  /** Set when staff moved the booking: the email then leads with the old and new date. */
  dateChange?: { from: string | null; to: string; tripName?: string | null } | null;
};

const statusCopy: Record<string, { label: string; message: string }> = {
  new: { label: "Received", message: "We have received your booking request and our team is reviewing the details." },
  confirmed: { label: "Confirmed", message: "Your booking is confirmed. We will share or reconfirm the exact pickup details before your trip." },
  completed: { label: "Completed", message: "Your booking has been marked as completed. Thank you for choosing Daily Red Sea." },
  cancelled: { label: "Cancelled", message: "Your booking has been cancelled. Please reply to this email or contact us on WhatsApp if you need help." },
};

const paymentCopy: Record<string, { label: string; message: string }> = {
  unpaid: { label: "Unpaid", message: "Your payment is currently marked as unpaid. Unless agreed otherwise, payment is due in cash on arrival." },
  paid: { label: "Paid", message: "Your payment has been recorded as paid. Thank you." },
  refunded: { label: "Refunded", message: "Your payment is marked as refunded. Bank or card processing times may apply where relevant." },
};

/**
 * Lays a status message out like the booking-confirmation email: reference in
 * the masthead, large headline, the details as hairline rows with the total
 * set large, then the dark support panel with the WhatsApp button.
 */
function renderStatusEmail(input: { locale: Locale; reference: string; eyebrow: string; headline: string; greeting: string; notice?: { label: string; text: string } | null; messages: string[]; details: string[][]; total?: string[] | null; help: string }) {
  const theme = emailTheme(input.locale);
  return renderEmail(theme, {
    title: input.headline,
    preheader: `${input.eyebrow} · ${input.reference}`,
    mastheadNote: { text: input.reference, ltr: true },
    rows: [
      emailIntro(theme, {
        eyebrow: input.eyebrow,
        headline: input.headline,
        body: [
          emailParagraph(theme, input.greeting, { strong: true }),
          ...(input.notice ? [emailCard(theme, emailCardTitle(theme, input.notice.label, input.notice.text), "0 0 16px")] : []),
          ...input.messages.map((message, index) => emailParagraph(theme, message, { last: index === input.messages.length - 1 })),
        ],
      }),
      emailRow(emailDetails(theme, input.details.map(([label, value], index) => ({ label, value, ltr: index === 0 })), input.total ? { label: input.total[0], value: input.total[1] } : undefined), "0 42px 30px"),
      emailRow(emailPanel(theme, { lead: input.help, button: { label: emailWhatsappLabel(input.locale), href: buildWhatsAppLink(whatsappNumber, `Daily Red Sea booking ${input.reference}`) } }), "0 42px 30px"),
    ],
    signoff: emailSignoff(input.locale),
  });
}

export async function sendBookingStatusNotification(booking: StatusBooking, status: string) {
  if (!booking.customer_email) return { success: false, reason: "missing-recipient" };
  const copy = statusCopy[status];
  if (!copy) return { success: false, reason: "invalid-status" };
  const labels = localizedStatusLabels.en;
  const html = renderStatusEmail({
    locale: "en",
    reference: booking.reference,
    eyebrow: copy.label,
    headline: statusPdfCopy.en.statusUpdate,
    greeting: `${labels.hello} ${booking.customer_name},`,
    messages: [copy.message],
    details: [
      ["Booking reference", booking.reference],
      ["Experience", booking.tour_name || "Transfer"],
      ["Date", booking.date || "To be confirmed"],
      ["New status", copy.label],
    ],
    help: labels.help,
  });
  return sendBookingEmail(booking.customer_email, `Booking ${booking.reference}: ${copy.label}`, html);
}

export function buildBookingAndPaymentStatusEmail(booking: StatusBooking) {
  const bookingStatus = statusCopy[booking.status || ""];
  const paymentStatus = paymentCopy[booking.payment_status || ""];
  if (!bookingStatus || !paymentStatus) return null;
  const locale = bookingLocale(booking.locale);
  const labels = localizedStatusLabels[locale];
  // The voucher PDF already has these headings and status names in all six languages.
  const pdfCopy = statusPdfCopy[locale];
  const amount = booking.amount == null
    ? null
    : new Intl.NumberFormat(locale, { style: "currency", currency: booking.currency || "USD" }).format(Number(booking.amount));
  const details = [
    [labels.reference, booking.reference],
    [labels.experience, booking.tour_name || labels.transfer],
    [labels.date, booking.date || labels.pending],
    [labels.bookingStatus, bookingStatus.label],
    [labels.paymentStatus, paymentStatus.label],
    ...(booking.assignedPersonName ? [[`Assigned ${booking.assignedPersonRole || "guide/driver"}`, booking.assignedPersonName]] : []),
  ];
  const total = amount ? [labels.total, amount] : null;
  const change = booking.dateChange;
  const changeNotice = change
    ? `${change.tripName ? `${change.tripName}: ` : ""}${change.from ? labels.dateChangedFromTo(change.from, change.to) : labels.dateChangedTo(change.to)}`
    : null;
  return {
    subject: `${labels.subject} ${booking.reference}: ${change ? `${labels.dateChanged} · ` : ""}${bookingStatus.label} · ${labels.payment} ${paymentStatus.label}`,
    html: renderStatusEmail({
      locale,
      reference: booking.reference,
      eyebrow: `${pdfCopy.statusLabel[booking.status || ""] || bookingStatus.label} · ${pdfCopy.paymentLabel[booking.payment_status || ""] || paymentStatus.label}`,
      headline: pdfCopy.statusUpdate,
      greeting: `${labels.hello} ${booking.customer_name},`,
      notice: changeNotice ? { label: labels.dateChanged, text: changeNotice } : null,
      messages: [bookingStatus.message, paymentStatus.message],
      details,
      total,
      help: labels.help,
    }),
    text: [
      `${labels.hello} ${booking.customer_name},`,
      "",
      ...(changeNotice ? [changeNotice, ""] : []),
      bookingStatus.message,
      paymentStatus.message,
      "",
      ...[...details, ...(total ? [total] : [])].map(([label, value]) => `${label}: ${value}`),
      "",
      labels.help,
      "",
      "About Daily Red Sea",
      companyStatement,
    ].join("\n"),
  };
}

const localizedStatusLabels = {
  en: { subject: "Booking", payment: "Payment", hello: "Hello", reference: "Booking reference", experience: "Experience", transfer: "Transfer", date: "Date", pending: "To be confirmed", bookingStatus: "Booking status", paymentStatus: "Payment status", total: "Booking total", help: "If you have any questions, reply to this email or contact Daily Red Sea on WhatsApp.", dateChanged: "New date", dateChangedFromTo: (from: string, to: string) => `Your booking date has changed from ${from} to ${to}.`, dateChangedTo: (to: string) => `Your booking date is now ${to}.` },
  de: { subject: "Buchung", payment: "Zahlung", hello: "Hallo", reference: "Buchungsnummer", experience: "Erlebnis", transfer: "Transfer", date: "Datum", pending: "Wird noch bestätigt", bookingStatus: "Buchungsstatus", paymentStatus: "Zahlungsstatus", total: "Gesamtbetrag", help: "Bei Fragen antworte auf diese E-Mail oder kontaktiere Daily Red Sea über WhatsApp.", dateChanged: "Neues Datum", dateChangedFromTo: (from: string, to: string) => `Das Datum deiner Buchung wurde von ${from} auf ${to} geändert.`, dateChangedTo: (to: string) => `Das neue Datum deiner Buchung ist ${to}.` },
  ru: { subject: "Бронирование", payment: "Оплата", hello: "Здравствуйте", reference: "Номер бронирования", experience: "Поездка", transfer: "Трансфер", date: "Дата", pending: "Будет подтверждено", bookingStatus: "Статус бронирования", paymentStatus: "Статус оплаты", total: "Итого", help: "Если у вас есть вопросы, ответьте на это письмо или свяжитесь с Daily Red Sea в WhatsApp.", dateChanged: "Новая дата", dateChangedFromTo: (from: string, to: string) => `Дата вашего бронирования изменена с ${from} на ${to}.`, dateChangedTo: (to: string) => `Новая дата вашего бронирования: ${to}.` },
  ar: { subject: "الحجز", payment: "الدفع", hello: "مرحباً", reference: "رقم الحجز", experience: "الرحلة", transfer: "التوصيل", date: "التاريخ", pending: "سيتم التأكيد", bookingStatus: "حالة الحجز", paymentStatus: "حالة الدفع", total: "إجمالي الحجز", help: "لأي استفسار، يرجى الرد على هذا البريد أو التواصل مع ديلي رد سي عبر واتساب.", dateChanged: "تاريخ جديد", dateChangedFromTo: (from: string, to: string) => `تم تغيير تاريخ حجزك من ${from} إلى ${to}.`, dateChangedTo: (to: string) => `تاريخ حجزك الآن هو ${to}.` },
  pl: { subject: "Rezerwacja", payment: "Płatność", hello: "Dzień dobry", reference: "Numer rezerwacji", experience: "Wycieczka", transfer: "Transfer", date: "Data", pending: "Do potwierdzenia", bookingStatus: "Status rezerwacji", paymentStatus: "Status płatności", total: "Łączna kwota", help: "W razie pytań odpowiedz na tę wiadomość lub skontaktuj się z Daily Red Sea przez WhatsApp.", dateChanged: "Nowa data", dateChangedFromTo: (from: string, to: string) => `Data Twojej rezerwacji została zmieniona z ${from} na ${to}.`, dateChangedTo: (to: string) => `Nowa data Twojej rezerwacji to ${to}.` },
  zh: { subject: "预订", payment: "付款", hello: "您好", reference: "预订编号", experience: "行程", transfer: "接送", date: "日期", pending: "待确认", bookingStatus: "预订状态", paymentStatus: "付款状态", total: "预订总额", help: "如有问题，请回复此邮件或通过 WhatsApp 联系 Daily Red Sea。", dateChanged: "新日期", dateChangedFromTo: (from: string, to: string) => `您的预订日期已由 ${from} 改为 ${to}。`, dateChangedTo: (to: string) => `您的预订日期现为 ${to}。` },
} as const;

export async function sendBookingAndPaymentStatusNotification(booking: StatusBooking) {
  if (!booking.customer_email) return { success: false, reason: "missing-recipient" };
  if (booking.status === "completed") {
    const { createRequiredAdminClient } = await import("@/utils/supabase/admin");
    const { data: account, error } = await createRequiredAdminClient().rpc("referral_account", { p_customer_key: booking.customer_email.trim().toLowerCase() });
    if (error) return { success: false, reason: "referral-account-unavailable" };
    const email = buildReferralMessage({ trip: await getPostTripContext(booking), event: "trip_completed", bookingReference: booking.reference, customerName: booking.customer_name, locale: booking.locale, qualified: Boolean(account?.qualified), referralCode: account?.referral_code });
    const attachment = { filename: `daily-red-sea-thank-you-${booking.reference.replace(/[^a-z0-9-]/gi, "-")}.pdf`, content: await createPostTripPdf({ reference: booking.reference, customerName: booking.customer_name, itemName: booking.tour_name, tourSlug: booking.tour_slug, locale: booking.locale, qualified: Boolean(account?.qualified), referralCode: account?.referral_code }) };
    return sendBookingEmail(booking.customer_email, email.subject, email.html, attachment);
  }
  const email = buildBookingAndPaymentStatusEmail(booking);
  if (!email) return { success: false, reason: "invalid-status" };
  const attachment = await buildBookingStatusPdfAttachment(booking);
  const delivery = await sendBookingEmail(booking.customer_email, email.subject, email.html, attachment);
  return { ...delivery, attachment };
}

export async function buildBookingStatusPdfAttachment(booking: StatusBooking) {
  const filenameReference = booking.reference.replace(/[^a-z0-9-]/gi, "-");
  const content = await createBookingStatusPdf({
    reference: booking.reference,
    generatedAt: new Date(),
    customerName: booking.customer_name,
    customerEmail: booking.customer_email || undefined,
    customerPhone: booking.phone || undefined,
    itemName: booking.tour_name || "Transfer",
    date: booking.date || undefined,
    travelers: booking.guests ? `${booking.guests} traveler${booking.guests === 1 ? "" : "s"}` : undefined,
    guests: booking.guests,
    participants: { adults: booking.adults, youth: booking.youth, infants: booking.infants },
    subtotal: booking.subtotal == null ? null : Number(booking.subtotal),
    discountAmount: booking.discount_amount == null ? null : Number(booking.discount_amount),
    promoCode: booking.promo_code,
    pricingSnapshot: booking.pricing_snapshot,
    historicalNotes: booking.notes,
    pickup: booking.hotel || undefined,
    amount: Number(booking.amount || 0),
    currency: booking.currency || "USD",
    bookingStatus: booking.status || "new",
    paymentStatus: booking.payment_status || "unpaid",
    assignedPersonName: booking.assignedPersonName,
    assignedPersonRole: booking.assignedPersonRole,
    locale: booking.locale || "en",
    tourSlug: booking.tour_slug,
  });
  return { filename: `daily-red-sea-status-${filenameReference}.pdf`, content };
}
