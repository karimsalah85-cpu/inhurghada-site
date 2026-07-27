import { sendBookingEmail } from "@/lib/booking-service";

export type StatusBooking = {
  reference: string;
  customer_name: string;
  customer_email: string | null;
  tour_name: string | null;
  date: string | null;
  status?: string;
  payment_status?: string;
  amount?: number | string;
  currency?: string;
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
  const amount = booking.amount == null
    ? null
    : new Intl.NumberFormat("en", { style: "currency", currency: booking.currency || "USD" }).format(Number(booking.amount));
  const details = [
    ["Booking reference", booking.reference],
    ["Experience", booking.tour_name || "Transfer"],
    ["Date", booking.date || "To be confirmed"],
    ["Booking status", bookingStatus.label],
    ["Payment status", paymentStatus.label],
    ...(amount ? [["Booking total", amount]] : []),
  ];
  const rows = details.map(([label, value]) => `<tr><th align="left" style="padding:8px;border-bottom:1px solid #e2e8f0">${escapeHtml(label)}</th><td style="padding:8px;border-bottom:1px solid #e2e8f0">${escapeHtml(value)}</td></tr>`).join("");
  return {
    subject: `Booking ${booking.reference}: ${bookingStatus.label} · Payment ${paymentStatus.label}`,
    html: `<p>Hello ${escapeHtml(booking.customer_name)},</p><p>${escapeHtml(bookingStatus.message)}</p><p>${escapeHtml(paymentStatus.message)}</p><table cellpadding="0" cellspacing="0" style="border-collapse:collapse">${rows}</table><p>If you have any questions, reply to this email or contact Daily Red Sea on WhatsApp.</p>`,
    text: [
      `Hello ${booking.customer_name},`,
      "",
      bookingStatus.message,
      paymentStatus.message,
      "",
      ...details.map(([label, value]) => `${label}: ${value}`),
      "",
      "If you have any questions, reply to this email or contact Daily Red Sea on WhatsApp.",
    ].join("\n"),
  };
}

export async function sendBookingAndPaymentStatusNotification(booking: StatusBooking) {
  if (!booking.customer_email) return { success: false, reason: "missing-recipient" };
  const email = buildBookingAndPaymentStatusEmail(booking);
  if (!email) return { success: false, reason: "invalid-status" };
  return sendBookingEmail(booking.customer_email, email.subject, email.html);
}
