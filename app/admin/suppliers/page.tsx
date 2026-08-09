import AdminPage from "../page";
export default function SuppliersPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) { return AdminPage({searchParams,workspace:"suppliers"}); }
