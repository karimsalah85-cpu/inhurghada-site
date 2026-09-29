import { NextRequest } from "next/server";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { financeAuthorization, financeDbError, financeJson, isUuid } from "@/lib/finance/api";
import { firstIssue, guestReversalSchema } from "@/lib/finance/schemas";

/** Reverses a guest payment, refund or credit note entry (nothing is edited or deleted). */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasValidRequestOrigin(request)) return financeJson({ error: "Invalid origin." }, 403);
  const { id } = await context.params;
  if (!isUuid(id)) return financeJson({ error: "Invalid payment entry." }, 400);
  const { supabase, user, allowed } = await financeAuthorization("manage_finance");
  if (!user) return financeJson({ error: "Sign in required." }, 401);
  if (!allowed) return financeJson({ error: "Finance management access required." }, 403);
  const parsed = guestReversalSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return financeJson({ error: firstIssue(parsed.error) }, 400);
  const { data, error } = await supabase.rpc("finance_reverse_guest_payment", { p_entry_id: id, p_note: parsed.data.note });
  if (error) return financeDbError(error);
  return financeJson({ entry: data }, 201);
}
