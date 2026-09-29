import { redirect } from "next/navigation";
import AdminPageFrame from "@/components/admin/AdminPageFrame";
import FinanceCancellations from "@/components/admin/finance/FinanceCancellations";
import { getAdminAuthorization } from "@/lib/admin-permission";

export default async function FinanceCancellationsPage() {
  const auth = await getAdminAuthorization("view_finance");
  if (!auth.user) redirect("/admin/login");
  if (!auth.allowed) return <p className="p-8">Your role cannot view cancellation costs.</p>;
  return <AdminPageFrame eyebrow="Finance" title="Cancellations" description="What cancellations cost each month by reason, in USD by trip date."><FinanceCancellations /></AdminPageFrame>;
}
