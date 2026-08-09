import AdminPage from "../page";
export default function OperationsPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) { return AdminPage({searchParams,workspace:"operations"}); }
