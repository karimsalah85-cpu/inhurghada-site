import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { createClient } from "@/utils/supabase/server";

const expenseTypes = new Set(["google_ads", "subscriptions", "supplier_per_trip", "sales_commission", "fuel", "guide_fees", "boat_costs", "other"]);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAuthorizedAdmin(user)) return json({ error: "Unauthorized." }, 401);

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
  if (error) return json({ error: "Could not save the expense." }, 500);
  return json({ expense: data }, 201);
}
