import type { SupabaseClient } from "@supabase/supabase-js";

export const expenseTypes = new Set([
  "google_ads",
  "subscriptions",
  "supplier_per_trip",
  "sales_commission",
  "fuel",
  "guide_fees",
  "boat_costs",
  "other",
]);

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function expenseOptionsLabel(type: string) {
  return (
    ({
      google_ads: "Google Ads",
      subscriptions: "Subscriptions",
      supplier_per_trip: "Supplier per trip",
      sales_commission: "Sales person commission",
      fuel: "Fuel",
      guide_fees: "Guide fees",
      boat_costs: "Boat costs",
      other: "Other",
    }) as Record<string, string>
  )[type] || "Other";
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
): { value: NormalizedExpense } | { error: string; status: number } {
  const description = String(body?.description || "").trim().slice(0, 200);
  const category = String(body?.category || "").trim().slice(0, 80);
  const date = String(body?.date || body?.expense_date || "").trim();
  const amount = Number(body?.amount);
  const currency = /^[A-Z]{3}$/.test(String(body?.currency || "USD").toUpperCase())
    ? String(body?.currency || "USD").toUpperCase()
    : "USD";
  const expenseType = expenseTypes.has(String(body?.expense_type)) ? String(body?.expense_type) : "other";
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
