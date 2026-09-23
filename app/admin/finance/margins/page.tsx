import { redirect } from "next/navigation";
import AdminPageFrame from "@/components/admin/AdminPageFrame";
import FinanceMargins from "@/components/admin/finance/FinanceMargins";
import { getAdminAuthorization } from "@/lib/admin-permission";

export default async function FinanceMarginsPage() {
  const auth = await getAdminAuthorization("view_finance");
  if (!auth.user) redirect("/admin/login");
  if (!auth.allowed) return <p className="p-8">Your role cannot view margins.</p>;
  return <AdminPageFrame eyebrow="Finance" title="Margins" description="Margin per booking, tour, supplier and destination in USD, with negative and low margins flagged."><FinanceMargins /></AdminPageFrame>;
}
