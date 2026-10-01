import { NextRequest } from "next/server";
import { getAdminAuthorization } from "@/lib/admin-permission";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { buildSupplierBookingDetails } from "@/lib/supplier-dispatch";
import {
  createRequestSchema, firstIssue, isMissingTable, isUuid, loadPresentedRequests, noStoreJson,
} from "@/lib/supplier-dispatch-admin";
import {
  deliverToSupplier, loadBookingForSupplier, recordEvent, supplierColumns,
  type SupplierContact, type SupplierRequestRow,
} from "@/lib/supplier-dispatch-server";
import { createAdminClient } from "@/utils/supabase/admin";

export const runtime = "nodejs";

const notMigrated = { configured: false, error: "Supplier requests are not set up yet: apply the supplier_booking_requests migration." };

/** Supplier requests on a booking, plus the suppliers that can be sent one (linked ones first). */
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!isUuid(id)) return noStoreJson({ error: "Invalid booking identifier." }, 400);
  const { allowed } = await getAdminAuthorization("view_bookings");
  if (!allowed) return noStoreJson({ error: "Booking access required." }, 403);
  const database = createAdminClient();
  if (!database) return noStoreJson({ error: "Database is not configured." }, 503);
  const { allowed: canEdit } = await getAdminAuthorization("edit_bookings");
  const { allowed: canPay } = await getAdminAuthorization("edit_expenses");
  try {
    const [requests, suppliers, assignments, lines, partnerCosts] = await Promise.all([
      loadPresentedRequests(database, id),
      database.from("suppliers").select(supplierColumns).order("name"),
      database.from("booking_assignments").select("supplier_id").eq("booking_id", id).neq("status", "cancelled").not("supplier_id", "is", null),
      database.from("booking_financial_lines").select("supplier_id").eq("booking_id", id).not("supplier_id", "is", null),
      database.from("booking_line_partner_costs").select("supplier_id").eq("booking_id", id).eq("status", "active"),
    ]);
    if (suppliers.error) throw suppliers.error;
    // Finance tables may be absent on older databases; linked suggestions are best-effort.
    const linked = [...new Set([assignments, lines, partnerCosts].flatMap((result) => (result.error ? [] : (result.data || []) as { supplier_id: string }[]).map((row) => row.supplier_id)))];
    return noStoreJson({
      requests,
      suppliers: ((suppliers.data || []) as SupplierContact[]).filter((s) => s.active !== false).map((s) => ({
        id: s.id, name: s.name, type: s.type, has_whatsapp: Boolean(s.whatsapp || s.phone), has_email: Boolean(s.email), default_currency: s.default_currency, payment_method: s.payment_method,
      })),
      linked_supplier_ids: linked,
      can_edit: canEdit,
      can_record_payment: canPay,
    });
  } catch (error) {
    if (isMissingTable(error)) return noStoreJson(notMigrated, 503);
    console.error("Supplier requests could not load", { bookingId: id, message: (error as { message?: string })?.message });
    return noStoreJson({ error: "Supplier requests could not be loaded." }, 500);
  }
}

/** Creates a request for one supplier and sends it on the chosen channels. */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasValidRequestOrigin(request)) return noStoreJson({ error: "Invalid origin." }, 403);
  const { id } = await context.params;
  if (!isUuid(id)) return noStoreJson({ error: "Invalid booking identifier." }, 400);
  const { user, allowed } = await getAdminAuthorization("edit_bookings");
  if (!allowed || !user) return noStoreJson({ error: "Booking-editing permission required." }, 403);
  const parsed = createRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ error: firstIssue(parsed.error) }, 400);
  const input = parsed.data;
  const database = createAdminClient();
  if (!database) return noStoreJson({ error: "Database is not configured." }, 503);

  const booking = await loadBookingForSupplier(database, id).catch(() => null);
  if (!booking) return noStoreJson({ error: "Booking not found." }, 404);
  if (booking.status === "cancelled") return noStoreJson({ error: "This booking is cancelled — there is nothing to send to a supplier." }, 409);
  const { data: supplier, error: supplierError } = await database.from("suppliers").select(supplierColumns).eq("id", input.supplier_id).maybeSingle();
  if (supplierError || !supplier) return noStoreJson({ error: "Supplier not found." }, 404);
  const contact = supplier as SupplierContact;
  if (contact.active === false) return noStoreJson({ error: "This supplier is inactive." }, 409);
  if (input.channels.includes("whatsapp") && !(contact.whatsapp || contact.phone)) return noStoreJson({ error: `${contact.name} has no WhatsApp or phone number. Add one on the supplier first.` }, 400);
  if (input.channels.includes("email") && !contact.email) return noStoreJson({ error: `${contact.name} has no email address. Add one on the supplier first.` }, 400);

  const actor = user.email || "Admin";
  const { data: created, error } = await database.from("supplier_booking_requests").insert({
    booking_id: id,
    supplier_id: contact.id,
    details: buildSupplierBookingDetails(booking, { includeGuestPrice: input.include_guest_price, includeMedical: input.include_medical }),
    admin_note: input.note,
    amount_due: input.amount_due ?? null,
    amount_due_currency: input.amount_due == null ? null : input.amount_due_currency,
    created_by: user.id,
    created_by_email: actor,
  }).select("*").single();
  if (error) {
    if (isMissingTable(error)) return noStoreJson(notMigrated, 503);
    if (error.code === "23505") return noStoreJson({ error: `${contact.name} already has an open request for this booking. Use “Resend” on it instead.` }, 409);
    console.error("Supplier request not created", { bookingId: id, code: error.code, message: error.message });
    return noStoreJson({ error: "The request could not be saved." }, 500);
  }
  const row = created as SupplierRequestRow;
  await recordEvent(database, row.id, "sent", actor, input.note, { channels: input.channels, include_guest_price: input.include_guest_price, include_medical: input.include_medical });
  const delivery = await deliverToSupplier(database, row, contact, "request", input.channels);
  return noStoreJson({ request_id: row.id, delivery, requests: await loadPresentedRequests(database, id) }, 201);
}
