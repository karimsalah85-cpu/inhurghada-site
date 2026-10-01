import { Suspense } from "react";
import { redirect } from "next/navigation";
import AdminPageFrame from "@/components/admin/AdminPageFrame";
import AdminControlCenter from "@/components/admin/AdminControlCenter";
import AdminOperationsCenter from "@/components/admin/AdminOperationsCenter";
import { requireAdminPage } from "@/lib/admin-page-auth";

// Old /admin/operations?tab=… links now have their own pages.
const movedTabs: Record<string, string> = {
  customers: "/admin/customers",
  communications: "/admin/messages",
  finance: "/admin/reports/profit",
  suppliers: "/admin/suppliers",
  security: "/admin/system",
};

export default async function OperationsPage({ searchParams }: { searchParams: Promise<{ tab?: string | string[] }> }) {
  const tab = (await searchParams).tab;
  const moved = movedTabs[Array.isArray(tab) ? tab[0] : tab || ""];
  if (moved) redirect(moved);
  await requireAdminPage("operations");
  return <AdminPageFrame eyebrow="Bookings" title="Dispatch & calendar" description="Departures by day or week with seats left, and who is assigned to each booking.">
    <Suspense><AdminOperationsCenter lockedTab="calendar" heading="Booking calendar" /></Suspense>
    <div className="mt-8"><AdminControlCenter only={["assignments"]} title="Assignments" description="Assign a supplier, guide, driver or crew to a booking and set the pickup time. The pickup time is included in the guest's reminder the day before." /></div>
  </AdminPageFrame>;
}
