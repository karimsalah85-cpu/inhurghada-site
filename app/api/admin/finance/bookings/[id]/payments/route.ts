import { NextRequest } from "next/server";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { financeAuthorization, financeDbError, financeJson, isUuid } from "@/lib/finance/api";
import { firstIssue, guestPaymentSchema } from "@/lib/finance/schemas";

/** Payment history for one booking: summary, every entry, credit notes issued from it, and its cancellation. */
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!isUuid(id)) return financeJson({ error: "Invalid booking." }, 400);
  const { supabase, user, allowed } = await financeAuthorization("view_finance");
  if (!user) return financeJson({ error: "Sign in required." }, 401);
  if (!allowed) return financeJson({ error: "Finance access required." }, 403);
  const [summary, entries, creditNotes, booking] = await Promise.all([
    supabase.from("booking_payment_summary").select("*").eq("booking_id", id).maybeSingle(),
    supabase.from("guest_payments").select("*").eq("booking_id", id).order("entry_no"),
    supabase.from("credit_note_balances").select("*").eq("booking_id", id).order("created_at"),
    supabase.from("bookings").select("status,cancellation_reason,cancellation_note,cancelled_at").eq("id", id).maybeSingle(),
  ]);
  const error = summary.error || entries.error || creditNotes.error || booking.error;
  if (error) return financeDbError(error);
  if (!summary.data || !booking.data) return financeJson({ error: "Booking not found." }, 404);
  const { allowed: canManage } = await financeAuthorization("manage_finance");
  return financeJson({ summary: summary.data, entries: entries.data, creditNotes: creditNotes.data, cancellation: booking.data, canManage });
}

/** Records a deposit, balance payment or refund. */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasValidRequestOrigin(request)) return financeJson({ error: "Invalid origin." }, 403);
  const { id } = await context.params;
  if (!isUuid(id)) return financeJson({ error: "Invalid booking." }, 400);
  const { supabase, user, allowed } = await financeAuthorization("manage_finance");
  if (!user) return financeJson({ error: "Sign in required." }, 401);
  if (!allowed) return financeJson({ error: "Finance management access required." }, 403);
  const parsed = guestPaymentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return financeJson({ error: firstIssue(parsed.error) }, 400);
  const input = parsed.data;
  const { data, error } = await supabase.rpc("finance_record_guest_payment", {
    p_idempotency_key: input.idempotency_key, p_booking_id: id, p_kind: input.kind, p_amount: input.amount, p_currency: input.currency,
    p_method: input.method, p_paid_on: input.paid_on, p_applied_amount: input.applied_amount, p_reference: input.reference, p_note: input.note,
  });
  if (error) return financeDbError(error);
  return financeJson({ entry: data }, 201);
}
