import { NextRequest, NextResponse } from "next/server";
import { getAdminAuthorization } from "@/lib/admin-permission";
import { hasValidRequestOrigin } from "@/lib/request-origin";

const expenseTypes = new Set(["google_ads", "subscriptions", "supplier_per_trip", "sales_commission", "fuel", "guide_fees", "boat_costs", "other"]);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  const { supabase, allowed } = await getAdminAuthorization("edit_expenses");
  if (!allowed) return json({ error: "Expense-editing permission required." }, 403);

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const description = String(body?.description || "").trim().slice(0, 200);
  const category = String(body?.category || "").trim().slice(0, 80);
  const date = String(body?.date || "").trim();
  const amount = Number(body?.amount);
  const expenseType = expenseTypes.has(String(body?.expense_type)) ? String(body?.expense_type) : "other";
  const supplierId = typeof body?.supplier_id === "string" && uuidPattern.test(body.supplier_id) ? body.supplier_id : null;
  const salesPersonId = typeof body?.sales_person_id === "string" && uuidPattern.test(body.sales_person_id) ? body.sales_person_id : null;
  const bookingId = typeof body?.booking_id === "string" && uuidPattern.test(body.booking_id) ? body.booking_id : null;
  if (description.length < 2 || !Number.isFinite(amount) || amount <= 0 || amount > 1_000_000 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return json({ error: "Enter a description, positive amount, and valid date." }, 400);
  }
  if (expenseType === "supplier_per_trip" && !supplierId) return json({ error: "Choose a supplier for this trip expense." }, 400);
  if (expenseType === "sales_commission" && !salesPersonId) return json({ error: "Choose a sales person for this commission." }, 400);

  const { data, error } = await supabase.from("expenses").insert({
    description, amount, currency: "USD", expense_date: date, category: category || null,
    expense_type: expenseType, supplier_id: supplierId, sales_person_id: salesPersonId, booking_id: bookingId,
  }).select().single();
  if (error && ["42703", "PGRST204"].includes(error.code) && !["supplier_per_trip", "sales_commission"].includes(expenseType)) {
    const legacy = await supabase.from("expenses").insert({
      description, amount, currency: "USD", expense_date: date,
      category: category || expenseOptionsLabel(expenseType),
    }).select().single();
    if (!legacy.error) return json({ expense: legacy.data, warning: "Saved without the new expense classification because the admin database migration is pending." }, 201);
  }
  if (error && ["42703", "PGRST204", "PGRST205"].includes(error.code)) {
    return json({ error: "The admin database migration is required before this expense type can be saved." }, 503);
  }
  if (error) {
    console.error("Admin expense save failed", { code: error.code, message: error.message });
    return json({ error: "Could not save the expense. Please check the amount, date, and selected contact." }, 500);
  }
  return json({ expense: data }, 201);
}

function expenseOptionsLabel(type: string) {
  return ({
    google_ads: "Google Ads",
    subscriptions: "Subscriptions",
    fuel: "Fuel",
    guide_fees: "Guide fees",
    boat_costs: "Boat costs",
    other: "Other",
  } as Record<string, string>)[type] || "Other";
}
