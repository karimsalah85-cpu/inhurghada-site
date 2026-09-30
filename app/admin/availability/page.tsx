import AdminPageFrame from "@/components/admin/AdminPageFrame";
import AdminControlCenter from "@/components/admin/AdminControlCenter";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function AvailabilityPage() {
  await requireAdminPage("operations");
  return <AdminPageFrame eyebrow="Catalog" title="Availability & pricing" description="Seats per departure, blocked dates and date-specific prices. Dates without a record are open with unlimited places.">
    <AdminControlCenter only={["availability"]} title="Dates & capacity" description="Set a capacity to stop overbooking, block a date for weather or maintenance, or override the price for one date." />
  </AdminPageFrame>;
}
