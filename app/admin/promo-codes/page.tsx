import { redirect } from "next/navigation";
import { getAdminAuthorization } from "@/lib/admin-permission";
import AdminPromoCodes from "@/components/admin/AdminPromoCodes";
export default async function PromoCodesPage() {
  const auth = await getAdminAuthorization("content");
  if (!auth.user) redirect("/admin/login");
  if (!auth.allowed) return <p className="p-8">Your role cannot manage promo codes.</p>;
  return <AdminPromoCodes/>;
}
