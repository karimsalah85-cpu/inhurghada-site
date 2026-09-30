import { NextRequest } from "next/server";
import { getAdminAuthorization } from "@/lib/admin-permission";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { buildSupplierBookingDetails, type MessageKind } from "@/lib/supplier-dispatch";
import { firstIssue, isMissingTable, isUuid, loadPresentedRequests, noStoreJson, requestActionSchema } from "@/lib/supplier-dispatch-admin";
import {
  deliverToSupplier, loadBookingForSupplier, recordEvent, supplierColumns,
  type Channel, type DeliveryResult, type SupplierContact, type SupplierRequestRow,
} from "@/lib/supplier-dispatch-server";
import { createAdminClient } from "@/utils/supabase/admin";

export const runtime = "nodejs";

/** Admin actions on one supplier request: resend, cancel, record a phone answer, or record a payment. */
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasValidRequestOrigin(request)) return noStoreJson({ error: "Invalid origin." }, 403);
  const { id } = await context.params;
  if (!isUuid(id)) return noStoreJson({ error: "Invalid request identifier." }, 400);
  const parsed = requestActionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ error: firstIssue(parsed.error) }, 400);
  const input = parsed.data;
  const permission = input.action === "payment_sent" ? "edit_expenses" : "edit_bookings";
  const { user, allowed } = await getAdminAuthorization(permission);
  if (!allowed || !user) return noStoreJson({ error: input.action === "payment_sent" ? "Only finance staff can record supplier payments." : "Booking-editing permission required." }, 403);
  const database = createAdminClient();
  if (!database) return noStoreJson({ error: "Database is not configured." }, 503);

  const { data: current, error: loadError } = await database.from("supplier_booking_requests").select("*").eq("id", id).maybeSingle();
  if (loadError) {
    if (isMissingTable(loadError)) return noStoreJson({ error: "Supplier requests are not set up yet." }, 503);
    return noStoreJson({ error: "The request could not be loaded." }, 500);
  }
  if (!current) return noStoreJson({ error: "Request not found." }, 404);
  const row = current as SupplierRequestRow;
  const { data: supplier } = await database.from("suppliers").select(supplierColumns).eq("id", row.supplier_id).maybeSingle();
  if (!supplier) return noStoreJson({ error: "Supplier not found." }, 404);
  const contact = supplier as SupplierContact;
  const actor = user.email || "Admin";
  const now = new Date().toISOString();

  const channelsOf = "channels" in input ? input.channels as Channel[] : [];
  if (channelsOf.includes("whatsapp") && !(contact.whatsapp || contact.phone)) return noStoreJson({ error: `${contact.name} has no WhatsApp or phone number.` }, 400);
  if (channelsOf.includes("email") && !contact.email) return noStoreJson({ error: `${contact.name} has no email address.` }, 400);

  let patch: Record<string, unknown> = {};
  let event = "";
  let note: string | null = null;
  let messageKind: MessageKind | null = null;
  const metadata: Record<string, unknown> = {};

  switch (input.action) {
    case "resend": {
      if (row.status === "cancelled" || row.status === "declined") return noStoreJson({ error: "This request is closed. Send a new request instead." }, 409);
      event = "resent";
      messageKind = input.kind;
      patch = { last_sent_at: now };
      if (input.refresh_details || input.kind === "update") {
        const booking = await loadBookingForSupplier(database, row.booking_id).catch(() => null);
        if (!booking) return noStoreJson({ error: "Booking not found." }, 404);
        const includeGuestPrice = input.include_guest_price ?? Boolean(row.details?.guestPayment);
        patch.details = buildSupplierBookingDetails(booking, { includeGuestPrice });
      }
      // An update asks the supplier to confirm again.
      if (input.kind === "update") Object.assign(patch, { status: "sent", responded_at: null, responded_by: null });
      Object.assign(metadata, { kind: input.kind, channels: channelsOf, refreshed: Boolean(patch.details) });
      break;
    }
    case "cancel":
      if (row.status === "cancelled") return noStoreJson({ error: "Already cancelled." }, 409);
      event = "cancelled"; note = input.note; messageKind = "cancelled";
      patch = { status: "cancelled" };
      Object.assign(metadata, { channels: channelsOf, previous_status: row.status });
      break;
    case "mark_confirmed":
    case "mark_declined":
      if (row.status === "cancelled") return noStoreJson({ error: "This request is cancelled." }, 409);
      event = input.action === "mark_confirmed" ? "manual_confirmed" : "manual_declined";
      note = input.note;
      patch = { status: input.action === "mark_confirmed" ? "confirmed" : "declined", responded_at: now, responded_by: `${actor} (recorded by admin)`.slice(0, 120), ...(input.note ? { supplier_note: input.note } : {}) };
      metadata.previous_status = row.status;
      break;
    case "payment_sent":
      event = "payment_sent"; note = input.note; messageKind = "payment_sent";
      patch = {
        payment_status: "sent", payment_amount: input.amount, payment_currency: input.currency, payment_method: input.method ?? null,
        payment_reference: input.reference, payment_note: input.note, payment_sent_at: now, payment_confirmed_at: null,
      };
      Object.assign(metadata, { amount: input.amount, currency: input.currency, method: input.method ?? null, reference: input.reference, channels: channelsOf });
      break;
  }

  const { data: updated, error } = await database.from("supplier_booking_requests")
    .update({ ...patch, updated_at: now }).eq("id", id).eq("updated_at", row.updated_at).select("*").maybeSingle();
  if (error) {
    if (error.code === "23505") return noStoreJson({ error: "This supplier already has another open request for the booking." }, 409);
    console.error("Supplier request update failed", { id, code: error.code, message: error.message });
    return noStoreJson({ error: "The change could not be saved." }, 500);
  }
  if (!updated) return noStoreJson({ error: "This request just changed (maybe the supplier answered). Refresh and try again." }, 409);
  await recordEvent(database, id, event, actor, note, metadata);
  let delivery: DeliveryResult[] = [];
  if (messageKind && channelsOf.length) delivery = await deliverToSupplier(database, updated as SupplierRequestRow, contact, messageKind, channelsOf);
  return noStoreJson({ delivery, requests: await loadPresentedRequests(database, row.booking_id) });
}
