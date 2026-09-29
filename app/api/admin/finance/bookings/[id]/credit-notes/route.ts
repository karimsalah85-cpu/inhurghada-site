import { NextRequest } from "next/server";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { financeAuthorization, financeDbError, financeJson, isUuid } from "@/lib/finance/api";
import { creditNoteIssueSchema, firstIssue } from "@/lib/finance/schemas";

/** Issues a credit note against money the guest paid on this booking (a non-cash refund). */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasValidRequestOrigin(request)) return financeJson({ error: "Invalid origin." }, 403);
  const { id } = await context.params;
  if (!isUuid(id)) return financeJson({ error: "Invalid booking." }, 400);
  const { supabase, user, allowed } = await financeAuthorization("manage_finance");
  if (!user) return financeJson({ error: "Sign in required." }, 401);
  if (!allowed) return financeJson({ error: "Finance management access required." }, 403);
  const parsed = creditNoteIssueSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return financeJson({ error: firstIssue(parsed.error) }, 400);
  const input = parsed.data;
  const { data, error } = await supabase.rpc("finance_issue_credit_note", {
    p_idempotency_key: input.idempotency_key, p_booking_id: id, p_amount: input.amount, p_issued_on: input.issued_on,
    p_reason: input.reason, p_expires_on: input.expires_on,
  });
  if (error) return financeDbError(error);
  return financeJson({ creditNote: data }, 201);
}
