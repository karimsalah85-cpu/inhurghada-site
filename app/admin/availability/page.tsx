import AdminPageFrame from "@/components/admin/AdminPageFrame";
import AvailabilityBulkEditor from "@/components/admin/AvailabilityBulkEditor";
import AvailabilityDateEditor from "@/components/admin/AvailabilityDateEditor";
import { requireAdminPage } from "@/lib/admin-page-auth";
import { availabilityTourOptions } from "@/lib/availability-tours";

export default async function AvailabilityPage() {
  const { supabase } = await requireAdminPage("operations");
  const options = await availabilityTourOptions(supabase);
  return <AdminPageFrame eyebrow="Catalog" title="Availability & pricing" description="Seats per departure, closed dates and prices for single dates. Dates without a record are open with unlimited places at the normal price.">
    <AvailabilityBulkEditor tours={options} />
    <div className="mt-8"><AvailabilityDateEditor tours={options} /></div>
  </AdminPageFrame>;
}
