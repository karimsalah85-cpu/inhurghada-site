import { NextRequest } from "next/server";
import { financeAuthorization, financeDbError, financeJson, isUuid } from "@/lib/finance/api";
import { monthlyCommissionSchema } from "@/lib/finance/monthly-commission";
import { loadMonthlyCommission } from "@/lib/finance/monthly-commission-data";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!isUuid(id)) return financeJson({ error: "Invalid supplier." }, 400);
  const { supabase, user, allowed } = await financeAuthorization("view_finance");
  if (!user) return financeJson({ error: "Sign in required." }, 401);
  if (!allowed) return financeJson({ error: "Finance access required." }, 403);
  const parsed = monthlyCommissionSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return financeJson({ error: "Choose a valid month and currency." }, 400);
  try { return financeJson({ document: await loadMonthlyCommission(supabase, id, parsed.data.period, parsed.data.currency) }); }
  catch (error) { return financeDbError(error); }
}
