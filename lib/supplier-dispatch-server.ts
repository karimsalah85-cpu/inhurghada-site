import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { customerEmailSender, sendBookingEmail, sendWhatsAppMessage } from "@/lib/booking-service";
import { buildOfficeNoticeEmail } from "@/lib/email/messages";
import {
  buildSupplierEmail, buildSupplierMessage, formatTripDate, whatsappDigits,
  type MessageKind, type PaymentStatus, type RequestStatus, type SupplierBookingDetails, type SupplierBookingRow,
} from "@/lib/supplier-dispatch";
import { supplierRequestUrl } from "@/lib/supplier-request-token";

export const bookingColumnsForSupplier =
  "id,reference,type,customer_name,phone,tour_name,date,start_time,guests,adults,youth,infants,hotel,notes,amount,currency,payment_status,status,pricing_snapshot,transfer_details";

export const supplierColumns = "id,name,type,contact_name,phone,whatsapp,email,active,default_currency,payment_method";

export type SupplierContact = {
  id: string; name: string; type: string | null; contact_name: string | null; phone: string | null;
  whatsapp: string | null; email: string | null; active: boolean | null; default_currency: string | null; payment_method: string | null;
};

export type SupplierRequestRow = {
  id: string; booking_id: string; supplier_id: string; status: RequestStatus; details: SupplierBookingDetails;
  admin_note: string | null; supplier_note: string | null; amount_due: number | string | null; amount_due_currency: string | null;
  sent_at: string; last_sent_at: string; first_viewed_at: string | null; last_viewed_at: string | null; responded_at: string | null;
  responded_by: string | null; payment_status: PaymentStatus; payment_amount: number | string | null; payment_currency: string | null;
  payment_method: string | null; payment_reference: string | null; payment_note: string | null; payment_sent_at: string | null;
  payment_confirmed_at: string | null; created_by_email: string; created_at: string; updated_at: string;
};

export type Channel = "whatsapp" | "email";
export type DeliveryResult = { channel: Channel; success: boolean; reason?: string };

export async function loadBookingForSupplier(database: SupabaseClient, bookingId: string) {
  let { data, error } = await database.from("bookings").select(`${bookingColumnsForSupplier},guest_requirements`).eq("id", bookingId).maybeSingle();
  // guest_requirements arrives with the 20261001065646 migration; the code may deploy first.
  if (error && ["42703", "PGRST204"].includes(error.code || "")) ({ data, error } = await database.from("bookings").select(bookingColumnsForSupplier).eq("id", bookingId).maybeSingle());
  if (error) throw error;
  return data as (SupplierBookingRow & { id: string }) | null;
}

export function amountDueOf(request: Pick<SupplierRequestRow, "amount_due" | "amount_due_currency">) {
  return request.amount_due == null || !request.amount_due_currency ? null : { amount: Number(request.amount_due), currency: request.amount_due_currency };
}

export function messageInputFor(request: SupplierRequestRow, supplier: Pick<SupplierContact, "name" | "contact_name">, kind: MessageKind) {
  return {
    kind,
    supplierName: supplier.contact_name || supplier.name,
    details: request.details,
    link: supplierRequestUrl(request.id),
    adminNote: kind === "payment_sent" ? request.payment_note : request.admin_note,
    amountDue: amountDueOf(request),
    payment: request.payment_status !== "none" && request.payment_amount != null && request.payment_currency
      ? { amount: Number(request.payment_amount), currency: request.payment_currency, method: request.payment_method, reference: request.payment_reference }
      : null,
  };
}

/** A wa.me link with the message pre-filled, so the admin can always send from their own WhatsApp. */
export function manualWhatsAppLink(supplier: Pick<SupplierContact, "whatsapp" | "phone">, message: string) {
  const digits = whatsappDigits(supplier.whatsapp) || whatsappDigits(supplier.phone);
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : null;
}

/**
 * Twilio only delivers free-form WhatsApp text inside a 24-hour window after
 * the supplier last messaged us. Outside it, a Meta-approved template is
 * required: set TWILIO_WHATSAPP_SUPPLIER_CONTENT_SID to a Content template
 * with variables {{1}} supplier name, {{2}} one-line summary, {{3}} link.
 */
async function sendSupplierWhatsApp(to: string, message: string, variables: Record<string, string>) {
  const contentSid = process.env.TWILIO_WHATSAPP_SUPPLIER_CONTENT_SID?.trim();
  if (!contentSid) return sendWhatsAppMessage(`+${to}`, message);
  const sid = process.env.TWILIO_ACCOUNT_SID, token = process.env.TWILIO_AUTH_TOKEN, from = process.env.TWILIO_WHATSAPP_FROM;
  if (!sid || !token || !from) return { success: false, reason: "missing-twilio-config" };
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}` },
    body: new URLSearchParams({ To: `whatsapp:+${to}`, From: from, ContentSid: contentSid, ContentVariables: JSON.stringify(variables) }).toString(),
  });
  const data = await response.json().catch(() => ({})) as { message?: string; code?: number };
  return response.ok ? { success: true } : { success: false, reason: data.code ? `twilio-${data.code}` : `twilio-http-${response.status}` };
}

function reasonOf(result: { success: boolean; reason?: string; status?: number; data?: unknown }) {
  if (result.success) return undefined;
  if (result.reason) return result.reason;
  const code = (result.data as { code?: number } | undefined)?.code;
  return code ? `twilio-${code}` : result.status ? `http-${result.status}` : "delivery-failed";
}

/** Sends one message kind to the supplier on each requested channel and logs failures on the timeline. */
export async function deliverToSupplier(database: SupabaseClient, request: SupplierRequestRow, supplier: SupplierContact, kind: MessageKind, channels: Channel[]): Promise<DeliveryResult[]> {
  const input = messageInputFor(request, supplier, kind);
  const results: DeliveryResult[] = [];
  for (const channel of channels) {
    let result: DeliveryResult;
    try {
      if (channel === "whatsapp") {
        const to = whatsappDigits(supplier.whatsapp) || whatsappDigits(supplier.phone);
        if (!to) result = { channel, success: false, reason: "no-whatsapp-number" };
        else {
          const trip = request.details.trips[0];
          const summary = `${kind === "cancelled" ? "CANCELLED: " : kind === "payment_sent" ? "Payment sent for " : ""}${request.details.reference} · ${trip?.name || "Booking"} · ${formatTripDate(trip?.date ?? null)}`;
          const sent = await sendSupplierWhatsApp(to, buildSupplierMessage(input), { "1": input.supplierName, "2": summary, "3": input.link });
          result = { channel, success: sent.success, reason: reasonOf(sent) };
        }
      } else {
        if (!supplier.email) result = { channel, success: false, reason: "no-email-address" };
        else {
          const email = buildSupplierEmail(input);
          const sent = await sendBookingEmail(supplier.email, email.subject, email.html);
          result = { channel, success: sent.success, reason: reasonOf(sent) };
        }
      }
    } catch (error) {
      console.error("Supplier message failed", { requestId: request.id, channel, message: error instanceof Error ? error.message : "unknown" });
      result = { channel, success: false, reason: "exception" };
    }
    results.push(result);
    if (!result.success) {
      await recordEvent(database, request.id, "delivery_failed", "system", null, { channel, kind, reason: result.reason });
    }
  }
  return results;
}

export async function recordEvent(database: SupabaseClient, requestId: string, eventType: string, actor: string, note: string | null, metadata: Record<string, unknown> = {}) {
  const { error } = await database.from("supplier_booking_request_events")
    .insert({ request_id: requestId, event_type: eventType, actor: actor.slice(0, 320) || "system", note: note?.slice(0, 1000) || null, metadata });
  if (error) console.error("Supplier request event not recorded", { requestId, eventType, message: error.message });
  return !error;
}

/** Emails the office inbox when a supplier answers, so declines and payment problems are never missed. */
export async function notifyOffice(subject: string, lines: string[]) {
  try {
    const result = await sendBookingEmail(customerEmailSender.email, subject, buildOfficeNoticeEmail({ subject, lines }).html, undefined, { bcc: false });
    if (!result.success) console.error("Office notification failed", { subject, reason: "reason" in result ? result.reason : "unknown" });
  } catch (error) {
    console.error("Office notification failed", { subject, message: error instanceof Error ? error.message : "unknown" });
  }
}
