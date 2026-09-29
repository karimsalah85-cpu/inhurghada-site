import { NextRequest } from "next/server";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { financeAuthorization, financeDbError, financeJson, isUuid } from "@/lib/finance/api";
import { creditNoteRedeemSchema, firstIssue } from "@/lib/finance/schemas";

/** Uses (part of) a credit note to pay for this booking. */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasValidRequestOrigin(request)) return financeJson({ error: "Invalid origin." }, 403);
  const { id } = await context.params;
  if (!isUuid(id)) return financeJson({ error: "Invalid booking." }, 400);
  const { supabase, user, allowed } = await financeAuthorization("manage_finance");
  if (!user) return financeJson({ error: "Sign in required." }, 401);
  if (!allowed) return financeJson({ error: "Finance management access required." }, 403);
  const parsed = creditNoteRedeemSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return financeJson({ error: firstIssue(parsed.error) }, 400);
  const input = parsed.data;
  const lookup = isUuid(input.credit_note)
    ? supabase.from("credit_notes").select("id").eq("id", input.credit_note).maybeSingle()
    : supabase.from("credit_notes").select("id").eq("number", input.credit_note.toUpperCase()).maybeSingle();
  const { data: note, error: lookupError } = await lookup;
  if (lookupError) return financeDbError(lookupError);
  if (!note) return financeJson({ error: `Credit note ${input.credit_note} was not found.` }, 404);
  const { data, error } = await supabase.rpc("finance_redeem_credit_note", {
    p_idempotency_key: input.idempotency_key, p_credit_note_id: note.id, p_booking_id: id, p_amount: input.amount,
    p_paid_on: input.paid_on, p_applied_amount: input.applied_amount,
  });
  if (error) return financeDbError(error);
  return financeJson({ entry: data }, 201);
}
