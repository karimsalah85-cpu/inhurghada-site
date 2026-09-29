import { NextRequest } from "next/server";
import { financeAuthorization, financeDbError, financeJson } from "@/lib/finance/api";
import { isoDateSchema } from "@/lib/finance/schemas";

/** Monthly cancellation impact by reason (USD, by trip date). ?from=YYYY-MM-DD&to=YYYY-MM-DD */
export async function GET(request: NextRequest) {
  const { supabase, user, allowed } = await financeAuthorization("view_finance");
  if (!user) return financeJson({ error: "Sign in required." }, 401);
  if (!allowed) return financeJson({ error: "Finance access required." }, 403);
  const params = request.nextUrl.searchParams;
  const year = new Date().getUTCFullYear();
  const from = isoDateSchema.safeParse(params.get("from") ?? `${year}-01-01`);
  const to = isoDateSchema.safeParse(params.get("to") ?? `${year}-12-31`);
  if (!from.success || !to.success || from.data > to.data) return financeJson({ error: "Choose a valid date range." }, 400);
  const { data, error } = await supabase.from("finance_cancellation_impact").select("*")
    .gte("month", `${from.data.slice(0, 7)}-01`).lte("month", to.data).order("month").order("reason");
  if (error) return financeDbError(error);
  return financeJson({ from: from.data, to: to.data, rows: data });
}
