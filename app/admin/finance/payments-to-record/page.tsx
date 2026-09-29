import { redirect } from "next/navigation";
import AdminPageFrame from "@/components/admin/AdminPageFrame";
import FinancePaymentsToRecord from "@/components/admin/finance/FinancePaymentsToRecord";
import { getAdminAuthorization } from "@/lib/admin-permission";

export default async function FinancePaymentsToRecordPage() {
  const auth = await getAdminAuthorization("view_finance");
  if (!auth.user) redirect("/admin/login");
  if (!auth.allowed) return <p className="p-8">Your role cannot view guest payments.</p>;
  return <AdminPageFrame eyebrow="Finance" title="Payments to record" description="Guest money Daily Red Sea received that is not recorded yet. Record each deposit, balance and refund on the day it happens so cash in vs cash out is complete."><FinancePaymentsToRecord /></AdminPageFrame>;
}
