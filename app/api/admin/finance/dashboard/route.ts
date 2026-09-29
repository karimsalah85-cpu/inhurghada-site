import { NextRequest } from "next/server";
import { financeAuthorization, financeDbError, financeJson } from "@/lib/finance/api";
import { financeDashboard } from "@/lib/finance/dashboard";
import { isoDateSchema } from "@/lib/finance/schemas";

/** Reports dashboard (USD): P&L, cash in vs out, partner balances, revenue by tour and location, cancellations, VAT. */
export async function GET(request: NextRequest) {
  const { supabase, user, allowed } = await financeAuthorization("view_finance");
  if (!user) return financeJson({ error: "Sign in required." }, 401);
  if (!allowed) return financeJson({ error: "Finance access required." }, 403);
  const params = request.nextUrl.searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const from = isoDateSchema.safeParse(params.get("from") ?? `${today.slice(0, 7)}-01`);
  const to = isoDateSchema.safeParse(params.get("to") ?? today);
  if (!from.success || !to.success || from.data > to.data) return financeJson({ error: "Choose a valid date range." }, 400);
  try {
    return financeJson({ configured: true, ...(await financeDashboard(supabase, { from: from.data, to: to.data })) });
  } catch (error) {
    return financeDbError(error);
  }
}
