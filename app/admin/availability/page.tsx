import AdminPageFrame from "@/components/admin/AdminPageFrame";
import AdminControlCenter from "@/components/admin/AdminControlCenter";
import AvailabilityBulkEditor from "@/components/admin/AvailabilityBulkEditor";
import { requireAdminPage } from "@/lib/admin-page-auth";
import { tours } from "@/data/tours";

export default async function AvailabilityPage() {
  await requireAdminPage("operations");
  const options = tours
    .filter((tour) => tour.category !== "Airport Transfer" && tour.category !== "Shopping Transfer")
    .map((tour) => ({ slug: tour.slug, title: tour.title, category: tour.category || "Other", destination: tour.destinationSlug || "" }))
    .sort((a, b) => a.title.localeCompare(b.title));
  return <AdminPageFrame eyebrow="Catalog" title="Availability & pricing" description="Seats per departure, blocked dates and date-specific prices. Dates without a record are open with unlimited places.">
    <AvailabilityBulkEditor tours={options} />
    <div className="mt-8"><AdminControlCenter only={["availability"]} title="Individual dates" description="Edit one date: capacity, block, start time or a price override for that day." /></div>
  </AdminPageFrame>;
}
