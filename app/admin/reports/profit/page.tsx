import { Suspense } from "react";
import AdminPageFrame from "@/components/admin/AdminPageFrame";
import AdminOperationsCenter from "@/components/admin/AdminOperationsCenter";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function BookingProfitPage() {
  await requireAdminPage("operations");
  return <AdminPageFrame eyebrow="Insights" title="Booking profit" description="Revenue, recorded costs and profit per booking, tour and month, by currency. For the accounting view, use Finance.">
    <Suspense><AdminOperationsCenter lockedTab="finance" heading="Profit by booking" /></Suspense>
  </AdminPageFrame>;
}
