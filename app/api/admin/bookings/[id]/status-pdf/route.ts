import { NextResponse } from "next/server";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import { buildBookingStatusPdfAttachment } from "@/lib/booking-status-notification";
import { createClient } from "@/utils/supabase/server";
import { getCustomerVisibleAssignment } from "@/lib/booking-assignment";

export const runtime = "nodejs";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!uuidPattern.test(id)) return NextResponse.json({ error: "Invalid booking identifier." }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAuthorizedAdmin(user)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("reference,customer_name,customer_email,phone,tour_name,date,guests,hotel,status,payment_status,amount,currency")
    .eq("id", id)
    .single();
  if (error || !booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

  const assignment = await getCustomerVisibleAssignment(supabase, id);
  const attachment = await buildBookingStatusPdfAttachment({ ...booking, ...assignment });
  return new NextResponse(new Uint8Array(attachment.content), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${attachment.filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
