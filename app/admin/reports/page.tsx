import AdminPage from "../page";

export default function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return AdminPage({ searchParams, workspace: "reports" });
}
