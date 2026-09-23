import { NextRequest } from "next/server";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { financeAuthorization, financeDbError, financeJson, isUuid } from "@/lib/finance/api";
import { firstIssue, reverseEntrySchema } from "@/lib/finance/schemas";

/** Corrects a manual ledger entry by posting its reversal (entries are never edited). */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasValidRequestOrigin(request)) return financeJson({ error: "Invalid origin." }, 403);
  const { id } = await context.params;
  if (!isUuid(id)) return financeJson({ error: "Invalid entry." }, 400);
  const { supabase, user, allowed } = await financeAuthorization("manage_finance");
  if (!user) return financeJson({ error: "Sign in required." }, 401);
  if (!allowed) return financeJson({ error: "Finance management access required." }, 403);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const parsed = reverseEntrySchema.safeParse({ ...body, entry_id: id });
  if (!parsed.success) return financeJson({ error: firstIssue(parsed.error) }, 400);
  const { data, error } = await supabase.rpc("finance_reverse_supplier_entry", { p_entry_id: id, p_note: parsed.data.note });
  if (error) return financeDbError(error);
  return financeJson({ entry: data }, 201);
}
