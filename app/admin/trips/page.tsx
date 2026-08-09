import AdminPage from "../page";
export default function TripsPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) { return AdminPage({searchParams,workspace:"trips"}); }
