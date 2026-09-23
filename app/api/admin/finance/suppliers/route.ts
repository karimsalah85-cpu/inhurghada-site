import { financeAuthorization, financeDbError, financeJson } from "@/lib/finance/api";
import { supplierSummaries } from "@/lib/finance/supplier-data";

export async function GET() {
  const { supabase, user, allowed } = await financeAuthorization("view_finance");
  if (!user) return financeJson({ error: "Sign in required." }, 401);
  if (!allowed) return financeJson({ error: "Finance access required." }, 403);
  try {
    return financeJson({ configured: true, ...(await supplierSummaries(supabase)) });
  } catch (error) {
    return financeDbError(error);
  }
}
