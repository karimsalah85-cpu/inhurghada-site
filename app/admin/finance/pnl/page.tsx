import { redirect } from "next/navigation";
import AdminPageFrame from "@/components/admin/AdminPageFrame";
import FinancePnl from "@/components/admin/finance/FinancePnl";
import { getAdminAuthorization } from "@/lib/admin-permission";

export default async function FinancePnlPage() {
  const auth = await getAdminAuthorization("view_finance");
  if (!auth.user) redirect("/admin/login");
  if (!auth.allowed) return <p className="p-8">Your role cannot view the P&amp;L.</p>;
  return <AdminPageFrame eyebrow="Finance" title="Profit & loss" description="Management P&L in USD on an accrual basis, in a gross view and a net revenue view. Click any line to see the bookings or expenses behind it."><FinancePnl /></AdminPageFrame>;
}
