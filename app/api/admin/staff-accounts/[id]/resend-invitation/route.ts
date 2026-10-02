import { NextRequest, NextResponse } from "next/server";
import { adminInvitationRedirectUrl, isPendingInvitation } from "@/lib/admin-invitations";
import { buildStaffInvitationEmail } from "@/lib/email/messages";
import { isAdminOwner } from "@/lib/admin-auth";
import { sendBookingEmail } from "@/lib/booking-service";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { createRequiredAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasValidRequestOrigin(request)) return NextResponse.json({ error: "Invalid origin." }, { status: 403 });

  const supabase = await createClient();
  const { data: { user: actor } } = await supabase.auth.getUser();
  if (!isAdminOwner(actor)) return NextResponse.json({ error: "Owner access required." }, { status: 403 });

  const { id } = await context.params;
  const admin = createRequiredAdminClient();
  const [{ data: profile, error: profileError }, { data: authData, error: authError }] = await Promise.all([
    admin.from("admin_profiles").select("id,email,display_name,role,active").eq("id", id).maybeSingle(),
    admin.auth.admin.getUserById(id),
  ]);

  if (profileError || authError || !profile || !authData.user) {
    return NextResponse.json({ error: "User account not found." }, { status: 404 });
  }
  if (profile.role === "owner") return NextResponse.json({ error: "Owner invitations cannot be resent." }, { status: 400 });
  if (!profile.active) return NextResponse.json({ error: "Reactivate this account before resending its invitation." }, { status: 400 });
  const linkType = isPendingInvitation(authData.user) ? "invite" : "recovery";

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: linkType,
    email: profile.email,
    options: { redirectTo: adminInvitationRedirectUrl },
  });
  const invitationUrl = linkData.properties?.action_link;
  if (linkError || !invitationUrl) {
    return NextResponse.json({ error: linkError?.message || "Could not create a new invitation link." }, { status: 502 });
  }

  const invitation = buildStaffInvitationEmail({ displayName: profile.display_name || profile.email, url: invitationUrl });
  const delivery = await sendBookingEmail(
    profile.email,
    invitation.subject,
    invitation.html,
    undefined,
    // Staff invitation links are personal credentials, not customer communication.
    { bcc: false },
  );
  if (!delivery.success) return NextResponse.json({ error: "The invitation email could not be sent. Check the email integration." }, { status: 502 });

  await admin.from("admin_audit_log").insert({
    actor_id: actor!.id,
    actor_email: actor!.email?.toLowerCase(),
    action: "resend_invitation",
    resource_type: "admin_user",
    resource_id: profile.id,
    summary: `Resent invitation to ${profile.email}`,
    after_data: { email: profile.email, role: profile.role, active: profile.active, link_type: linkType },
  });

  return NextResponse.json({ resent: true });
}
