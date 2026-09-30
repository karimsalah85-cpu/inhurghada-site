import AdminPageFrame from "@/components/admin/AdminPageFrame";
import AdminControlCenter from "@/components/admin/AdminControlCenter";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function SettingsPage() {
  await requireAdminPage("settings");
  return <AdminPageFrame eyebrow="Settings" title="Site settings" description="Contact details, social links, the site announcement bar and other values the public site reads.">
    <AdminControlCenter only={["settings"]} title="General settings" description="Currency and legal texts have their own tabs above." />
  </AdminPageFrame>;
}
