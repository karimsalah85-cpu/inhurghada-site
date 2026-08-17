import { NextRequest, NextResponse } from "next/server";
import { hasLivePermission } from "@/lib/admin-permission";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { createClient } from "@/utils/supabase/server";

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

async function authorized() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user, allowed: await hasLivePermission(supabase, user, "operations") };
}

export async function GET() {
  const { supabase, allowed } = await authorized();
  if (!allowed) return json({ error: "Unauthorized" }, 401);
  const results = await Promise.all([
    supabase.from("tour_availability").select("*").order("service_date").limit(500),
    supabase.from("booking_assignments").select("*").order("pickup_time").limit(500),
    supabase.from("bookings").select("id,reference,customer_name,customer_email,phone,tour_name,tour_slug,date,guests,adults,youth,infants,amount,currency,status,payment_status,created_at").order("date").limit(1000),
    supabase.from("admin_customer_summary").select("*").order("last_booking_at", { ascending: false }).limit(500),
    supabase.from("customer_profiles").select("*").limit(500),
    supabase.from("suppliers").select("*").order("name"),
    supabase.from("supplier_prices").select("*").order("valid_from", { ascending: false }).limit(500),
    supabase.from("supplier_payments").select("*").order("due_date").limit(500),
    supabase.from("expenses").select("id,booking_id,amount,currency,expense_date,expense_type,supplier_id,external_reference").limit(2000),
    supabase.from("communication_messages").select("*").order("occurred_at", { ascending: false }).limit(500),
    supabase.from("seo_checks").select("*").order("checked_at", { ascending: false }).limit(200),
    supabase.from("backup_checks").select("*").order("checked_at", { ascending: false }).limit(50),
  ]);
  const migrationError = results.find((result) => result.error && ["42P01", "42703", "PGRST205"].includes(result.error.code || ""))?.error;
  if (migrationError) return json({ configured: false, migration: "202608010002_complete_admin_operations.sql" });
  const error = results.find((result) => result.error)?.error;
  if (error) return json({ error: error.message }, 500);
  const [availability, assignments, bookings, customers, profiles, suppliers, supplierPrices, supplierPayments, expenses, messages, seo, backups] = results.map((result) => result.data || []);
  const expenseByBooking = new Map<string, number>();
  for (const expense of expenses) if (expense.booking_id) expenseByBooking.set(expense.booking_id, (expenseByBooking.get(expense.booking_id) || 0) + Number(expense.amount || 0));
  const assignmentByBooking = new Map<string, number>();
  for (const assignment of assignments) assignmentByBooking.set(assignment.booking_id, (assignmentByBooking.get(assignment.booking_id) || 0) + Number(assignment.internal_cost || 0));
  const bookingProfit = bookings.map((booking) => ({ id: booking.id, reference: booking.reference, tour: booking.tour_name || "Transfer", month: (booking.date || booking.created_at).slice(0, 7), currency: booking.currency, revenue: booking.status === "cancelled" || booking.payment_status === "refunded" ? 0 : Number(booking.amount || 0), costs: (expenseByBooking.get(booking.id) || 0) + (assignmentByBooking.get(booking.id) || 0) })).map((item) => ({ ...item, profit: item.revenue - item.costs }));
  const summarize = (key: "tour" | "month") => Object.values(bookingProfit.reduce<Record<string, { label: string; revenue: number; costs: number; profit: number }>>((totals, item) => { const label = item[key]; totals[label] ||= { label, revenue: 0, costs: 0, profit: 0 }; totals[label].revenue += item.revenue; totals[label].costs += item.costs; totals[label].profit += item.profit; return totals; }, {}));
  const bookingMap = new Map(bookings.map((booking) => [booking.id, booking]));
  const supplierPerformance = suppliers.map((supplier) => { const work = assignments.filter((assignment) => assignment.supplier_id === supplier.id); const linked = work.map((assignment) => bookingMap.get(assignment.booking_id)).filter(Boolean); return { supplier_id: supplier.id, assigned: work.length, completed: work.filter((assignment) => assignment.status === "completed").length, cancelled: linked.filter((booking) => booking?.status === "cancelled").length, completion_rate: work.length ? work.filter((assignment) => assignment.status === "completed").length / work.length * 100 : 0 }; });
  return json({ configured: true, availability, assignments, bookings, customers, profiles, suppliers, supplierPrices, supplierPayments, supplierPerformance, expenses, messages, seo, backups, bookingProfit, profitByTour: summarize("tour"), profitByMonth: summarize("month") });
}

export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin" }, 403);
  const { supabase, user, allowed } = await authorized();
  if (!allowed) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const action = String(body?.action || "");
  let table = ""; let record: Record<string, unknown> = {};
  if (action === "supplier_price") { table = "supplier_prices"; record = { supplier_id: body?.supplier_id, tour_slug: body?.tour_slug, adult_cost: Number(body?.adult_cost), youth_cost: body?.youth_cost === "" ? null : Number(body?.youth_cost), fixed_cost: body?.fixed_cost === "" ? null : Number(body?.fixed_cost), currency: String(body?.currency || "USD").toUpperCase(), valid_from: body?.valid_from || null, valid_to: body?.valid_to || null, notes: body?.notes || null }; }
  else if (action === "supplier_payment") { table = "supplier_payments"; record = { supplier_id: body?.supplier_id, booking_id: body?.booking_id || null, amount: Number(body?.amount), currency: String(body?.currency || "USD").toUpperCase(), status: body?.status || "owed", due_date: body?.due_date || null, paid_at: body?.status === "paid" ? new Date().toISOString() : null, reference: body?.reference || null, notes: body?.notes || null }; }
  else if (action === "customer_profile") { table = "customer_profiles"; record = { customer_key: body?.customer_key, name: body?.name || null, email: body?.email || null, phone: body?.phone || null, preferred_language: body?.preferred_language || "en", preferences: body?.preferences || null, tags: String(body?.tags || "").split(",").map((item) => item.trim()).filter(Boolean), updated_at: new Date().toISOString() }; }
  else if (action === "message") { table = "communication_messages"; record = { booking_id: body?.booking_id || null, customer_key: body?.customer_key || null, channel: body?.channel, direction: body?.direction || "outbound", recipient: body?.recipient || null, sender: user?.email || null, subject: body?.subject || null, body: body?.message, delivery_status: "recorded" }; }
  else if (action === "backup_check") { table = "backup_checks"; record = { backup_type: "supabase", status: body?.status || "warning", backup_created_at: body?.backup_created_at || null, restore_verified_at: body?.restore_verified_at || null, summary: body?.summary || "Manual backup verification", details: { recorded_by: user?.email } }; }
  else if (action === "supplier_update") {
    const id = String(body?.supplier_id || "");
    const { data, error } = await supabase.from("suppliers").update({ emergency_contact_name: body?.emergency_contact_name || null, emergency_contact_phone: body?.emergency_contact_phone || null, contract_url: body?.contract_url || null, default_currency: String(body?.currency || "USD").toUpperCase(), active: body?.active !== false }).eq("id", id).select().single();
    if (error) return json({ error: error.message }, 400);
    await supabase.rpc("record_admin_audit", { action_name: "update", resource_name: "supplier", resource_identifier: id, summary_text: "Updated supplier operations profile", after_value: data });
    return json({ record: data });
  }
  else return json({ error: "Unknown operation" }, 400);
  const query = action === "customer_profile" ? supabase.from(table).upsert(record, { onConflict: "customer_key" }).select().single() : supabase.from(table).insert(record).select().single();
  const { data, error } = await query;
  if (error) return json({ error: error.message }, 400);
  await supabase.rpc("record_admin_audit", { action_name: "create", resource_name: action, resource_identifier: String((data as { id?: string }).id || body?.customer_key || ""), summary_text: `Created ${action}` });
  return json({ record: data }, 201);
}
