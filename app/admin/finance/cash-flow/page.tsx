import { redirect } from "next/navigation";
import AdminPageFrame from "@/components/admin/AdminPageFrame";
import FinanceDashboard from "@/components/admin/finance/FinanceDashboard";
import { getAdminAuthorization } from "@/lib/admin-permission";

export default async function CashFlowPage() {
  const auth = await getAdminAuthorization("view_finance");
  if (!auth.user) redirect("/admin/login");
  if (!auth.allowed) return <p className="p-8">Your role cannot view cash flow.</p>;
  return <AdminPageFrame eyebrow="Finance" title="Cash flow" description="Cash received, cash paid out and net movement by transaction date, with monthly graphs and an accountant export."><FinanceDashboard cashOnly /></AdminPageFrame>;
}
