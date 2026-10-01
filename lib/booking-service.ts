import nodemailer from "nodemailer";

export const customerEmailSender = {
  email: "info@dailyredsea.com",
  formatted: "Daily Red Sea <info@dailyredsea.com>",
} as const;

export const companyStatement = "Daily Red Sea connects travelers with trusted local operators across Red Sea destinations — with transparent pricing and direct support every step of the way.";

function customerEmailSignatureHtml() {
  return `<div style="margin-top:28px;padding:18px 20px;border-top:3px solid #0284c7;background:#f0f9ff;color:#334155;font-family:Arial,sans-serif;font-size:13px;line-height:1.6"><p style="margin:0 0 8px;font-size:16px"><strong style="color:#0f172a">Daily Red Sea</strong></p><p style="margin:0 0 10px">${companyStatement}</p><p style="margin:0"><a href="https://dailyredsea.com" style="color:#0369a1;text-decoration:none;font-weight:600">dailyredsea.com</a><span style="color:#94a3b8"> &nbsp;|&nbsp; </span><a href="mailto:info@dailyredsea.com" style="color:#0369a1;text-decoration:none">info@dailyredsea.com</a></p></div>`;
}

export function withCustomerEmailSignature(toEmail: string, html: string) {
  const isCustomer = toEmail.trim().toLowerCase() !== customerEmailSender.email;
  const isCompleteBrandedEmail = html.includes("data-drs-complete-email");
  return isCustomer && !isCompleteBrandedEmail && !html.includes(companyStatement) ? `${html}${customerEmailSignatureHtml()}` : html;
}

export function normalizeGoogleAppPassword(value: string | undefined) {
  return value?.replace(/\s+/g, "") || "";
}

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
  assignedPersonName?: string;
  assignedPersonRole?: "guide" | "driver";
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

/** Customer communications are BCC'd to the shared inbox so staff keep a copy. */
export const customerEmailBcc = customerEmailSender.email;

/** `cid` marks an inline image referenced from the HTML as `src="cid:<cid>"`. */
export type EmailAttachment = { filename: string; content: Buffer; cid?: string; contentType?: string };

export async function sendBookingEmail(toEmail: string | undefined, subject: string, html: string, attachment?: EmailAttachment | EmailAttachment[], options: { bcc?: boolean } = {}) {
  const attachments = attachment ? (Array.isArray(attachment) ? attachment : [attachment]) : [];
  const environment = process.env as Record<string, string | undefined>;
  const smtpAppPassword = normalizeGoogleAppPassword(environment.GMAIL_SMTP_APP_PASSWORD);
  const apiKey = process.env.RESEND_API_KEY;

  if (!toEmail) {
    return { success: false, reason: "missing-recipient" };
  }
  const deliveredHtml = withCustomerEmailSignature(toEmail, html);
  const bcc = options.bcc !== false && toEmail.trim().toLowerCase() !== customerEmailBcc ? customerEmailBcc : undefined;

  if (smtpAppPassword) {
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: customerEmailSender.email,
          pass: smtpAppPassword,
        },
      });
      const result = await transporter.sendMail({
        from: customerEmailSender.formatted,
        replyTo: customerEmailSender.email,
        to: toEmail,
        bcc,
        subject,
        html: deliveredHtml,
        attachments: attachments.length ? attachments.map(({ filename, content, cid, contentType }) => ({ filename, content, ...(cid ? { cid, contentDisposition: "inline" as const } : {}), ...(contentType ? { contentType } : {}) })) : undefined,
      });

      return { success: true, data: { messageId: result.messageId } };
    } catch (error) {
      const smtpError = error as { code?: string; command?: string; responseCode?: number };
      console.error("Google Workspace email failed", {
        code: smtpError.code,
        command: smtpError.command,
        responseCode: smtpError.responseCode,
      });
      if (smtpError.code === "EAUTH" || smtpError.responseCode === 535) {
        return { success: false, reason: "gmail-auth-failed" };
      }
      if (["ECONNECTION", "ETIMEDOUT", "ESOCKET"].includes(smtpError.code || "")) {
        return { success: false, reason: "gmail-connection-failed" };
      }
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
      from: customerEmailSender.formatted,
      reply_to: customerEmailSender.email,
      to: [toEmail],
      ...(bcc ? { bcc: [bcc] } : {}),
      subject,
      html: deliveredHtml,
      ...(attachments.length ? { attachments: attachments.map(({ filename, content, cid, contentType }) => ({ filename, content: content.toString("base64"), ...(cid ? { content_id: cid } : {}), ...(contentType ? { content_type: contentType } : {}) })) } : {}),
    }),
  });

  const data = await response.json().catch(() => ({}));

  return {
    success: response.ok,
    status: response.status,
    data,
  };
}

