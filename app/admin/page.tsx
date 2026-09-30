import { redirect } from "next/navigation";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { tourDimensions } from "@/lib/finance/dimensions";
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
import {
  buildAdminAttention,
  cairoTomorrow,
  failedMessagesSince,
  supplierWaitCutoff,
  SUPPLIER_WAITING_STATUSES,
  type AdminAttention,
  type AttentionAssignmentRow,
  type AttentionBookingRow,
  type AttentionQueueRow,
  type AttentionSupplierRequestRow,
} from "@/lib/admin-attention";
import { createAdminClient } from "@/utils/supabase/admin";

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
  tab?: string;
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

// Marks when booking data was read, so cached client copies can detect later changes.
function currentTimestamp() {
  return Date.now();
}

type QueryResult<T> = { data: T[] | null; error: { code?: string; message: string } | null };
const attentionRowLimit = 500;
const attentionBookingColumns = "id,reference,customer_name,tour_name,date,start_time,hotel,status,archived_at,guests,adults,youth,infants";

/** Rows for a "needs attention" item, or undefined when the table is missing or unreadable (the item is then skipped). */
function rowsOrSkip<T>({ data, error }: QueryResult<T>, table: string): T[] | undefined {
  if (!error) return data || [];
  if (error.code !== "42P01" && error.code !== "PGRST205") console.error("Overview attention query failed", { table, message: error.message });
  return undefined;
}

async function loadAdminAttention(
  supabase: Awaited<ReturnType<typeof createClient>>,
  access: { bookings: boolean; operations: boolean },
): Promise<AdminAttention> {
  const now = new Date();
  const tomorrow = cairoTomorrow(now);
  const tomorrowBookings = rowsOrSkip<AttentionBookingRow>(
    await supabase.from("bookings").select(attentionBookingColumns).eq("date", tomorrow).is("archived_at", null).neq("status", "cancelled").limit(attentionRowLimit),
    "bookings",
  );
  const tomorrowIds = (tomorrowBookings || []).map((booking) => booking.id);
  // booking_assignments and communication_queue are readable under operations RLS;
  // supplier requests are service-role only, so they are read after the permission check.
  const database = access.bookings || access.operations ? createAdminClient() : null;
  const [assignments, requests, failed] = await Promise.all([
    access.operations && tomorrowBookings
      ? tomorrowIds.length
        ? supabase.from("booking_assignments").select("booking_id,pickup_time,status").in("booking_id", tomorrowIds).then((result) => rowsOrSkip<AttentionAssignmentRow>(result as QueryResult<AttentionAssignmentRow>, "booking_assignments"))
        : Promise.resolve([] as AttentionAssignmentRow[])
      : Promise.resolve(undefined),
    database
      ? database.from("supplier_booking_requests").select("id,booking_id,supplier_id,status,sent_at,last_sent_at,responded_at").in("status", [...SUPPLIER_WAITING_STATUSES]).lte("last_sent_at", supplierWaitCutoff(now)).order("last_sent_at").limit(attentionRowLimit).then((result) => rowsOrSkip<AttentionSupplierRequestRow>(result as QueryResult<AttentionSupplierRequestRow>, "supplier_booking_requests"))
      : Promise.resolve(undefined),
    access.operations
      ? supabase.from("communication_queue").select("id,booking_id,channel,recipient,attempts,scheduled_for,last_error").eq("status", "failed").gte("scheduled_for", failedMessagesSince(now)).order("scheduled_for", { ascending: false }).limit(attentionRowLimit).then((result) => rowsOrSkip<AttentionQueueRow>(result as QueryResult<AttentionQueueRow>, "communication_queue"))
      : Promise.resolve(undefined),
  ]);
  let supplierRequests = requests;
  let supplierRequestBookings: AttentionBookingRow[] | undefined;
  if (database && requests?.length) {
    const bookingIds = [...new Set(requests.map((row) => row.booking_id))];
    const supplierIds = [...new Set(requests.map((row) => row.supplier_id))];
    const [bookingRows, supplierRows] = await Promise.all([
      database.from("bookings").select(attentionBookingColumns).in("id", bookingIds),
      database.from("suppliers").select("id,name").in("id", supplierIds),
    ]);
    supplierRequestBookings = rowsOrSkip<AttentionBookingRow>(bookingRows as QueryResult<AttentionBookingRow>, "bookings");
    const names = new Map(((supplierRows.data || []) as { id: string; name: string }[]).map((row) => [row.id, row.name]));
    supplierRequests = requests.map((row) => ({ ...row, supplier_name: names.get(row.supplier_id) || null }));
  } else if (requests) supplierRequestBookings = [];
  return buildAdminAttention({ now, tomorrowBookings, tomorrowAssignments: assignments, supplierRequests, supplierRequestBookings, failedMessages: failed });
}

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
  const requestedTab = first(params.tab);
  const operationsTab = ["calendar", "customers", "finance", "suppliers", "communications", "security"].includes(requestedTab || "")
    ? requestedTab
    : undefined;
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
    if (workspace === "operations" && operationsTab) canonical.set("tab", operationsTab);
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

  // Generous but bounded row caps: PostgREST silently truncates unbounded queries at its
  // own default limit, which would otherwise corrupt stats with no indication in the UI.
  const bookingsRowLimit = 5000;
  const expensesRowLimit = 5000;
  const partnersRowLimit = 2000;
  // These workspaces own their data loading; unrelated ledger failures must not
  // block the content editor, settings, customer notebook, or operations tools.
  const needsDashboardData = ["overview", "bookings", "finance", "suppliers", "reports"].includes(workspace);

  let bookingListQuery = supabase
    .from("bookings")
    .select("*")
    .gte("date", `${month}-01`)
    .lt("date", `${nextMonth(month)}-01`)
    .order("created_at", { ascending: false })
    .limit(bookingsRowLimit);
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

  const bookingsLoadedAt = currentTimestamp();
  const [
    { data: bookings, error: bookingsError },
    { data: bookingList, error: bookingListError },
    { data: expenses, error: expensesError },
    { data: suppliers, error: suppliersError },
    { data: salesPeople, error: salesPeopleError },
    { data: expenseTypes },
  ] = await Promise.all([
    needsDashboardData && canBookings
      ? supabase
          .from("bookings")
          .select("*")
          .is("archived_at", null)
          .order("created_at", { ascending: false })
          .limit(bookingsRowLimit)
      : Promise.resolve({ data: [], error: null }),
    needsDashboardData && canBookings ? bookingListQuery : Promise.resolve({ data: [], error: null }),
    needsDashboardData && canFinance
      ? supabase
          .from("expenses")
          .select("*, bookings(status,reference)")
          .order("expense_date", { ascending: false })
          .limit(expensesRowLimit)
      : Promise.resolve({ data: [], error: null }),
    needsDashboardData && canSuppliers
      ? supabase.from("suppliers").select("*").order("name").limit(partnersRowLimit)
      : Promise.resolve({ data: [], error: null }),
    needsDashboardData && canFinance
      ? supabase.from("sales_people").select("*").order("name").limit(partnersRowLimit)
      : Promise.resolve({ data: [], error: null }),
    needsDashboardData && canFinance
      ? supabase
          .from("expense_types")
          .select("*")
          .order("is_system", { ascending: false })
          .order("sort_order", { ascending: true })
          .order("label", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);
  const rowsMayBeTruncated = Boolean(
    (bookings && bookings.length >= bookingsRowLimit) ||
      (bookingList && bookingList.length >= bookingsRowLimit) ||
      (expenses && expenses.length >= expensesRowLimit) ||
      (suppliers && suppliers.length >= partnersRowLimit) ||
      (salesPeople && salesPeople.length >= partnersRowLimit),
  );
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
  const { data: tripStatusAudits } = workspace === "overview" && (await permissionChecks.content)
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
  const canOperations = await permissionChecks.operations;
  const canBookingsEdit = await permissionChecks.bookings;
  const attention = workspace === "overview" && (canBookingsEdit || canOperations)
    ? await loadAdminAttention(supabase, { bookings: canBookingsEdit, operations: canOperations })
    : null;
  const titles: Record<AdminWorkspace, [string, string]> = {
    overview: ["Daily Red Sea Admin", "Today’s actionable overview."],
    bookings: [
      "Booking management",
      "Search, filter, update, and inspect bookings.",
    ],
    analytics: [
      "Marketing",
      "Website audiences, booking demand, and advertising performance.",
    ],
    finance: ["Finance", "Expenses, booking costs and margins. Use the tabs above for P&L, balances, VAT and reports."],
    trips: [
      "Trips & listings",
      "Toggle a trip active, paused, or unlisted — or open one to edit its full content.",
    ],
    content: [
      "Trip content",
      "The full editor: content, pricing, media, capacity, staff, assignments, settings, and redirects for every record.",
    ],
    policies: [
      "Terms & policies",
      "Cancellation rules and other published legal text.",
    ],
    currency: [
      "Currency settings",
      "Manual exchange-rate overrides used for price display.",
    ],
    customers: ["Customers", "Manage customer notes and operational context."],
    suppliers: [
      "Partners & sales people",
      "Boats, guides, drivers, hotels and companies that deliver trips, sales people and their commission, and supplier cost prices. Guides & staff and supplier balances have their own pages.",
    ],
    operations: [
      "Operations",
      "Manage calendars, communications, reports, and operational records.",
    ],
    reports: [
      "Bookings report",
      "Bookings by period, status and service, with exports.",
    ],
  };
  return (
    <main className={workspace === "bookings" ? "min-h-screen bg-slate-50 px-4 py-5 sm:px-6" : "min-h-screen bg-slate-50 px-4 py-10 sm:px-6 sm:py-12"}>
      {workspace === "overview" ? <AdminLegacyHashRedirect /> : null}
      <div className={workspace === "bookings" ? "mx-auto min-w-0" : "mx-auto max-w-7xl"}>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">
          Operations
        </p>
        <h1 className={workspace === "bookings" ? "mt-1 text-2xl font-black text-slate-900" : "mt-2 text-4xl font-black text-slate-900"}>
          {titles[workspace][0]}
        </h1>
        {workspace !== "bookings" ? <p className="mt-2 text-slate-600">{titles[workspace][1]}</p> : null}
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
            attention={attention}
            key={Object.values(bookingView).join("|")}
            initialBookings={bookings || []}
            initialVisibleBookings={visibleBookingsWithCosts}
            bookingView={bookingView}
            initialExpenses={expenses || []}
            initialExpenseTypes={expenseTypes || []}
            initialSuppliers={suppliers || []}
            initialSalesPeople={salesPeople || []}
            migrationPending={migrationPending}
            rowsMayBeTruncated={rowsMayBeTruncated}
            permissions={permissions}
            currentRole={role}
            isOwner={isAdminOwner(user)}
            analyticsRange={analyticsRange}
            initialControlPanel={controlPanel}
            renderedAt={bookingsLoadedAt}
            tourOptions={tourDimensions().map((tour) => ({ slug: tour.tour_slug, title: tour.tour_name }))}
          />
        )}
      </div>
    </main>
  );
}
