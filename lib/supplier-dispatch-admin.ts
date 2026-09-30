import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildSupplierMessage, type MessageKind } from "@/lib/supplier-dispatch";
import {
  manualWhatsAppLink, messageInputFor, supplierColumns,
  type SupplierContact, type SupplierRequestRow,
} from "@/lib/supplier-dispatch-server";
import { supplierRequestUrl } from "@/lib/supplier-request-token";

export const noStoreJson = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: string) => uuidPattern.test(value);

const optionalNote = z.string().trim().max(1000).optional().transform((value) => value || null);
const currency = z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, "Use a 3-letter currency code.");
const channels = z.array(z.enum(["whatsapp", "email"])).max(2).default([]).transform((list) => [...new Set(list)]);

export const createRequestSchema = z.object({
  supplier_id: z.string().regex(uuidPattern, "Choose a supplier."),
  channels,
  note: optionalNote,
  include_guest_price: z.boolean().default(false),
  amount_due: z.number().nonnegative().max(10_000_000).nullable().optional(),
  amount_due_currency: currency.nullable().optional(),
}).refine((value) => value.amount_due == null || value.amount_due_currency != null, {
  message: "Give a currency for the supplier amount.", path: ["amount_due_currency"],
});

export const requestActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("resend"), channels, kind: z.enum(["reminder", "update"]).default("reminder"), refresh_details: z.boolean().default(false), include_guest_price: z.boolean().optional() }),
  z.object({ action: z.literal("cancel"), channels, note: optionalNote }),
  z.object({ action: z.literal("mark_confirmed"), note: optionalNote }),
  z.object({ action: z.literal("mark_declined"), note: optionalNote }),
  z.object({
    action: z.literal("payment_sent"), channels,
    amount: z.number().positive("Enter the amount paid.").max(10_000_000),
    currency,
    method: z.enum(["cash", "bank_transfer", "instapay", "vodafone_cash", "other"]).nullable().optional(),
    reference: z.string().trim().max(200).optional().transform((value) => value || null),
    note: optionalNote,
  }),
]);

export function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message || "Some values are not valid.";
}

/** Shapes a request for the admin panel: the signed link, the exact message text, and a wa.me fallback. */
export function presentRequest(request: SupplierRequestRow, supplier: SupplierContact | undefined, events: unknown[]) {
  const kind: MessageKind = request.status === "cancelled" ? "cancelled"
    : request.payment_status === "sent" || request.payment_status === "disputed" ? "payment_sent"
    : request.status === "change_requested" ? "update" : "request";
  const message = supplier ? buildSupplierMessage(messageInputFor(request, supplier, kind)) : null;
  return {
    ...request,
    supplier: supplier ? { id: supplier.id, name: supplier.name, type: supplier.type, whatsapp: supplier.whatsapp || supplier.phone, email: supplier.email } : null,
    link: supplierRequestUrl(request.id),
    manual_message: message,
    manual_whatsapp_url: supplier && message ? manualWhatsAppLink(supplier, message) : null,
    events,
  };
}

export async function loadPresentedRequests(database: SupabaseClient, bookingId: string) {
  const { data: requests, error } = await database.from("supplier_booking_requests").select("*").eq("booking_id", bookingId).order("created_at", { ascending: false });
  if (error) throw error;
  const rows = (requests || []) as SupplierRequestRow[];
  const ids = rows.map((row) => row.id);
  const supplierIds = [...new Set(rows.map((row) => row.supplier_id))];
  const [events, suppliers] = await Promise.all([
    ids.length ? database.from("supplier_booking_request_events").select("id,request_id,event_type,actor,note,metadata,created_at").in("request_id", ids).order("created_at") : Promise.resolve({ data: [], error: null }),
    supplierIds.length ? database.from("suppliers").select(supplierColumns).in("id", supplierIds) : Promise.resolve({ data: [], error: null }),
  ]);
  if (events.error) throw events.error;
  if (suppliers.error) throw suppliers.error;
  const bySupplier = new Map(((suppliers.data || []) as SupplierContact[]).map((s) => [s.id, s]));
  const eventRows = (events.data || []) as { request_id: string }[];
  return rows.map((row) => presentRequest(row, bySupplier.get(row.supplier_id), eventRows.filter((event) => event.request_id === row.id)));
}

export function isMissingTable(error: unknown) {
  const code = (error as { code?: string } | null)?.code;
  return code === "42P01" || code === "PGRST205";
}
