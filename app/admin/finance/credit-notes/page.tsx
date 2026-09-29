import { redirect } from "next/navigation";
import AdminPageFrame from "@/components/admin/AdminPageFrame";
import FinanceCreditNotes from "@/components/admin/finance/FinanceCreditNotes";
import { getAdminAuthorization } from "@/lib/admin-permission";

export default async function FinanceCreditNotesPage() {
  const auth = await getAdminAuthorization("view_finance");
  if (!auth.user) redirect("/admin/login");
  if (!auth.allowed) return <p className="p-8">Your role cannot view credit notes.</p>;
  return <AdminPageFrame eyebrow="Finance" title="Credit notes" description="Every credit note issued to guests, with what is left to use. Issue and apply them from a booking's details."><FinanceCreditNotes /></AdminPageFrame>;
}
