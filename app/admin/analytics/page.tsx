import AdminPage from "../page";
export default function AnalyticsPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) { return AdminPage({searchParams,workspace:"analytics"}); }
