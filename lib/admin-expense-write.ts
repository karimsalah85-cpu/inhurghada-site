import type { SupabaseClient } from "@supabase/supabase-js";
import type { FinanceCurrency } from "@/lib/finance/money";
import { expenseInputFromBody, firstIssue } from "@/lib/finance/schemas";

/** Built-in expense types. Admins can add more via the expense_types table. */
export const DEFAULT_EXPENSE_TYPES: { key: string; label: string }[] = [
  { key: "google_ads", label: "Google Ads" },
  { key: "subscriptions", label: "Subscriptions" },
  { key: "supplier_per_trip", label: "Supplier per trip" },
  { key: "sales_commission", label: "Sales person commission" },
  { key: "fuel", label: "Fuel" },
  { key: "guide_fees", label: "Guide fees" },
  { key: "boat_costs", label: "Boat costs" },
  { key: "other", label: "Other" },
];

export const expenseTypes = new Set(DEFAULT_EXPENSE_TYPES.map((type) => type.key));


export function expenseOptionsLabel(type: string) {
  return DEFAULT_EXPENSE_TYPES.find((entry) => entry.key === type)?.label || "Other";
}

/** Turns a free-typed label into a stable expense_type key. */
export function slugifyExpenseType(label: string): string {
  return String(label || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

/**
 * The set of expense_type keys accepted for a write: the admin-editable table,
 * or the built-in defaults when the table is missing / unreadable.
 */
export async function loadExpenseTypeKeys(supabase: SupabaseClient): Promise<Set<string>> {
  const { data, error } = await supabase.from("expense_types").select("key");
  if (error || !data?.length) return new Set(expenseTypes);
  return new Set(data.map((row) => String(row.key)));
}

export type NormalizedExpense = {
  description: string;
  category: string;
  date: string;
  /** Canonical decimal string ("120.50"); never a float. */
  amount: string;
  currency: FinanceCurrency;
  expenseType: string;
  supplierId: string | null;
  salesPersonId: string | null;
  bookingId: string | null;
  vendor: string | null;
  invoiceNumber: string | null;
};

/**
 * Validates a raw expense payload (manual form, reviewed invoice, or edit)
 * with the shared finance schema. Returns `{ error }` with an HTTP status when
 * the payload is unusable. Unknown expense types fall back to "other".
 */
export function normalizeExpensePayload(
  body: Record<string, unknown> | null,
  allowedTypes: Set<string> = expenseTypes,
): { value: NormalizedExpense } | { error: string; status: number } {
  const parsed = expenseInputFromBody(body);
  if (!parsed.success) return { error: firstIssue(parsed.error), status: 400 };
  const input = parsed.data;
  return {
    value: {
      description: input.description,
      category: input.category || "",
      date: input.date,
      amount: input.amount,
      currency: input.currency,
      expenseType: allowedTypes.has(input.expense_type) ? input.expense_type : "other",
      supplierId: input.supplier_id,
      salesPersonId: input.sales_person_id,
      bookingId: input.booking_id,
      vendor: input.vendor,
      invoiceNumber: input.invoice_number,
    },
  };
}

type ExpenseRow = Record<string, unknown> & { id: string };

/**
 * Inserts a normalized expense, transparently falling back to the pre-migration
 * column set when the admin database migration has not been applied yet.
 */
export async function insertExpense(
  supabase: SupabaseClient,
  value: NormalizedExpense,
): Promise<{ expense: ExpenseRow; warning?: string } | { error: string; status: number }> {
  const { description, amount, currency, date, category, expenseType, supplierId, salesPersonId, bookingId, vendor, invoiceNumber } = value;

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      description,
      amount,
      currency,
      expense_date: date,
      category: category || null,
      expense_type: expenseType,
      supplier_id: supplierId,
      sales_person_id: salesPersonId,
      booking_id: bookingId,
      // Finance columns are only sent when used, so saves keep working before the finance migration.
      ...(vendor ? { vendor } : {}),
      ...(invoiceNumber ? { invoice_number: invoiceNumber } : {}),
    })
    .select()
    .single();

  if (error?.code === "23505") {
    return { error: "An expense with this vendor and invoice number is already recorded.", status: 409 };
  }
  if (
    error &&
    ["42703", "PGRST204"].includes(error.code) &&
    !["supplier_per_trip", "sales_commission"].includes(expenseType)
  ) {
    const legacy = await supabase
      .from("expenses")
      .insert({
        description,
        amount,
        currency,
        expense_date: date,
        category: category || expenseOptionsLabel(expenseType),
      })
      .select()
      .single();
    if (!legacy.error) {
      return {
        expense: legacy.data as ExpenseRow,
        warning: "Saved without the new expense classification because the admin database migration is pending.",
      };
    }
  }
  if (error && ["42703", "PGRST204", "PGRST205"].includes(error.code)) {
    return {
      error: "The admin database migration is required before this expense type can be saved.",
      status: 503,
    };
  }
  if (error) {
    console.error("Admin expense save failed", { code: error.code, message: error.message });
    return {
      error: "Could not save the expense. Please check the amount, date, and selected contact.",
      status: 500,
    };
  }

  return { expense: data as ExpenseRow };
}
