import AdminPage from "../page";
export default function ContentPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) { return AdminPage({searchParams,workspace:"content"}); }
