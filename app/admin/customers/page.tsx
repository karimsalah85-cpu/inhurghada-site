import AdminPage from "../page";
export default function CustomersPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) { return AdminPage({searchParams,workspace:"customers"}); }
