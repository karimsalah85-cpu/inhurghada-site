import { NextRequest, NextResponse } from "next/server";
import { getAdminAuthorization } from "@/lib/admin-permission";
import { hasValidRequestOrigin } from "@/lib/request-origin";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!uuidPattern.test(id)) return json({ error: "Invalid booking identifier." }, 400);
  const { supabase, allowed } = await getAdminAuthorization("view_bookings");
  if (!allowed) return json({ error: "Booking access required." }, 403);
  const { allowed: canViewCosts } = await getAdminAuthorization("view_expenses");
  const [bookingResult, expensesResult, assignmentsResult, staffResult, suppliersResult] = await Promise.all([
    supabase.from("bookings").select("*").eq("id", id).single(),
    canViewCosts ? supabase.from("expenses").select("*").eq("booking_id", id).order("expense_date", { ascending: false }) : Promise.resolve({ data: [] }),
    canViewCosts ? supabase.from("booking_assignments").select("*").eq("booking_id", id).neq("status", "cancelled") : Promise.resolve({ data: [] }),
    supabase.from("staff_members").select("id,name,staff_type,active").eq("active", true).in("staff_type", ["guide", "driver"]),
    supabase.from("suppliers").select("id,name,type").order("name"),
  ]);
  if (bookingResult.error) return json({ error: "Booking not found." }, 404);
  return json({ booking: bookingResult.data, expenses: expensesResult.data || [], assignments: assignmentsResult.data || [], staff: staffResult.data || [], suppliers: suppliersResult.data || [] });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  const { id } = await context.params;
  if (!uuidPattern.test(id)) return json({ error: "Invalid booking identifier." }, 400);
  const { supabase, user, allowed } = await getAdminAuthorization("edit_bookings");
  if (!allowed) return json({ error: "Booking-editing permission required." }, 403);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const assignmentType = String(body?.assignment_type || "");
  if (!["guide", "driver", "supplier"].includes(assignmentType)) return json({ error: "Invalid assignment type." }, 400);
  const targetField = assignmentType === "supplier" ? "supplier_id" : "staff_member_id";
  const targetId = String(body?.[targetField] || "");
  if (!uuidPattern.test(targetId)) return json({ error: "Choose a valid assignment." }, 400);
  const { data: before } = await supabase.from("booking_assignments").select("*").eq("booking_id", id).eq("assignment_type", assignmentType).neq("status", "cancelled").maybeSingle();
  const values = { booking_id: id, assignment_type: assignmentType, staff_member_id: assignmentType === "supplier" ? null : targetId, supplier_id: assignmentType === "supplier" ? targetId : null, status: "assigned", updated_at: new Date().toISOString() };
  const result = before ? await supabase.from("booking_assignments").update(values).eq("id", before.id).select().single() : await supabase.from("booking_assignments").insert(values).select().single();
  if (result.error) return json({ error: "Could not save this assignment." }, 500);
  await supabase.rpc("record_admin_audit", { action_name: before ? "update" : "create", resource_name: "booking_assignment", resource_identifier: result.data.id, summary_text: `Assigned ${assignmentType} to booking`, before_value: before, after_value: { ...result.data, actor: user?.email } });
  return json({ assignment: result.data });
}
