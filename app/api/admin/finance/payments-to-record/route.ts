import { financeAuthorization, financeDbError, financeJson } from "@/lib/finance/api";

/** Bookings Daily Red Sea collects that are marked paid (or whose trip has happened) with no guest payment recorded. */
export async function GET() {
  const { supabase, user, allowed } = await financeAuthorization("view_finance");
  if (!user) return financeJson({ error: "Sign in required." }, 401);
  if (!allowed) return financeJson({ error: "Finance access required." }, 403);
  const { data, error } = await supabase.from("finance_payments_to_record").select("*")
    .order("trip_date", { ascending: false, nullsFirst: false }).order("reference").limit(500);
  if (error) return financeDbError(error);
  const { allowed: canManage } = await financeAuthorization("manage_finance");
  return financeJson({ rows: data, canManage });
}
