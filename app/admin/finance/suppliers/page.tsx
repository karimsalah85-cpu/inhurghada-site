import { redirect } from "next/navigation";
import AdminPageFrame from "@/components/admin/AdminPageFrame";
import FinanceSuppliers from "@/components/admin/finance/FinanceSuppliers";
import { getAdminAuthorization } from "@/lib/admin-permission";

export default async function FinanceSuppliersPage() {
  const auth = await getAdminAuthorization("view_finance");
  if (!auth.user) redirect("/admin/login");
  if (!auth.allowed) return <p className="p-8">Your role cannot view supplier finance.</p>;
  return <AdminPageFrame eyebrow="Finance" title="Supplier balances" description="Who owes whom, per supplier, from the append-only supplier ledger. Management reporting, not a statutory accounting statement."><FinanceSuppliers /></AdminPageFrame>;
}
