import { notFound, redirect } from "next/navigation";
import AdminPageFrame from "@/components/admin/AdminPageFrame";
import FinanceSupplierDetail from "@/components/admin/finance/FinanceSupplierDetail";
import { getAdminAuthorization } from "@/lib/admin-permission";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function FinanceSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuidPattern.test(id)) notFound();
  const auth = await getAdminAuthorization("view_finance");
  if (!auth.user) redirect("/admin/login");
  if (!auth.allowed) return <p className="p-8">Your role cannot view supplier finance.</p>;
  return <AdminPageFrame eyebrow="Finance" title="Supplier ledger" description="Bookings, payments, commissions and settlements with this supplier. Entries are never edited; corrections are reversals."><FinanceSupplierDetail supplierId={id} /></AdminPageFrame>;
}
