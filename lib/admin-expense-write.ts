import type { SupabaseClient } from "@supabase/supabase-js";

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

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  amount: number;
  currency: string;
  expenseType: string;
  supplierId: string | null;
  salesPersonId: string | null;
  bookingId: string | null;
};

/**
 * Validates a raw expense payload (from the manual form or a reviewed invoice).
 * Returns `{ error }` with an HTTP status when the payload is unusable.
 */
export function normalizeExpensePayload(
  body: Record<string, unknown> | null,
  allowedTypes: Set<string> = expenseTypes,
): { value: NormalizedExpense } | { error: string; status: number } {
  const description = String(body?.description || "").trim().slice(0, 200);
  const category = String(body?.category || "").trim().slice(0, 80);
  const date = String(body?.date || body?.expense_date || "").trim();
  const amount = Number(body?.amount);
  const currency = /^[A-Z]{3}$/.test(String(body?.currency || "USD").toUpperCase())
    ? String(body?.currency || "USD").toUpperCase()
    : "USD";
  const expenseType = allowedTypes.has(String(body?.expense_type)) ? String(body?.expense_type) : "other";
  const supplierId =
    typeof body?.supplier_id === "string" && uuidPattern.test(body.supplier_id) ? body.supplier_id : null;
  const salesPersonId =
    typeof body?.sales_person_id === "string" && uuidPattern.test(body.sales_person_id) ? body.sales_person_id : null;
  const bookingId =
    typeof body?.booking_id === "string" && uuidPattern.test(body.booking_id) ? body.booking_id : null;

  if (
    description.length < 2 ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > 1_000_000 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    return { error: "Enter a description, positive amount, and valid date.", status: 400 };
  }
  if (expenseType === "supplier_per_trip" && !supplierId) {
    return { error: "Choose a supplier for this trip expense.", status: 400 };
  }
  if (expenseType === "sales_commission" && !salesPersonId) {
    return { error: "Choose a sales person for this commission.", status: 400 };
  }

  return {
    value: { description, category, date, amount, currency, expenseType, supplierId, salesPersonId, bookingId },
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
  const { description, amount, currency, date, category, expenseType, supplierId, salesPersonId, bookingId } = value;

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
    })
    .select()
    .single();

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
        currency: "USD",
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
