import { redirect } from "next/navigation";
import AdminPageFrame from "@/components/admin/AdminPageFrame";
import FinanceVat from "@/components/admin/finance/FinanceVat";
import { getAdminAuthorization } from "@/lib/admin-permission";

export default async function FinanceVatPage() {
  const auth = await getAdminAuthorization("view_finance");
  if (!auth.user) redirect("/admin/login");
  if (!auth.allowed) return <p className="p-8">Your role cannot view VAT.</p>;
  return <AdminPageFrame eyebrow="Finance" title="VAT" description="Set up the VAT rates your accountant confirms, and see VAT on sales and purchases each month."><FinanceVat /></AdminPageFrame>;
}
