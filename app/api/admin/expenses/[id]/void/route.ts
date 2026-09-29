import { NextRequest, NextResponse } from "next/server";
import { getAdminAuthorization } from "@/lib/admin-permission";
import { hasValidRequestOrigin } from "@/lib/request-origin";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

/** Voids an expense: it stays on record (and in the audit log) but drops out of every total. */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  const { id } = await context.params;
  if (!uuidPattern.test(id)) return json({ error: "Invalid expense identifier." }, 400);
  const { supabase, allowed } = await getAdminAuthorization("manage_finance");
  if (!allowed) return json({ error: "Finance permission required." }, 403);
  const body = await request.json().catch(() => null) as { reason?: unknown } | null;
  const reason = String(body?.reason ?? "").trim().slice(0, 500);
  if (reason.length < 3) return json({ error: "Enter a reason for voiding this expense." }, 400);
  const { data, error } = await supabase.rpc("finance_void_expense", { p_expense_id: id, p_reason: reason });
  if (error?.code === "P0002") return json({ error: "Expense not found or already voided." }, 404);
  if (error) return json({ error: "Could not void the expense." }, 500);
  return json({ expense: data });
}
