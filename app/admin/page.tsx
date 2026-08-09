import { redirect } from "next/navigation";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { createClient } from "@/utils/supabase/server";
import { adminRoles, hasAdminPermission, isAdminOwner, isAuthorizedAdmin, type AdminPermission, type AdminRole } from "@/lib/admin-auth";

type AdminSearchParams = {
  month?: string;
  status?: string;
  payment?: string;
  type?: string;
  service?: string;
  search?: string;
};

const bookingStatuses = ["all", "new", "confirmed", "completed", "cancelled"] as const;
const paymentStatuses = ["all", "unpaid", "paid", "refunded"] as const;
const bookingTypes = ["all", "tour", "transfer"] as const;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function currentCairoMonth() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit" });
}

function validMonth(value: string | undefined) {
  if (!value || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return currentCairoMonth();
  return value;
}

function nextMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const next = new Date(Date.UTC(year, monthNumber, 1));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<AdminSearchParams> }) {
  const params = await searchParams;
  const requestedMonth = first(params.month);
  const month = validMonth(requestedMonth);
  const statusValue = first(params.status);
  const paymentValue = first(params.payment);
  const typeValue = first(params.type);
  const status = bookingStatuses.includes(statusValue as typeof bookingStatuses[number]) ? statusValue! : "all";
  const payment = paymentStatuses.includes(paymentValue as typeof paymentStatuses[number]) ? paymentValue! : "all";
  const bookingType = bookingTypes.includes(typeValue as typeof bookingTypes[number]) ? typeValue! : "all";
  const service = first(params.service)?.trim() || "all";
  const search = first(params.search)?.trim().slice(0, 100) || "";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAuthorizedAdmin(user)) redirect("/admin/login");
  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.nextLevel === "aal2" && assurance.currentLevel !== "aal2") redirect("/admin/mfa");
  if (requestedMonth !== month) {
    const canonical = new URLSearchParams({ month });
    if (status !== "all") canonical.set("status", status);
    if (payment !== "all") canonical.set("payment", payment);
    if (bookingType !== "all") canonical.set("type", bookingType);
    if (service !== "all") canonical.set("service", service);
    if (search) canonical.set("search", search);
    redirect(`/admin?${canonical.toString()}`);
  }
  const canBookings = hasAdminPermission(user, "bookings") || hasAdminPermission(user, "reports");
  const canFinance = hasAdminPermission(user, "finance");
  const canSuppliers = hasAdminPermission(user, "suppliers");
  const permissions = (["bookings", "content", "operations", "finance", "suppliers", "reports", "settings", "staff"] satisfies AdminPermission[]).filter((permission) => hasAdminPermission(user, permission));
  const role = isAdminOwner(user) ? "owner" : (adminRoles.includes(user?.app_metadata?.admin_role as AdminRole) ? user?.app_metadata?.admin_role as AdminRole : "operator");

  let bookingListQuery = supabase
    .from("bookings")
    .select("*")
    .gte("date", `${month}-01`)
    .lt("date", `${nextMonth(month)}-01`)
    .order("created_at", { ascending: false });
  if (status !== "all") bookingListQuery = bookingListQuery.eq("status", status);
  if (payment !== "all") bookingListQuery = bookingListQuery.eq("payment_status", payment);
  if (bookingType !== "all") bookingListQuery = bookingListQuery.eq("type", bookingType);
  if (service === "Transfer") bookingListQuery = bookingListQuery.is("tour_name", null);
  else if (service !== "all") bookingListQuery = bookingListQuery.eq("tour_name", service);

  const [
    { data: bookings, error: bookingsError },
    { data: bookingList, error: bookingListError },
    { data: expenses, error: expensesError },
    { data: suppliers, error: suppliersError },
    { data: salesPeople, error: salesPeopleError },
  ] = await Promise.all([
    canBookings ? supabase.from("bookings").select("*").order("created_at", { ascending: false }) : Promise.resolve({ data: [], error: null }),
    canBookings ? bookingListQuery : Promise.resolve({ data: [], error: null }),
    canFinance ? supabase.from("expenses").select("*").order("expense_date", { ascending: false }) : Promise.resolve({ data: [], error: null }),
    canSuppliers ? supabase.from("suppliers").select("*").order("name") : Promise.resolve({ data: [], error: null }),
    canFinance ? supabase.from("sales_people").select("*").order("name") : Promise.resolve({ data: [], error: null }),
  ]);
  const error = bookingsError?.message || bookingListError?.message || expensesError?.message;
  const normalizedSearch = search.toLowerCase();
  const visibleBookings = normalizedSearch ? (bookingList || []).filter((booking) => [booking.reference, booking.customer_name, booking.customer_email, booking.phone, booking.tour_name, booking.hotel, booking.date].filter(Boolean).join(" ").toLowerCase().includes(normalizedSearch)) : (bookingList || []);
  const bookingView = { month, status, payment, type: bookingType, service, search };

  const migrationPending = Boolean(suppliersError || salesPeopleError);

  return <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 sm:py-12"><div className="mx-auto max-w-7xl"><p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">Operations</p><h1 className="mt-2 text-4xl font-black text-slate-900">Daily Red Sea Admin</h1><p className="mt-2 text-slate-600">Manage customer bookings, cash collection, partners, and business finances.</p>{error ? <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950"><p className="font-bold">The admin database access needs attention.</p><p className="mt-2 text-sm">{error}</p><p className="mt-2 text-sm">Run the authenticated-admin policy from <code>supabase/schema.sql</code> in Supabase SQL Editor, then refresh this page.</p></div> : <AdminDashboard key={Object.values(bookingView).join("|")} initialBookings={bookings || []} initialVisibleBookings={visibleBookings} bookingView={bookingView} initialExpenses={expenses || []} initialSuppliers={suppliers || []} initialSalesPeople={salesPeople || []} migrationPending={migrationPending} permissions={permissions} currentRole={role} isOwner={isAdminOwner(user)} />}</div></main>;
}
