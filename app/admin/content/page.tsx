import AdminPageFrame from "@/components/admin/AdminPageFrame";
import AdminControlCenter from "@/components/admin/AdminControlCenter";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function ContentPage() {
  await requireAdminPage("content");
  return <AdminPageFrame eyebrow="Catalog" title="Content & media" description="Edit live trip, blog and page content, and manage the photo library used across the site.">
    <AdminControlCenter only={["content", "media"]} title="Live content" description="Changes here update the published site." />
  </AdminPageFrame>;
}
