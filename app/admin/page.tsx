import { redirect } from "next/navigation";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminLegacyHashRedirect from "@/components/admin/AdminLegacyHashRedirect";
import { createClient } from "@/utils/supabase/server";
import {
  adminRoles,
  isAdminOwner,
  isAuthorizedAdmin,
  type AdminPermission,
  type AdminRole,
} from "@/lib/admin-auth";
import { hasLivePermission } from "@/lib/admin-permission";

type AdminSearchParams = {
  month?: string;
  status?: string;
  payment?: string;
  type?: string;
  service?: string;
  search?: string;
  supplier?: string;
  expense_sort?: string;
  range?: string;
  panel?: string;
  archive?: string;
};

const bookingStatuses = [
  "all",
  "new",
  "confirmed",
  "completed",
  "cancelled",
] as const;
const paymentStatuses = ["all", "unpaid", "paid", "refunded"] as const;
const bookingTypes = ["all", "tour", "transfer"] as const;
const archiveFilters = ["active", "archived", "all"] as const;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function currentCairoMonth() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
  });
}

function validMonth(value: string | undefined) {
  if (!value || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value))
    return currentCairoMonth();
  return value;
}

function nextMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const next = new Date(Date.UTC(year, monthNumber, 1));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`;
}

export type AdminWorkspace =
  | "overview"
  | "bookings"
  | "analytics"
  | "finance"
  | "trips"
  | "content"
  | "policies"
  | "currency"
  | "customers"
  | "suppliers"
  | "operations"
  | "reports";

export default async function AdminPage({
  searchParams,
  workspace = "overview",
}: {
  searchParams: Promise<AdminSearchParams>;
  workspace?: AdminWorkspace;
}) {
  const params = await searchParams;
  const requestedMonth = first(params.month);
  const month = validMonth(requestedMonth);
  const statusValue = first(params.status);
  const paymentValue = first(params.payment);
  const typeValue = first(params.type);
  const status = bookingStatuses.includes(
    statusValue as (typeof bookingStatuses)[number],
  )
    ? statusValue!
    : "all";
  const payment = paymentStatuses.includes(
    paymentValue as (typeof paymentStatuses)[number],
  )
    ? paymentValue!
    : "all";
  const bookingType = bookingTypes.includes(
    typeValue as (typeof bookingTypes)[number],
  )
    ? typeValue!
    : "all";
  const service = first(params.service)?.trim() || "all";
  const search = first(params.search)?.trim().slice(0, 100) || "";
  const supplier = first(params.supplier)?.trim().slice(0, 100) || "all";
  const expenseSort = ["none", "highest", "lowest"].includes(
    first(params.expense_sort) || "",
  )
    ? first(params.expense_sort)!
    : "none";
  const requestedRange = Number(first(params.range) || 30);
  const analyticsRange = (
    [7, 30, 90].includes(requestedRange) ? requestedRange : 30
  ) as 7 | 30 | 90;
  const requestedPanel = first(params.panel);
  const archiveValue = first(params.archive);
  const archive = archiveFilters.includes(archiveValue as (typeof archiveFilters)[number]) ? archiveValue! : "active";
  const controlPanel = (
    [
      "content",
      "media",
      "availability",
      "staff",
      "assignments",
      "notes",
      "templates",
      "queue",
      "settings",
      "redirects",
    ].includes(requestedPanel || "")
      ? requestedPanel
      : "content"
  ) as
    | "content"
    | "media"
    | "availability"
    | "staff"
    | "assignments"
    | "notes"
    | "templates"
    | "queue"
    | "settings"
    | "redirects";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAuthorizedAdmin(user)) redirect("/admin/login");
  const { data: assurance } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.nextLevel === "aal2" && assurance.currentLevel !== "aal2")
    redirect("/admin/mfa");
  if (requestedMonth !== month) {
    const canonical = new URLSearchParams({ month });
    if (status !== "all") canonical.set("status", status);
    if (payment !== "all") canonical.set("payment", payment);
    if (bookingType !== "all") canonical.set("type", bookingType);
    if (service !== "all") canonical.set("service", service);
    if (search) canonical.set("search", search);
    if (supplier !== "all") canonical.set("supplier", supplier);
    if (expenseSort !== "none") canonical.set("expense_sort", expenseSort);
    if (analyticsRange !== 30) canonical.set("range", String(analyticsRange));
    if (controlPanel !== "content") canonical.set("panel", controlPanel);
    if (archive !== "active") canonical.set("archive", archive);
    const workspacePath =
      workspace === "overview" ? "/admin" : `/admin/${workspace}`;
    redirect(`${workspacePath}?${canonical.toString()}`);
  }
  const allPermissions = [
    "bookings",
    "content",
    "operations",
    "finance",
    "suppliers",
    "reports",
    "settings",
    "staff",
  ] satisfies AdminPermission[];
  const permissionChecks = Object.fromEntries(
    allPermissions.map((permission) => [
      permission,
      hasLivePermission(supabase, user, permission),
    ]),
  ) as Record<AdminPermission, Promise<boolean>>;
  await Promise.all(Object.values(permissionChecks));
  const canBookings =
    (await permissionChecks.bookings) || (await permissionChecks.reports);
  const canFinance = await permissionChecks.finance;
  const canSuppliers = await permissionChecks.suppliers;
  const permissions: AdminPermission[] = [];
  for (const permission of allPermissions) {
    if (await permissionChecks[permission]) permissions.push(permission);
  }
  const role = isAdminOwner(user)
    ? "owner"
    : adminRoles.includes(user?.app_metadata?.admin_role as AdminRole)
      ? (user?.app_metadata?.admin_role as AdminRole)
      : "operator";

  let bookingListQuery = supabase
    .from("bookings")
    .select("*")
    .gte("date", `${month}-01`)
    .lt("date", `${nextMonth(month)}-01`)
    .order("created_at", { ascending: false });
  if (status !== "all")
    bookingListQuery = bookingListQuery.eq("status", status);
  if (payment !== "all")
    bookingListQuery = bookingListQuery.eq("payment_status", payment);
  if (bookingType !== "all")
    bookingListQuery = bookingListQuery.eq("type", bookingType);
  if (service === "Transfer")
    bookingListQuery = bookingListQuery.is("tour_name", null);
  else if (service !== "all")
    bookingListQuery = bookingListQuery.eq("tour_name", service);
  if (archive === "active") bookingListQuery = bookingListQuery.is("archived_at", null);
  else if (archive === "archived") bookingListQuery = bookingListQuery.not("archived_at", "is", null);

  const [
    { data: bookings, error: bookingsError },
    { data: bookingList, error: bookingListError },
    { data: expenses, error: expensesError },
    { data: suppliers, error: suppliersError },
    { data: salesPeople, error: salesPeopleError },
    { data: expenseTypes },
  ] = await Promise.all([
    canBookings
      ? supabase
          .from("bookings")
          .select("*")
          .is("archived_at", null)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    canBookings ? bookingListQuery : Promise.resolve({ data: [], error: null }),
    canFinance
      ? supabase
          .from("expenses")
          .select("*, bookings(status,reference)")
          .order("expense_date", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    canSuppliers
      ? supabase.from("suppliers").select("*").order("name")
      : Promise.resolve({ data: [], error: null }),
    canFinance
      ? supabase.from("sales_people").select("*").order("name")
      : Promise.resolve({ data: [], error: null }),
    canFinance
      ? supabase
          .from("expense_types")
          .select("*")
          .order("is_system", { ascending: false })
          .order("sort_order", { ascending: true })
          .order("label", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);
  const error =
    bookingsError?.message ||
    bookingListError?.message ||
    expensesError?.message;
  const normalizedSearch = search.toLowerCase();
  const visibleBookings = normalizedSearch
    ? (bookingList || []).filter((booking) =>
        [
          booking.reference,
          booking.customer_name,
          booking.customer_email,
          booking.phone,
          booking.tour_name,
          booking.hotel,
          booking.date,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch),
      )
    : bookingList || [];
  const expenseByBooking = new Map<string, number>();
  const expenseByBookingCurrency = new Map<string, Record<string, number>>();
  const supplierByBooking = new Map<string, string>();
  for (const expense of expenses || []) {
    if (!expense.booking_id) continue;
    expenseByBooking.set(
      expense.booking_id,
      (expenseByBooking.get(expense.booking_id) || 0) +
        Number(expense.amount || 0),
    );
    const byCurrency = expenseByBookingCurrency.get(expense.booking_id) || {};
    byCurrency[expense.currency] = (byCurrency[expense.currency] || 0) + Number(expense.amount || 0);
    expenseByBookingCurrency.set(expense.booking_id, byCurrency);
    const linkedSupplier = (suppliers || []).find(
      (item) => item.id === expense.supplier_id,
    );
    if (linkedSupplier)
      supplierByBooking.set(expense.booking_id, linkedSupplier.name);
  }
  let visibleBookingsWithCosts = visibleBookings.map((booking) => ({
    ...booking,
    expense_total: expenseByBooking.get(booking.id) || 0,
    expense_by_currency: expenseByBookingCurrency.get(booking.id) || {},
    supplier_name: supplierByBooking.get(booking.id) || null,
  }));
  if (supplier !== "all")
    visibleBookingsWithCosts = visibleBookingsWithCosts.filter(
      (booking) => booking.supplier_name === supplier,
    );
  if (expenseSort !== "none")
    visibleBookingsWithCosts.sort((a, b) =>
      expenseSort === "highest"
        ? b.expense_total - a.expense_total
        : a.expense_total - b.expense_total,
    );
  const bookingView = {
    month,
    status,
    payment,
    type: bookingType,
    service,
    search,
    supplier,
    expense_sort: expenseSort,
    archive,
  };

  const migrationPending = Boolean(suppliersError || salesPeopleError);
  const { data: tripStatusAudits } = (await permissionChecks.content)
    ? await supabase
        .from("admin_audit_log")
        .select("id,resource_id,after_data,created_at")
        .eq("resource_type", "content")
        .order("created_at", { ascending: false })
        .limit(30)
    : { data: [] };
  const tripStatusChanges = (tripStatusAudits || [])
    .flatMap((entry) => {
      const after =
        entry.after_data &&
        typeof entry.after_data === "object" &&
        !Array.isArray(entry.after_data)
          ? (entry.after_data as Record<string, unknown>)
          : {};
      const listingStatus = String(after.listing_status || "");
      if (
        !["active", "paused", "unlisted"].includes(listingStatus) ||
        after.content_type !== "tour"
      )
        return [];
      return [
        {
          id: String(entry.id),
          title: String(after.title || after.slug || "Trip"),
          slug: String(after.slug || ""),
          listing_status: listingStatus,
          updated_at: entry.created_at,
        },
      ];
    })
    .slice(0, 6);
  const titles: Record<AdminWorkspace, [string, string]> = {
    overview: ["Daily Red Sea Admin", "Today’s actionable overview."],
    bookings: [
      "Booking management",
      "Search, filter, update, and inspect bookings.",
    ],
    analytics: [
      "Analytics & advertising",
      "Website audiences, booking demand, and advertising performance.",
    ],
    finance: ["Finance", "Booking margins, expenses, and business costs."],
    trips: [
      "Trips & listings",
      "Control which trips are active, paused, or unlisted.",
    ],
    content: [
      "Trip content",
      "Manage live content, media, capacity, staff, and assignments.",
    ],
    policies: [
      "Terms & policies",
      "Manage published policy and configuration records.",
    ],
    currency: [
      "Currency settings",
      "Manage currency and site configuration records.",
    ],
    customers: ["Customers", "Manage customer notes and operational context."],
    suppliers: [
      "Suppliers",
      "Manage suppliers, sales contacts, and performance.",
    ],
    operations: [
      "Operations",
      "Manage calendars, communications, reports, and operational records.",
    ],
    reports: [
      "Reports & statistics",
      "Booking status, workload percentages, service performance, and exports.",
    ],
  };
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 sm:py-12">
      {workspace === "overview" ? <AdminLegacyHashRedirect /> : null}
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">
          Operations
        </p>
        <h1 className="mt-2 text-4xl font-black text-slate-900">
          {titles[workspace][0]}
        </h1>
        <p className="mt-2 text-slate-600">{titles[workspace][1]}</p>
        {error ? (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
            <p className="font-bold">
              The admin database access needs attention.
            </p>
            <p className="mt-2 text-sm">{error}</p>
          </div>
        ) : (
          <AdminDashboard
            mode={workspace}
            initialTripStatusChanges={tripStatusChanges || []}
            key={Object.values(bookingView).join("|")}
            initialBookings={bookings || []}
            initialVisibleBookings={visibleBookingsWithCosts}
            bookingView={bookingView}
            initialExpenses={expenses || []}
            initialExpenseTypes={expenseTypes || []}
            initialSuppliers={suppliers || []}
            initialSalesPeople={salesPeople || []}
            migrationPending={migrationPending}
            permissions={permissions}
            currentRole={role}
            isOwner={isAdminOwner(user)}
            analyticsRange={analyticsRange}
            initialControlPanel={controlPanel}
          />
        )}
      </div>
    </main>
  );
}
