import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";


export type CustomerVisibleAssignment = {
  assignedPersonName?: string;
  assignedPersonRole?: "guide" | "driver";
};

/** Deliberately returns only fields approved for customer-facing output. */
export async function getCustomerVisibleAssignment(database: SupabaseClient, bookingId: string): Promise<CustomerVisibleAssignment> {
  const { data: assignment } = await database.from("booking_assignments")
    .select("staff_member_id,assignment_type").eq("booking_id", bookingId)
    .in("assignment_type", ["guide", "driver"]).neq("status", "cancelled")
    .order("updated_at", { ascending: false }).limit(1).maybeSingle();
  if (!assignment?.staff_member_id) return {};
  const { data: staff } = await database.from("staff_members").select("name")
    .eq("id", assignment.staff_member_id).eq("active", true).maybeSingle();
  if (!staff?.name) return {};
  return { assignedPersonName: String(staff.name), assignedPersonRole: assignment.assignment_type };
}
