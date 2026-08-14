import { companyStatement, sendBookingEmail } from "@/lib/booking-service";
import { createBookingStatusPdf } from "@/lib/invoice-service";
import { bookingLocale } from "@/lib/booking-communications-i18n";

export type StatusBooking = {
  reference: string;
  customer_name: string;
  customer_email: string | null;
  phone?: string | null;
  tour_name: string | null;
  date: string | null;
  guests?: number | null;
  hotel?: string | null;
  status?: string;
  payment_status?: string;
  amount?: number | string;
  currency?: string;
  assignedPersonName?: string;
  assignedPersonRole?: "guide" | "driver";
  locale?: string | null;
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

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
})[character] || character);

export async function sendBookingStatusNotification(booking: StatusBooking, status: string) {
  if (!booking.customer_email) return { success: false, reason: "missing-recipient" };
  const copy = statusCopy[status];
  if (!copy) return { success: false, reason: "invalid-status" };
  const details = [
    ["Booking reference", booking.reference],
    ["Experience", booking.tour_name || "Transfer"],
    ["Date", booking.date || "To be confirmed"],
    ["New status", copy.label],
  ];
  const rows = details.map(([label, value]) => `<tr><th align="left" style="padding:8px;border-bottom:1px solid #e2e8f0">${escapeHtml(label)}</th><td style="padding:8px;border-bottom:1px solid #e2e8f0">${escapeHtml(value)}</td></tr>`).join("");
  const html = `<p>Hello ${escapeHtml(booking.customer_name)},</p><p>${escapeHtml(copy.message)}</p><table cellpadding="0" cellspacing="0" style="border-collapse:collapse">${rows}</table><p>If you have any questions, reply to this email or contact Daily Red Sea on WhatsApp.</p>`;
  return sendBookingEmail(booking.customer_email, `Booking ${booking.reference}: ${copy.label}`, html);
}

export function buildBookingAndPaymentStatusEmail(booking: StatusBooking) {
  const bookingStatus = statusCopy[booking.status || ""];
  const paymentStatus = paymentCopy[booking.payment_status || ""];
  if (!bookingStatus || !paymentStatus) return null;
  const locale = bookingLocale(booking.locale);
  const labels = localizedStatusLabels[locale];
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
    ...(amount ? [[labels.total, amount]] : []),
  ];
  const rows = details.map(([label, value]) => `<tr><th align="left" style="padding:8px;border-bottom:1px solid #e2e8f0">${escapeHtml(label)}</th><td style="padding:8px;border-bottom:1px solid #e2e8f0">${escapeHtml(value)}</td></tr>`).join("");
  return {
    subject: `${labels.subject} ${booking.reference}: ${bookingStatus.label} · ${labels.payment} ${paymentStatus.label}`,
    html: `<div dir="${locale === "ar" ? "rtl" : "ltr"}" lang="${locale}"><p>${labels.hello} ${escapeHtml(booking.customer_name)},</p><p>${escapeHtml(bookingStatus.message)}</p><p>${escapeHtml(paymentStatus.message)}</p><table cellpadding="0" cellspacing="0" style="border-collapse:collapse">${rows}</table><p>${labels.help}</p></div>`,
    text: [
      `${labels.hello} ${booking.customer_name},`,
      "",
      bookingStatus.message,
      paymentStatus.message,
      "",
      ...details.map(([label, value]) => `${label}: ${value}`),
      "",
      labels.help,
      "",
      "About Daily Red Sea",
      companyStatement,
    ].join("\n"),
  };
}

const localizedStatusLabels = {
  en: { subject: "Booking", payment: "Payment", hello: "Hello", reference: "Booking reference", experience: "Experience", transfer: "Transfer", date: "Date", pending: "To be confirmed", bookingStatus: "Booking status", paymentStatus: "Payment status", total: "Booking total", help: "If you have any questions, reply to this email or contact Daily Red Sea on WhatsApp." },
  de: { subject: "Buchung", payment: "Zahlung", hello: "Hallo", reference: "Buchungsnummer", experience: "Erlebnis", transfer: "Transfer", date: "Datum", pending: "Wird noch bestätigt", bookingStatus: "Buchungsstatus", paymentStatus: "Zahlungsstatus", total: "Gesamtbetrag", help: "Bei Fragen antworte auf diese E-Mail oder kontaktiere Daily Red Sea über WhatsApp." },
  ru: { subject: "Бронирование", payment: "Оплата", hello: "Здравствуйте", reference: "Номер бронирования", experience: "Поездка", transfer: "Трансфер", date: "Дата", pending: "Будет подтверждено", bookingStatus: "Статус бронирования", paymentStatus: "Статус оплаты", total: "Итого", help: "Если у вас есть вопросы, ответьте на это письмо или свяжитесь с Daily Red Sea в WhatsApp." },
  ar: { subject: "الحجز", payment: "الدفع", hello: "مرحباً", reference: "رقم الحجز", experience: "الرحلة", transfer: "التوصيل", date: "التاريخ", pending: "سيتم التأكيد", bookingStatus: "حالة الحجز", paymentStatus: "حالة الدفع", total: "إجمالي الحجز", help: "لأي استفسار، يرجى الرد على هذا البريد أو التواصل مع ديلي رد سي عبر واتساب." },
  pl: { subject: "Rezerwacja", payment: "Płatność", hello: "Dzień dobry", reference: "Numer rezerwacji", experience: "Wycieczka", transfer: "Transfer", date: "Data", pending: "Do potwierdzenia", bookingStatus: "Status rezerwacji", paymentStatus: "Status płatności", total: "Łączna kwota", help: "W razie pytań odpowiedz na tę wiadomość lub skontaktuj się z Daily Red Sea przez WhatsApp." },
  zh: { subject: "预订", payment: "付款", hello: "您好", reference: "预订编号", experience: "行程", transfer: "接送", date: "日期", pending: "待确认", bookingStatus: "预订状态", paymentStatus: "付款状态", total: "预订总额", help: "如有问题，请回复此邮件或通过 WhatsApp 联系 Daily Red Sea。" },
} as const;

export async function sendBookingAndPaymentStatusNotification(booking: StatusBooking) {
  if (!booking.customer_email) return { success: false, reason: "missing-recipient" };
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
    pickup: booking.hotel || undefined,
    amount: Number(booking.amount || 0),
    currency: booking.currency || "USD",
    bookingStatus: booking.status || "new",
    paymentStatus: booking.payment_status || "unpaid",
    assignedPersonName: booking.assignedPersonName,
    assignedPersonRole: booking.assignedPersonRole,
    locale: booking.locale || "en",
  });
  return { filename: `daily-red-sea-status-${filenameReference}.pdf`, content };
}
