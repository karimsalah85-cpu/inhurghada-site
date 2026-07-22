import crypto from "node:crypto";
import nodemailer from "nodemailer";

type BookingType = "tour" | "transfer";
type BookingStatus = "submitted" | "paid" | "cancelled";

export type BookingRecord = {
  reference: string;
  type: BookingType;
  customerName: string;
  phone: string;
  customerEmail?: string;
  status: BookingStatus;
  createdAt: string;
  amount?: number;
  currency?: string;
  tourName?: string;
  location?: string;
  duration?: string;
  price?: string;
  date?: string;
  guests?: string;
  hotel?: string;
  message?: string;
};

type GlobalWithBookings = typeof globalThis & {
  __dailyRedSeaBookings?: BookingRecord[];
};

export function getBookingStore(): BookingRecord[] {
  const globalWithBookings = globalThis as GlobalWithBookings;

  if (!globalWithBookings.__dailyRedSeaBookings) {
    globalWithBookings.__dailyRedSeaBookings = [];
  }

  return globalWithBookings.__dailyRedSeaBookings;
}

export function addBooking(booking: BookingRecord) {
  const store = getBookingStore();
  store.push(booking);
  return booking;
}

export function findBooking(reference: string) {
  return getBookingStore().find((item) => item.reference === reference);
}

export function findBookingByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return undefined;
  }

  return getBookingStore().find((item) => item.customerEmail?.trim().toLowerCase() === normalizedEmail);
}

export function markBookingStatus(reference: string, status: BookingStatus) {
  const booking = findBooking(reference);

  if (booking) {
    booking.status = status;
  }

  return booking;
}

export function buildBookingMessage(payload: Record<string, unknown>) {
  const lines = [
    "🌊 Daily Red Sea Booking Request",
    "",
    `🆔 Reference: ${payload.reference}`,
    `👤 Customer Name: ${payload.customerName}`,
    `📱 WhatsApp: ${payload.phone}`,
  ];

  if (payload.tourName) {
    lines.push(`🏝 Tour: ${payload.tourName}`);
  }

  if (payload.location) {
    lines.push(`📍 Location: ${payload.location}`);
  }

  if (payload.duration) {
    lines.push(`⏰ Duration: ${payload.duration}`);
  }

  if (payload.price) {
    lines.push(`💰 Price: ${payload.price}`);
  }

  if (payload.date) {
    lines.push(`📅 Date: ${payload.date}`);
  }

  if (payload.guests) {
    lines.push(`👥 Guests: ${payload.guests}`);
  }

  if (payload.hotel) {
    lines.push(`🏨 Hotel: ${payload.hotel}`);
  }

  if (payload.message) {
    lines.push(`📝 Notes: ${payload.message}`);
  }

  lines.push("", "Payment: cash on arrival.", "We will confirm availability shortly.");

  return lines.join("\n");
}

export function buildWhatsAppLink(phone: string, message: string) {
  const recipient = phone.replace(/\D/g, "");
  return `https://wa.me/${recipient}?text=${encodeURIComponent(message)}`;
}

export async function sendWhatsAppMessage(phone: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!sid || !token || !from) {
    return { success: false, reason: "missing-twilio-config" };
  }

  const normalizedPhone = phone.startsWith("whatsapp:") ? phone : `whatsapp:${phone.replace(/^\+?/, "+")}`;

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      To: normalizedPhone,
      From: from,
      Body: body,
    }).toString(),
  });

  const data = await response.json().catch(() => ({}));

  return {
    success: response.ok,
    status: response.status,
    data,
  };
}

export async function sendBookingEmail(toEmail: string | undefined, subject: string, html: string) {
  const environment = process.env as Record<string, string | undefined>;
  const smtpUser = environment.GMAIL_SMTP_USER || "info@dailyredsea.com";
  const smtpAppPassword = environment.GMAIL_SMTP_APP_PASSWORD;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "Daily Red Sea <onboarding@resend.dev>";

  if (!toEmail) {
    return { success: false, reason: "missing-recipient" };
  }

  if (smtpAppPassword) {
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: smtpUser,
          pass: smtpAppPassword,
        },
      });
      const result = await transporter.sendMail({
        from: `Daily Red Sea <${smtpUser}>`,
        to: toEmail,
        subject,
        html,
      });

      return { success: true, data: { messageId: result.messageId } };
    } catch (error) {
      console.error("Google Workspace email failed", error);
      return { success: false, reason: "gmail-smtp-failed" };
    }
  }

  if (!apiKey) {
    return { success: false, reason: "missing-email-config" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [toEmail],
      subject,
      html,
    }),
  });

  const data = await response.json().catch(() => ({}));

  return {
    success: response.ok,
    status: response.status,
    data,
  };
}

export async function createStripeCheckoutSession(payload: {
  bookingReference: string;
  amount: number;
  currency?: string;
  customerEmail?: string;
  bookingType: BookingType;
  invoiceDetails?: {
    customerName?: string;
    customerPhone?: string;
    date?: string;
    guests?: string;
    hotel?: string;
    tourName?: string;
  };
}) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "http://localhost:3000";

  if (!secretKey) {
    return { success: false, reason: "missing-stripe-config" };
  }

  const amountInCents = Math.round(Number(payload.amount || 0) * 100);

  if (!Number.isFinite(amountInCents) || amountInCents <= 0) {
    return { success: false, reason: "invalid-amount" };
  }

  const metadata = {
    bookingReference: payload.bookingReference,
    bookingType: payload.bookingType,
    customerName: payload.invoiceDetails?.customerName,
    customerPhone: payload.invoiceDetails?.customerPhone,
    bookingDate: payload.invoiceDetails?.date,
    guests: payload.invoiceDetails?.guests,
    hotel: payload.invoiceDetails?.hotel,
    tourName: payload.invoiceDetails?.tourName,
  };

  const formData = new URLSearchParams({
    mode: "payment",
    success_url: `${siteUrl}/checkout?status=success&booking=${encodeURIComponent(payload.bookingReference)}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/checkout?status=cancelled&booking=${encodeURIComponent(payload.bookingReference)}`,
    "line_items[0][price_data][currency]": (payload.currency || "usd").toLowerCase(),
    "line_items[0][price_data][product_data][name]": payload.invoiceDetails?.tourName || `Daily Red Sea ${payload.bookingType === "transfer" ? "Transfer" : "Tour"}`,
    "line_items[0][price_data][unit_amount]": String(amountInCents),
    "line_items[0][quantity]": "1",
    ...(payload.customerEmail ? { customer_email: payload.customerEmail } : {}),
  });

  for (const [key, value] of Object.entries(metadata)) {
    if (value) {
      formData.set(`metadata[${key}]`, value);
    }
  }

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return { success: false, reason: data.error?.message || "stripe-session-failed", data };
  }

  return {
    success: true,
    url: data.url,
    id: data.id,
  };
}

export async function getStripeCheckoutSession(sessionId: string) {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    return { success: false, reason: "missing-stripe-config" } as const;
  }

  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}?expand[]=line_items&expand[]=payment_intent.payment_method`, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return { success: false, reason: data.error?.message || "stripe-session-not-found" } as const;
  }

  return { success: true, session: data } as const;
}

export function verifyStripeSignature(payload: string, signature: string | null, secret: string | null) {
  if (!signature || !secret) {
    return false;
  }

  const elements = signature.split(",").reduce<Record<string, string>>((acc, item) => {
    const [key, value] = item.split("=");

    if (key && value) {
      acc[key] = value;
    }

    return acc;
  }, {});

  const timestamp = elements.t;
  const expectedSignature = elements.v1;

  if (!timestamp || !expectedSignature) {
    return false;
  }

  const signedPayload = `${timestamp}.${payload}`;
  const digest = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");

  return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(digest));
}
