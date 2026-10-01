import AdminPageFrame from "@/components/admin/AdminPageFrame";
import AdminControlCenter from "@/components/admin/AdminControlCenter";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function RedirectsPage() {
  await requireAdminPage("content");
  return <AdminPageFrame eyebrow="Settings" title="Redirects" description="Send old or mistyped URLs to the right page, so links and search results keep working.">
    <AdminControlCenter only={["redirects"]} title="Redirect rules" />
  </AdminPageFrame>;
}
