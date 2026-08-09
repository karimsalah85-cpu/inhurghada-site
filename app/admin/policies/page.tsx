import AdminPage from "../page";
export default function PoliciesPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) { return AdminPage({searchParams,workspace:"policies"}); }
