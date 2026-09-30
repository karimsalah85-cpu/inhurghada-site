import { Suspense } from "react";
import AdminPageFrame from "@/components/admin/AdminPageFrame";
import AdminControlCenter from "@/components/admin/AdminControlCenter";
import AdminOperationsCenter from "@/components/admin/AdminOperationsCenter";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function CustomersPage() {
  await requireAdminPage("operations");
  return <AdminPageFrame eyebrow="Bookings" title="Customers" description="Every guest who has booked, with booking count, spend and repeat status, plus your private notes about them.">
    <Suspense><AdminOperationsCenter lockedTab="customers" heading="Customer list" /></Suspense>
    <div className="mt-8"><AdminControlCenter only={["notes"]} title="Customer notes" description="Private notes keyed by the guest's phone or email — preferences, allergies, VIP status." /></div>
  </AdminPageFrame>;
}
