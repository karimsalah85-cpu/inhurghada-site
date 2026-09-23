import type { SupabaseClient } from "@supabase/supabase-js";
import { syncTourDimensions } from "@/lib/finance/dimensions";
import { syncFxRates, type FxSyncResult } from "@/lib/finance/fx";

export type FinanceAutomationResult = {
  status: "ok" | "not_migrated" | "error";
  dimensions: number;
  fx: FxSyncResult | null;
  errors: string[];
};

const MISSING_RELATION = new Set(["42P01", "PGRST205", "PGRST202"]);

/**
 * Daily finance housekeeping run by the admin-automation cron. Any failure is
 * written to finance_sync_errors (shown in the finance admin) and reported as
 * status "error" so the cron responds non-2xx — never a silent failure.
 */
export async function runFinanceAutomation(supabase: SupabaseClient, options: Parameters<typeof syncFxRates>[1] = {}): Promise<FinanceAutomationResult> {
  const result: FinanceAutomationResult = { status: "ok", dimensions: 0, fx: null, errors: [] };
  try {
    result.dimensions = await syncTourDimensions(supabase);
  } catch (error) {
    if (MISSING_RELATION.has((error as { code?: string })?.code || "")) return { ...result, status: "not_migrated" };
    result.errors.push(`Tour dimensions: ${error instanceof Error ? error.message : String((error as { message?: string })?.message ?? error)}`);
  }
  result.fx = await syncFxRates(supabase, options);
  if (result.fx.status === "not_migrated") return { ...result, status: "not_migrated" };
  result.errors.push(...result.fx.errors);
  if (result.errors.length) {
    result.status = "error";
    const { error } = await supabase.from("finance_sync_errors").insert(result.errors.map((message) => ({ context: "daily_automation", message })));
    if (error) console.error("Could not record finance automation errors", error.message);
  }
  return result;
}
