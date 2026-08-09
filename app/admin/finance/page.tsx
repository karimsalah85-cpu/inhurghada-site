import AdminPage from "../page";
export default function FinancePage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) { return AdminPage({searchParams,workspace:"finance"}); }
