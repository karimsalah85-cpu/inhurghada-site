import AdminPageFrame from "@/components/admin/AdminPageFrame";
import PickupZonesManager from "@/components/admin/PickupZonesManager";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function PickupZonesPage() {
  await requireAdminPage("operations");
  return <AdminPageFrame eyebrow="Dispatch & calendar" title="Hotels & pickup times" description="Group hotels into pickup zones and set a standard pickup time per zone for each tour. The pickup manifest and guest reminders use it whenever no pickup time is set on the booking's assignment.">
    <PickupZonesManager />
  </AdminPageFrame>;
}
