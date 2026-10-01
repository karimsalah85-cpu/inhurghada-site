import { Suspense } from "react";
import AdminPageFrame from "@/components/admin/AdminPageFrame";
import AdminControlCenter from "@/components/admin/AdminControlCenter";
import AdminOperationsCenter from "@/components/admin/AdminOperationsCenter";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function MessagesPage() {
  await requireAdminPage("operations");
  return <AdminPageFrame eyebrow="Bookings" title="Messages" description="Guest conversations, the automatic reminder and review-request templates, and the outgoing message queue.">
    <Suspense><AdminOperationsCenter lockedTab="communications" heading="Conversations" /></Suspense>
    <div className="mt-8"><AdminControlCenter only={["templates", "queue"]} title="Templates & queue" description="Templates are used by the daily automation (pickup reminders the day before, review requests the day after). Use {{pickup_line}} to include the pickup time when it is known. Use {{waiver_link}} to include the signed diving-waiver link (empty for non-diving bookings)." /></div>
  </AdminPageFrame>;
}
