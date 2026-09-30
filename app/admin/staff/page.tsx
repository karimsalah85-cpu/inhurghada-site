import AdminPageFrame from "@/components/admin/AdminPageFrame";
import AdminControlCenter from "@/components/admin/AdminControlCenter";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function StaffPage() {
  await requireAdminPage("operations");
  return <AdminPageFrame eyebrow="Partners & team" title="Guides & staff" description="Guides, drivers, crew and operations staff you assign to bookings. Each active person can get a check-in PIN for scanning guest tickets. Admin login accounts are separate, under Users & system.">
    <AdminControlCenter only={["staff"]} title="Staff roster" description="Add people once, then assign them to bookings under Dispatch & calendar." />
  </AdminPageFrame>;
}
