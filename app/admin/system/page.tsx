import { Suspense } from "react";
import AdminPageFrame from "@/components/admin/AdminPageFrame";
import AdminOperationsCenter from "@/components/admin/AdminOperationsCenter";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function SystemPage() {
  await requireAdminPage("settings");
  return <AdminPageFrame eyebrow="Users & system" title="SEO & backups" description="Automatic SEO checks of the public site and verification of the database backups.">
    <Suspense><AdminOperationsCenter lockedTab="security" heading="System checks" /></Suspense>
  </AdminPageFrame>;
}
