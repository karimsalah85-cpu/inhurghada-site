import AdminPage from "../page";
export default function CurrencyPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) { return AdminPage({searchParams,workspace:"currency"}); }
