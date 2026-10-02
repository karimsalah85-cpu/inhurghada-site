import { NextRequest } from "next/server";
import { z } from "zod";
import { financeAuthorization, financeDbError, financeJson, isUuid } from "@/lib/finance/api";
import { commissionInvoiceSchema } from "@/lib/finance/commission-invoice";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { createRequiredAdminClient } from "@/utils/supabase/admin";
import { loadMonthlyCommission } from "@/lib/finance/monthly-commission-data";
import { assertCurrentCommission, withTicketPrices } from "@/lib/finance/monthly-commission";

type Context = { params: Promise<{ id: string }> };
export async function GET(_request: NextRequest, context: Context) {
  const { id } = await context.params;
  if (!isUuid(id)) return financeJson({ error: "Invalid supplier." }, 400);
  const { supabase, user, allowed } = await financeAuthorization("view_finance");
  if (!user) return financeJson({ error: "Sign in required." }, 401);
  if (!allowed) return financeJson({ error: "Finance access required." }, 403);
  const { data, error } = await supabase.from("supplier_commission_invoices").select("*").eq("supplier_id", id).order("created_at", { ascending: false }).limit(100);
  return error ? financeDbError(error) : financeJson({ invoices: data });
}
export async function POST(request: NextRequest, context: Context) {
  if (!hasValidRequestOrigin(request)) return financeJson({ error: "Invalid origin." }, 403);
  const { id } = await context.params;
  if (!isUuid(id)) return financeJson({ error: "Invalid supplier." }, 400);
  const { supabase, user, allowed } = await financeAuthorization("manage_finance");
  if (!user) return financeJson({ error: "Sign in required." }, 401);
  if (!allowed) return financeJson({ error: "Finance management access required." }, 403);
  const parsed = z.object({ id: z.string().uuid(), document: commissionInvoiceSchema }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return financeJson({ error: parsed.error.issues[0].message }, 400);
  try {
    const { data: supplier, error: supplierError } = await supabase.from("suppliers").select("id").eq("id", id).maybeSingle();
    if (supplierError) return financeDbError(supplierError);
    if (!supplier) return financeJson({ error: "Supplier not found." }, 404);
    const db = createRequiredAdminClient();
    // Stable client-generated UUID makes a retried create safe without overwriting a saved snapshot.
    const existing = await db.from("supplier_commission_invoices").select("*").eq("id", parsed.data.id).maybeSingle();
    if (existing.error) return financeDbError(existing.error);
    if (existing.data) return existing.data.supplier_id === id ? financeJson({ invoice: existing.data }) : financeJson({ error: "Invoice ID is already in use." }, 409);
    const current = await loadMonthlyCommission(supabase, id, parsed.data.document.period, parsed.data.document.currency);
    assertCurrentCommission(parsed.data.document, current);
    const document = { ...withTicketPrices(current, parsed.data.document), notes: parsed.data.document.notes };
    const { data, error } = await db.from("supplier_commission_invoices").insert({ id: parsed.data.id, supplier_id: id, document, created_by: user.id }).select().single();
    return error ? financeDbError(error) : financeJson({ invoice: data }, 201);
  } catch (error) { return financeDbError(error); }
}
