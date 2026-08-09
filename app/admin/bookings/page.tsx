import AdminPage from "../page";
export default function BookingsPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) { return AdminPage({searchParams,workspace:"bookings"}); }
