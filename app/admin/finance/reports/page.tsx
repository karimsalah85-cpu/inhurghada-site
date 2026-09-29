import { redirect } from "next/navigation";
import AdminPageFrame from "@/components/admin/AdminPageFrame";
import FinanceDashboard from "@/components/admin/finance/FinanceDashboard";
import { getAdminAuthorization } from "@/lib/admin-permission";

export default async function FinanceReportsPage() {
  const auth = await getAdminAuthorization("view_finance");
  if (!auth.user) redirect("/admin/login");
  if (!auth.allowed) return <p className="p-8">Your role cannot view finance reports.</p>;
  return <AdminPageFrame eyebrow="Finance" title="Reports" description="Profit, cash, partner balances, revenue by tour and location, cancellations and VAT for any period, with a full transaction export for your accountant."><FinanceDashboard /></AdminPageFrame>;
}
