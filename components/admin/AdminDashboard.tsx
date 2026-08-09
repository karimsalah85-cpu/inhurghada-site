"use client";

import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Download,
  ExternalLink,
  FileText,
  ListChecks,
  LogOut,
  Mail,
  Search,
  Send,
  Trash2,
  UsersRound,
  WalletCards,
} from "lucide-react";
import SituationReports from "@/components/admin/SituationReports";
import AdminControlCenter from "@/components/admin/AdminControlCenter";
import AdminOperationsCenter from "@/components/admin/AdminOperationsCenter";
import GoogleAdsPanel from "@/components/admin/GoogleAdsPanel";
import GoogleAnalyticsPanel from "@/components/admin/GoogleAnalyticsPanel";
import TopServicesPanel from "@/components/admin/TopServicesPanel";
import { countDistinctCustomers } from "@/lib/customer-count";
import {
  adminRoles,
  permissionsForAdminRole,
  type AdminPermission,
  type AdminRole,
} from "@/lib/admin-auth";
import BookingDetailPanel from "@/components/admin/BookingDetailPanel";

type Status = "new" | "confirmed" | "completed" | "cancelled";
type PaymentStatus = "unpaid" | "paid" | "refunded";
type Booking = {
  id: string;
  reference: string;
  customer_name: string;
  customer_email: string | null;
  phone: string;
  tour_name: string | null;
  date: string | null;
  guests: number | null;
  hotel: string | null;
  notes: string | null;
  amount: number | string;
  currency: string;
  status: Status;
  payment_status: PaymentStatus;
  created_at: string;
  type: "tour" | "transfer";
  sales_person_id?: string | null;
  sales_commission_percent?: number | string | null;
  expense_total?: number;
  supplier_name?: string | null;
};
type BookingView = {
  month: string;
  status: string;
  payment: string;
  type: string;
  service: string;
  search: string;
  supplier: string;
  expense_sort: string;
};
type Expense = {
  id: string;
  description: string;
  amount: number | string;
  currency: string;
  expense_date: string;
  category: string | null;
  expense_type?: string;
  supplier_id?: string | null;
  sales_person_id?: string | null;
  booking_id?: string | null;
};
type Supplier = {
  id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
};
type SalesPerson = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  commission_percent: number | string | null;
  notes: string | null;
};
type PartnerType = "supplier" | "sales_person";

const expenseOptions = [
  ["google_ads", "Google Ads"],
  ["subscriptions", "Subscriptions"],
  ["supplier_per_trip", "Supplier per trip"],
  ["sales_commission", "Sales person commission"],
  ["fuel", "Fuel"],
  ["guide_fees", "Guide fees"],
  ["boat_costs", "Boat costs"],
  ["other", "Other"],
] as const;

const money = (amount: number, currency = "USD") =>
  new Intl.NumberFormat("en", { style: "currency", currency }).format(amount);
const today = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
const statusColors: Record<Status | PaymentStatus, string> = {
  new: "bg-blue-50 text-blue-700",
  confirmed: "bg-violet-50 text-violet-700",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-rose-50 text-rose-700",
  unpaid: "bg-amber-50 text-amber-700",
  paid: "bg-emerald-50 text-emerald-700",
  refunded: "bg-slate-100 text-slate-600",
};

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "The admin request failed.");
  return data as T;
}

export default function AdminDashboard({
  mode = "overview",
  initialTripStatusChanges = [],
  initialBookings,
  initialVisibleBookings,
  bookingView,
  initialExpenses,
  initialSuppliers,
  initialSalesPeople,
  migrationPending = false,
  permissions,
  currentRole,
  isOwner,
  analyticsRange,
  initialControlPanel,
}: {
  mode?:
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
  initialTripStatusChanges?: {
    id: string;
    title: string;
    slug: string;
    listing_status: string;
    updated_at: string;
  }[];
  initialBookings: Booking[];
  initialVisibleBookings: Booking[];
  bookingView: BookingView;
  initialExpenses: Expense[];
  initialSuppliers: Supplier[];
  initialSalesPeople: SalesPerson[];
  migrationPending?: boolean;
  permissions: AdminPermission[];
  currentRole: AdminRole;
  isOwner: boolean;
  analyticsRange: 7 | 30 | 90;
  initialControlPanel:
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
}) {
  const router = useRouter();
  const [bookings, setBookings] = useState(initialBookings);
  const [visibleBookings, setVisibleBookings] = useState(
    initialVisibleBookings,
  );
  const [expenses, setExpenses] = useState(initialExpenses);
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [salesPeople, setSalesPeople] = useState(initialSalesPeople);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkPayment, setBulkPayment] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expense, setExpense] = useState({
    description: "",
    amount: "",
    category: "",
    date: today(),
    expense_type: "other",
    supplier_id: "",
    sales_person_id: "",
    booking_id: "",
  });
  const [partnerType, setPartnerType] = useState<PartnerType>("supplier");
  const [partner, setPartner] = useState({
    name: "",
    contact_name: "",
    phone: "",
    email: "",
    commission_percent: "",
    notes: "",
  });
  const [previewRole, setPreviewRole] = useState<AdminRole | "">("");
  const effectivePermissions = previewRole
    ? permissionsForAdminRole(previewRole)
    : permissions;
  const can = (permission: AdminPermission) =>
    effectivePermissions.includes(permission);

  const metrics = useMemo(() => {
    const active = bookings.filter(
      (booking) =>
        booking.status !== "cancelled" && booking.payment_status !== "refunded",
    );
    const projected = active.reduce(
      (sum, booking) => sum + Number(booking.amount),
      0,
    );
    const collected = bookings
      .filter((booking) => booking.payment_status === "paid")
      .reduce((sum, booking) => sum + Number(booking.amount), 0);
    const expenseTotal = expenses.reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );
    return {
      projected,
      collected,
      outstanding: projected - collected,
      expenseTotal,
      profit: collected - expenseTotal,
      activeCount: active.length,
      customers: countDistinctCustomers(bookings),
    };
  }, [bookings, expenses]);

  const services = useMemo(
    () =>
      [
        ...new Set(bookings.map((booking) => booking.tour_name || "Transfer")),
      ].sort(),
    [bookings],
  );
  const selectedIds = [...selected];
  const allVisibleSelected =
    Boolean(visibleBookings.length) &&
    visibleBookings.every((booking) => selected.has(booking.id));

  function feedback(message: string) {
    setNotice(message);
    setError("");
    window.setTimeout(() => setNotice(""), 3500);
  }

  function matchesBookingView(booking: Booking) {
    const nextMonthDate = new Date(`${bookingView.month}-01T00:00:00Z`);
    nextMonthDate.setUTCMonth(nextMonthDate.getUTCMonth() + 1);
    const nextMonth = nextMonthDate.toISOString().slice(0, 7);
    const matchesMonth = Boolean(
      booking.date &&
        booking.date >= `${bookingView.month}-01` &&
        booking.date < `${nextMonth}-01`,
    );
    const matchesStatus =
      bookingView.status === "all" || booking.status === bookingView.status;
    const matchesPayment =
      bookingView.payment === "all" ||
      booking.payment_status === bookingView.payment;
    const matchesType =
      bookingView.type === "all" || booking.type === bookingView.type;
    const matchesService =
      bookingView.service === "all" ||
      (booking.tour_name || "Transfer") === bookingView.service;
    const searchable = [
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
      .toLowerCase();
    return (
      matchesMonth &&
      matchesStatus &&
      matchesPayment &&
      matchesType &&
      matchesService &&
      (!bookingView.search ||
        searchable.includes(bookingView.search.toLowerCase()))
    );
  }

  async function updateBooking(
    id: string,
    patch: Partial<
      Pick<Booking, "status" | "payment_status" | "sales_person_id">
    >,
  ) {
    setBusyId(id);
    setError("");
    try {
      const result = await api<{
        booking: Booking;
        notification: { attempted: boolean; sent: boolean };
      }>(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      setBookings((items) =>
        items.map((item) => (item.id === id ? result.booking : item)),
      );
      setVisibleBookings((items) =>
        matchesBookingView(result.booking)
          ? items.map((item) => (item.id === id ? result.booking : item))
          : items.filter((item) => item.id !== id),
      );
      feedback(
        result.notification.attempted
          ? result.notification.sent
            ? "Booking updated and customer automatically emailed with the PDF."
            : "Booking updated, but the customer email could not be sent."
          : "Booking updated.",
      );
      router.refresh();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not update the booking.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function sendStatusEmail(booking: Booking) {
    if (!booking.customer_email) return;
    if (
      !window.confirm(
        `Resend ${booking.customer_email} the current booking and payment status email?\n\nBooking: ${booking.status}\nPayment: ${booking.payment_status}`,
      )
    )
      return;
    setBusyId(`email-${booking.id}`);
    setError("");
    try {
      await api<{ sent: true }>(`/api/admin/bookings/${booking.id}/email`, {
        method: "POST",
      });
      feedback(
        `Status email and customer PDF sent to ${booking.customer_email} from info@dailyredsea.com.`,
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not send the status email.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function deleteBooking(id: string, reference: string) {
    if (
      !window.confirm(
        `Permanently delete booking ${reference}? Use Cancelled instead when you need to keep its history.`,
      )
    )
      return;
    setBusyId(id);
    setError("");
    try {
      await api(`/api/admin/bookings/${id}`, { method: "DELETE" });
      setBookings((items) => items.filter((item) => item.id !== id));
      setVisibleBookings((items) => items.filter((item) => item.id !== id));
      setSelected((items) => {
        const next = new Set(items);
        next.delete(id);
        return next;
      });
      feedback(`Booking ${reference} deleted.`);
      router.refresh();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not delete the booking.",
      );
    } finally {
      setBusyId(null);
    }
  }

  function toggleBooking(id: string) {
    setSelected((items) => {
      const next = new Set(items);
      if (next.has(id)) next.delete(id);
      else if (next.size < 100) next.add(id);
      return next;
    });
  }
  function toggleVisible() {
    setSelected((items) => {
      const next = new Set(items);
      visibleBookings.forEach((booking) => {
        if (allVisibleSelected) next.delete(booking.id);
        else if (next.size < 100) next.add(booking.id);
      });
      return next;
    });
  }
  function bookingUrl(updates: Partial<BookingView>) {
    const next = { ...bookingView, ...updates };
    const params = new URLSearchParams();
    params.set("month", next.month);
    if (next.status !== "all") params.set("status", next.status);
    if (next.payment !== "all") params.set("payment", next.payment);
    if (next.type !== "all") params.set("type", next.type);
    if (next.service !== "all") params.set("service", next.service);
    if (next.search) params.set("search", next.search);
    if (analyticsRange !== 30) params.set("range", String(analyticsRange));
    if (next.supplier !== "all") params.set("supplier", next.supplier);
    if (next.expense_sort !== "none")
      params.set("expense_sort", next.expense_sort);
    return `/admin/bookings?${params.toString()}`;
  }

  function moveMonth(offset: number) {
    const [year, month] = bookingView.month.split("-").map(Number);
    const target = new Date(Date.UTC(year, month - 1 + offset, 1));
    router.push(
      bookingUrl({
        month: `${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, "0")}`,
      }),
    );
  }

  async function applyBulkAction() {
    if (!selectedIds.length || (!bulkStatus && !bulkPayment)) return;
    setBusyId("bulk");
    setError("");
    try {
      const patch = {
        ...(bulkStatus ? { status: bulkStatus } : {}),
        ...(bulkPayment ? { payment_status: bulkPayment } : {}),
      };
      const result = await api<{
        bookings: Booking[];
        updated: number;
        notifications: { attempted: number; sent: number };
      }>("/api/admin/bookings/bulk", {
        method: "PATCH",
        body: JSON.stringify({ ids: selectedIds, ...patch }),
      });
      const changed = new Map(
        result.bookings.map((booking) => [booking.id, booking]),
      );
      setBookings((items) =>
        items.map((booking) => changed.get(booking.id) || booking),
      );
      setVisibleBookings((items) =>
        items
          .map((booking) => changed.get(booking.id) || booking)
          .filter(matchesBookingView),
      );
      const emailNote = result.notifications.attempted
        ? ` ${result.notifications.sent} of ${result.notifications.attempted} customer emails sent automatically.`
        : " No customer status changed.";
      setSelected(new Set());
      setBulkStatus("");
      setBulkPayment("");
      feedback(
        `${result.updated} booking${result.updated === 1 ? "" : "s"} updated.${emailNote}`,
      );
      router.refresh();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not update the selected bookings.",
      );
    } finally {
      setBusyId(null);
    }
  }

  function selectedReport(format: "pdf" | "xlsx") {
    return `/api/admin/reports?format=${format}&from=1900-01-01&to=2999-12-31&trip=all&status=all&payment=all&ids=${encodeURIComponent(selectedIds.join(","))}`;
  }
  function singleReport(id: string, format: "pdf" | "xlsx") {
    return `/api/admin/reports?format=${format}&from=1900-01-01&to=2999-12-31&trip=all&status=all&payment=all&ids=${id}`;
  }

  async function addExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyId("expense");
    setError("");
    try {
      const result = await api<{ expense: Expense; warning?: string }>(
        "/api/admin/expenses",
        { method: "POST", body: JSON.stringify(expense) },
      );
      setExpenses((items) => [result.expense, ...items]);
      setExpense({
        description: "",
        amount: "",
        category: "",
        date: today(),
        expense_type: "other",
        supplier_id: "",
        sales_person_id: "",
        booking_id: "",
      });
      feedback(result.warning || "Expense saved.");
      router.refresh();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not save the expense.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function deleteExpense(item: Expense) {
    if (!window.confirm(`Delete expense “${item.description}”?`)) return;
    setBusyId(`expense-${item.id}`);
    setError("");
    try {
      await api(`/api/admin/expenses/${item.id}`, { method: "DELETE" });
      setExpenses((items) =>
        items.filter((expenseItem) => expenseItem.id !== item.id),
      );
      feedback("Expense deleted.");
      router.refresh();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not delete the expense.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function addPartner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyId("partner");
    setError("");
    try {
      const result = await api<{
        partner: Supplier | SalesPerson;
        type: PartnerType;
      }>("/api/admin/partners", {
        method: "POST",
        body: JSON.stringify({ ...partner, type: partnerType }),
      });
      if (result.type === "supplier")
        setSuppliers((items) =>
          [...items, result.partner as Supplier].sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
        );
      else
        setSalesPeople((items) =>
          [...items, result.partner as SalesPerson].sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
        );
      setPartner({
        name: "",
        contact_name: "",
        phone: "",
        email: "",
        commission_percent: "",
        notes: "",
      });
      feedback(
        `${partnerType === "supplier" ? "Supplier" : "Sales person"} created.`,
      );
      router.refresh();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not create this record.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function deletePartner(type: PartnerType, id: string, name: string) {
    if (
      !window.confirm(`Delete ${name}? Existing expense records will be kept.`)
    )
      return;
    setBusyId(`partner-${id}`);
    setError("");
    try {
      await api(`/api/admin/partners/${type}/${id}`, { method: "DELETE" });
      if (type === "supplier")
        setSuppliers((items) => items.filter((item) => item.id !== id));
      else setSalesPeople((items) => items.filter((item) => item.id !== id));
      feedback("Record deleted.");
      router.refresh();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not delete this record.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function signOut() {
    setBusyId("logout");
    try {
      await api("/api/admin/logout", { method: "POST" });
    } catch {
      /* A local redirect still clears access to the dashboard UI. */
    } finally {
      window.location.assign("/admin/login");
    }
  }

  if (mode === "overview") {
    const upcoming = bookings
      .filter(
        (item) =>
          item.status !== "cancelled" && item.date && item.date >= today(),
      )
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .slice(0, 6);
    const pending = bookings.filter((item) => item.status === "new");
    return (
      <div className="mt-7 space-y-6">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <Metric
            icon={<UsersRound size={18} />}
            label="Customers"
            value={String(metrics.customers)}
            note="Distinct booking contacts"
            tone="blue"
          />
          <Metric
            icon={<CircleDollarSign size={18} />}
            label="Booked revenue"
            value={money(metrics.projected)}
            note="Active bookings"
            tone="emerald"
          />
          <Metric
            icon={<WalletCards size={18} />}
            label="Cash collected"
            value={money(metrics.collected)}
            note="Marked paid"
            tone="emerald"
          />
          <Metric
            icon={<CalendarDays size={18} />}
            label="Outstanding"
            value={money(metrics.outstanding)}
            note="Expected cash"
            tone="amber"
          />
          <Metric
            icon={<ClipboardList size={18} />}
            label="Expenses"
            value={money(metrics.expenseTotal)}
            note="Recorded costs"
            tone="rose"
          />
          <Metric
            icon={<CheckCircle2 size={18} />}
            label="Cash profit"
            value={money(metrics.profit)}
            note="Collected minus expenses"
            tone="slate"
          />
        </div>
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex justify-between">
            <div>
              <h2 className="text-xl font-black">Upcoming bookings</h2>
              <p className="text-sm text-slate-500">
                Open a booking to assign its supplier and add or edit expenses.
              </p>
            </div>
            <Link href="/admin/bookings" className="font-bold text-blue-700">
              Manage all
            </Link>
          </div>
          <div className="mt-4 divide-y">
            {upcoming.map((item) => (
              <button
                key={item.id}
                onClick={() => setExpandedId(item.id)}
                className="flex w-full justify-between py-3 text-left"
              >
                <span>
                  <b className="font-mono text-blue-700">{item.reference}</b>
                  <span className="ml-3">{item.tour_name || "Transfer"}</span>
                </span>
                <span className="text-slate-500">{item.date}</span>
              </button>
            ))}
            {!upcoming.length ? (
              <p className="py-5 text-slate-500">No upcoming bookings.</p>
            ) : null}
          </div>
        </section>
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black">Pending confirmations</h2>
            <div className="mt-3 space-y-2">
              {pending.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setExpandedId(item.id)}
                  className="block"
                >
                  <b>{item.reference}</b> · {item.customer_name}
                </button>
              ))}
              {!pending.length ? (
                <p className="text-slate-500">Nothing pending.</p>
              ) : null}
            </div>
          </section>
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black">Recent trip-status changes</h2>
            <div className="mt-3 space-y-2">
              {initialTripStatusChanges.map((item) => (
                <p key={item.id}>
                  <b>{item.title}</b> ·{" "}
                  <span className="capitalize">
                    {item.listing_status === "active"
                      ? "reactivated"
                      : item.listing_status}
                  </span>
                </p>
              ))}
              {!initialTripStatusChanges.length ? (
                <p className="text-slate-500">
                  No recent trip visibility changes.
                </p>
              ) : null}
            </div>
          </section>
        </div>
        {expandedId ? (
          <BookingDetailPanel
            booking={bookings.find((item) => item.id === expandedId)!}
            onClose={() => setExpandedId(null)}
          />
        ) : null}
      </div>
    );
  }

  return (
    <>
      <div className="mt-7 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <span className="text-sm font-bold capitalize text-slate-600">
          {mode}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {isOwner ? (
            <label className="text-xs font-bold text-slate-600">
              Preview staff access
              <select
                aria-label="Preview staff role access"
                value={previewRole}
                onChange={(event) =>
                  setPreviewRole(event.target.value as AdminRole | "")
                }
                className="ml-2 rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm"
              >
                <option value="">Owner (live)</option>
                {adminRoles
                  .filter((role) => role !== "owner")
                  .map((role) => (
                    <option key={role} value={role}>
                      {role.replace("_", " ")}
                    </option>
                  ))}
              </select>
            </label>
          ) : (
            <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold capitalize">
              {currentRole.replace("_", " ")}
            </span>
          )}
          <button
            type="button"
            onClick={signOut}
            disabled={busyId === "logout"}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:border-slate-500 disabled:opacity-50"
          >
            <LogOut size={16} />
            {busyId === "logout" ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>

      {previewRole ? (
        <div className="mt-4 rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-950">
          <strong>Preview only:</strong> this is what a{" "}
          {previewRole.replace("_", " ")} can see. Your owner session and data
          are unchanged.
        </div>
      ) : null}

      {mode === "analytics" && can("finance") ? (
        <section id="analytics" className="mt-8 scroll-mt-6">
          <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-sm sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-300">
              Marketing intelligence
            </p>
            <h2 className="mt-2 text-3xl font-black sm:text-4xl">
              Analytics & advertising
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Website audiences, booking demand, and Google Ads performance in
              the same admin workspace.
            </p>
          </div>
          <TopServicesPanel range={analyticsRange} />
          <GoogleAnalyticsPanel />
          <GoogleAdsPanel range={analyticsRange} />
        </section>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800"
        >
          {error}
        </div>
      ) : null}
      {notice ? (
        <div
          role="status"
          className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800"
        >
          {notice}
        </div>
      ) : null}
      {migrationPending ? (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
        >
          <p className="font-black">Admin database upgrade pending</p>
          <p className="mt-1 leading-6">
            Basic expenses can still be saved. Supplier expenses, sales
            commissions, supplier records, and sales people will work after
            migration{" "}
            <code className="font-mono">
              202607260001_admin_partners_and_expenses.sql
            </code>{" "}
            is applied in Supabase.
          </p>
        </div>
      ) : null}

      {mode === "finance" && can("finance") && visibleBookings.length ? (
        <div className="mt-8 overflow-x-auto rounded-3xl bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-black">Booking costs and margins</h2>
          <p className="mt-1 text-sm text-slate-500">
            Linked expenses and supplier fulfillment for the filtered booking
            view.
          </p>
          <table className="mt-5 w-full min-w-[680px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="p-3">Booking</th>
                <th className="p-3">Supplier</th>
                <th className="p-3">Revenue</th>
                <th className="p-3">Expenses</th>
                <th className="p-3">Margin</th>
              </tr>
            </thead>
            <tbody>
              {visibleBookings.map((booking) => (
                <tr key={`finance-${booking.id}`} className="border-t">
                  <td className="p-3 font-mono font-bold text-blue-700">
                    {booking.reference}
                  </td>
                  <td className="p-3">
                    {booking.supplier_name || "Unassigned"}
                  </td>
                  <td className="p-3">
                    {money(Number(booking.amount), booking.currency)}
                  </td>
                  <td className="p-3">
                    {money(
                      Number(booking.expense_total || 0),
                      booking.currency,
                    )}
                  </td>
                  <td className="p-3 font-bold text-emerald-700">
                    {money(
                      Number(booking.amount) -
                        Number(booking.expense_total || 0),
                      booking.currency,
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="mt-10 grid gap-8 xl:grid-cols-[1.7fr_0.8fr]">
        {mode === "bookings" && can("bookings") ? (
          <section
            id="bookings"
            className="scroll-mt-6 rounded-3xl bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Bookings</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Search, confirm availability, record cash, or cancel a
                  request.
                </p>
              </div>
              <p className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                {visibleBookings.length} shown
              </p>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <button
                type="button"
                onClick={() => moveMonth(-1)}
                aria-label="View previous month"
                className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-slate-400"
              >
                <ChevronLeft size={19} />
              </button>
              <div className="min-w-44 text-center">
                <p className="inline-flex items-center gap-2 text-lg font-black text-slate-900">
                  <CalendarDays size={19} className="text-cyan-700" />
                  {new Intl.DateTimeFormat("en", {
                    month: "long",
                    year: "numeric",
                    timeZone: "UTC",
                  }).format(new Date(`${bookingView.month}-01T00:00:00Z`))}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Scheduled booking date
                </p>
              </div>
              <button
                type="button"
                onClick={() => moveMonth(1)}
                aria-label="View next month"
                className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-slate-400"
              >
                <ChevronRight size={19} />
              </button>
              <label className="ml-auto text-xs font-bold text-slate-600">
                Jump to month
                <input
                  type="month"
                  value={bookingView.month}
                  onChange={(event) =>
                    event.target.value &&
                    router.push(bookingUrl({ month: event.target.value }))
                  }
                  className="ml-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900"
                />
              </label>
            </div>
            <form
              action="/admin/bookings"
              className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6"
            >
              <input type="hidden" name="month" value={bookingView.month} />
              <label className="relative xl:col-span-2">
                <span className="sr-only">Search bookings</span>
                <Search
                  className="absolute left-3 top-3 text-slate-400"
                  size={18}
                />
                <input
                  name="search"
                  defaultValue={bookingView.search}
                  placeholder="Search reference, guest, phone, trip, hotel…"
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 outline-none focus:border-cyan-500"
                />
              </label>
              <select
                aria-label="Booking status filter"
                name="status"
                defaultValue={bookingView.status}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium"
              >
                <option value="all">All statuses</option>
                <option value="new">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                aria-label="Payment status filter"
                name="payment"
                defaultValue={bookingView.payment}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium"
              >
                <option value="all">All payments</option>
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
                <option value="refunded">Refunded</option>
              </select>
              <select
                aria-label="Booking type filter"
                name="type"
                defaultValue={bookingView.type}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium"
              >
                <option value="all">Tours & transfers</option>
                <option value="tour">Tours</option>
                <option value="transfer">Transfers</option>
              </select>
              <select
                aria-label="Service filter"
                name="service"
                defaultValue={bookingView.service}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium"
              >
                <option value="all">All services</option>
                {services.map((service) => (
                  <option key={service}>{service}</option>
                ))}
              </select>
              {can("finance") ? (
                <>
                  <select
                    aria-label="Supplier filter"
                    name="supplier"
                    defaultValue={bookingView.supplier}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium"
                  >
                    <option value="all">All suppliers</option>
                    {suppliers.map((item) => (
                      <option key={item.id}>{item.name}</option>
                    ))}
                  </select>
                  <select
                    aria-label="Expense sorting"
                    name="expense_sort"
                    defaultValue={bookingView.expense_sort}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium"
                  >
                    <option value="none">Default order</option>
                    <option value="highest">Highest cost first</option>
                    <option value="lowest">Lowest cost first</option>
                  </select>
                </>
              ) : null}
              <div className="flex gap-2 xl:col-span-6">
                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white"
                >
                  Apply filters
                </button>
                <Link
                  href={bookingUrl({
                    status: "all",
                    payment: "all",
                    type: "all",
                    service: "all",
                    search: "",
                  })}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold"
                >
                  Clear filters
                </Link>
              </div>
            </form>

            <div
              className={`mt-5 rounded-2xl border p-4 ${selectedIds.length ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-slate-50"}`}
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 text-sm font-black">
                  <ListChecks size={17} />
                  {selectedIds.length} selected
                </span>
                <select
                  aria-label="Group booking status"
                  value={bulkStatus}
                  onChange={(event) => setBulkStatus(event.target.value)}
                  disabled={!selectedIds.length}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm capitalize disabled:opacity-50"
                >
                  <option value="">Keep booking status</option>
                  {["new", "confirmed", "completed", "cancelled"].map(
                    (item) => (
                      <option key={item}>{item}</option>
                    ),
                  )}
                </select>
                <select
                  aria-label="Group payment status"
                  value={bulkPayment}
                  onChange={(event) => setBulkPayment(event.target.value)}
                  disabled={!selectedIds.length}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm capitalize disabled:opacity-50"
                >
                  <option value="">Keep payment status</option>
                  {["unpaid", "paid", "refunded"].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={applyBulkAction}
                  disabled={
                    !selectedIds.length ||
                    (!bulkStatus && !bulkPayment) ||
                    busyId === "bulk"
                  }
                  className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
                >
                  {busyId === "bulk" ? "Updating…" : "Apply to selected"}
                </button>
                <a
                  aria-disabled={!selectedIds.length}
                  href={selectedIds.length ? selectedReport("pdf") : undefined}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold aria-disabled:pointer-events-none aria-disabled:opacity-40"
                >
                  <Download size={15} /> PDF
                </a>
                <a
                  aria-disabled={!selectedIds.length}
                  href={selectedIds.length ? selectedReport("xlsx") : undefined}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold aria-disabled:pointer-events-none aria-disabled:opacity-40"
                >
                  <Download size={15} /> Excel
                </a>
                {selectedIds.length ? (
                  <button
                    type="button"
                    onClick={() => setSelected(new Set())}
                    className="text-sm font-bold text-slate-600"
                  >
                    Clear selection
                  </button>
                ) : null}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Select up to 100 bookings, then update them together or download
                only those records.
              </p>
            </div>

            <div className="mt-5 hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1120px] text-left text-sm">
                <thead className="border-b text-slate-500">
                  <tr>
                    <th className="p-3">
                      <input
                        type="checkbox"
                        aria-label="Select all filtered bookings"
                        checked={allVisibleSelected}
                        onChange={toggleVisible}
                      />
                    </th>
                    <th className="p-3">Reference & customer</th>
                    <th className="p-3">Trip, pickup & sales</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Booking</th>
                    <th className="p-3">Payment</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleBookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className={`border-b align-top ${selected.has(booking.id) ? "bg-blue-50/60" : ""}`}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          aria-label={`Select ${booking.reference}`}
                          checked={selected.has(booking.id)}
                          onChange={() => toggleBooking(booking.id)}
                        />
                      </td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(
                              expandedId === booking.id ? null : booking.id,
                            )
                          }
                          className="font-mono font-bold text-blue-700 hover:underline"
                        >
                          {booking.reference}
                        </button>
                        <p className="mt-1 font-semibold">
                          {booking.customer_name}
                        </p>
                        <ContactLinks booking={booking} />
                        {expandedId === booking.id && booking.notes ? (
                          <p className="mt-2 max-w-xs whitespace-pre-line rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
                            {booking.notes}
                          </p>
                        ) : null}
                      </td>
                      <td className="p-3">
                        <p className="font-medium">
                          {booking.tour_name || "Transfer"}
                        </p>
                        <p className="mt-1 text-slate-500">
                          {booking.date || "Date to confirm"} ·{" "}
                          {booking.guests || 0} people
                        </p>
                        {booking.hotel ? (
                          <p className="mt-1 max-w-xs text-xs text-slate-500">
                            Pickup: {booking.hotel}
                          </p>
                        ) : null}
                        <select
                          aria-label={`Sales person for ${booking.reference}`}
                          value={booking.sales_person_id || ""}
                          disabled={busyId === booking.id}
                          onChange={(event) =>
                            updateBooking(booking.id, {
                              sales_person_id: event.target.value || null,
                            })
                          }
                          className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs"
                        >
                          <option value="">No sales person</option>
                          {salesPeople.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} ·{" "}
                              {Number(item.commission_percent || 0)}%
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3 font-semibold">
                        {money(Number(booking.amount), booking.currency)}
                      </td>
                      <td className="p-3">
                        <StatusSelect
                          value={booking.status}
                          disabled={busyId === booking.id}
                          onChange={(value) =>
                            updateBooking(booking.id, {
                              status: value as Status,
                            })
                          }
                          options={[
                            "new",
                            "confirmed",
                            "completed",
                            "cancelled",
                          ]}
                        />
                      </td>
                      <td className="p-3">
                        <StatusSelect
                          value={booking.payment_status}
                          disabled={busyId === booking.id}
                          onChange={(value) =>
                            updateBooking(booking.id, {
                              payment_status: value as PaymentStatus,
                            })
                          }
                          options={["unpaid", "paid", "refunded"]}
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            aria-label={`Resend email status for ${booking.reference}`}
                            title={
                              booking.customer_email
                                ? "Resend status email with customer PDF"
                                : "Customer email unavailable"
                            }
                            disabled={
                              !booking.customer_email ||
                              busyId === `email-${booking.id}`
                            }
                            onClick={() => sendStatusEmail(booking)}
                            className="inline-flex whitespace-nowrap rounded-lg px-2 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Send size={16} className="mr-1.5" /> Resend + PDF
                          </button>
                          <a
                            href={`/api/admin/bookings/${booking.id}/status-pdf`}
                            aria-label={`Download customer status PDF ${booking.reference}`}
                            title="Download customer status PDF"
                            className="rounded-lg p-2 text-slate-500 hover:bg-cyan-50 hover:text-cyan-700"
                          >
                            <FileText size={17} />
                          </a>
                          <a
                            href={singleReport(booking.id, "pdf")}
                            aria-label={`Download report ${booking.reference}`}
                            title="Download internal PDF report"
                            className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                          >
                            <Download size={17} />
                          </a>
                          <button
                            type="button"
                            onClick={() => setExpandedId(booking.id)}
                            className="inline-flex whitespace-nowrap rounded-lg bg-amber-50 px-2 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100"
                          >
                            Details, supplier & expenses
                          </button>
                          <button
                            aria-label={`Delete ${booking.reference}`}
                            title="Delete permanently"
                            disabled={busyId === booking.id}
                            onClick={() =>
                              deleteBooking(booking.id, booking.reference)
                            }
                            className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-40"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 space-y-4 lg:hidden">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleVisible}
                />{" "}
                Select all filtered bookings
              </label>
              {visibleBookings.map((booking) => (
                <article
                  key={booking.id}
                  className={`rounded-2xl border p-4 ${selected.has(booking.id) ? "border-blue-300 bg-blue-50" : "border-slate-200"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        aria-label={`Select ${booking.reference}`}
                        checked={selected.has(booking.id)}
                        onChange={() => toggleBooking(booking.id)}
                        className="mt-1"
                      />
                      <div>
                        <button
                          type="button"
                          onClick={() => setExpandedId(booking.id)}
                          className="font-mono text-sm font-bold text-blue-700 hover:underline"
                        >
                          {booking.reference}
                        </button>
                        <h3 className="mt-1 font-bold">
                          {booking.customer_name}
                        </h3>
                      </div>
                    </div>
                    <p className="font-black">
                      {money(Number(booking.amount), booking.currency)}
                    </p>
                  </div>
                  <p className="mt-3 font-medium">
                    {booking.tour_name || "Transfer"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {booking.date || "Date to confirm"} · {booking.guests || 0}{" "}
                    people
                  </p>
                  {booking.hotel ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Pickup: {booking.hotel}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setExpandedId(booking.id)}
                    className="mt-3 w-full rounded-xl bg-amber-50 px-3 py-2 text-sm font-bold text-amber-800"
                  >
                    Details, supplier & expenses
                  </button>
                  <select
                    aria-label={`Sales person for ${booking.reference}`}
                    value={booking.sales_person_id || ""}
                    disabled={busyId === booking.id}
                    onChange={(event) =>
                      updateBooking(booking.id, {
                        sales_person_id: event.target.value || null,
                      })
                    }
                    className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">No sales person</option>
                    {salesPeople.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} · {Number(item.commission_percent || 0)}%
                      </option>
                    ))}
                  </select>
                  <ContactLinks booking={booking} />
                  {booking.notes ? (
                    <details className="mt-3 text-sm">
                      <summary className="cursor-pointer font-semibold text-slate-600">
                        Customer notes
                      </summary>
                      <p className="mt-2 whitespace-pre-line rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                        {booking.notes}
                      </p>
                    </details>
                  ) : null}
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <StatusSelect
                      value={booking.status}
                      disabled={busyId === booking.id}
                      onChange={(value) =>
                        updateBooking(booking.id, { status: value as Status })
                      }
                      options={["new", "confirmed", "completed", "cancelled"]}
                    />
                    <StatusSelect
                      value={booking.payment_status}
                      disabled={busyId === booking.id}
                      onChange={(value) =>
                        updateBooking(booking.id, {
                          payment_status: value as PaymentStatus,
                        })
                      }
                      options={["unpaid", "paid", "refunded"]}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    <button
                      type="button"
                      onClick={() => sendStatusEmail(booking)}
                      disabled={
                        !booking.customer_email ||
                        busyId === `email-${booking.id}`
                      }
                      className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 disabled:opacity-40"
                    >
                      <Send size={14} /> Resend email + PDF
                    </button>
                    <a
                      href={`/api/admin/bookings/${booking.id}/status-pdf`}
                      className="inline-flex items-center gap-2 text-xs font-bold text-cyan-700"
                    >
                      <FileText size={14} /> Customer PDF
                    </a>
                    <a
                      href={singleReport(booking.id, "pdf")}
                      className="inline-flex items-center gap-2 text-xs font-bold text-blue-700"
                    >
                      <Download size={14} /> Internal report
                    </a>
                    <button
                      type="button"
                      onClick={() =>
                        deleteBooking(booking.id, booking.reference)
                      }
                      disabled={busyId === booking.id}
                      className="inline-flex items-center gap-2 text-xs font-bold text-rose-700 disabled:opacity-40"
                    >
                      <Trash2 size={14} /> Delete permanently
                    </button>
                  </div>
                </article>
              ))}
            </div>
            {!visibleBookings.length ? (
              <div className="py-12 text-center">
                <Search className="mx-auto text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-600">
                  No bookings match this search and filter.
                </p>
              </div>
            ) : null}
          </section>
        ) : null}

        {mode === "finance" && can("finance") ? (
          <aside
            id="expenses"
            className="h-fit scroll-mt-6 rounded-3xl bg-white p-6 shadow-sm"
          >
            <h2 className="text-2xl font-bold">Expenses</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Use a predefined cost type, then connect trip costs to a supplier,
              sales person, or booking.
            </p>
            <form className="mt-6 space-y-4" onSubmit={addExpense}>
              <label className="block text-sm font-semibold">
                Expense type
                <select
                  value={expense.expense_type}
                  onChange={(event) =>
                    setExpense({
                      ...expense,
                      expense_type: event.target.value,
                      description:
                        expenseOptions.find(
                          ([value]) => value === event.target.value,
                        )?.[1] || expense.description,
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 font-normal"
                >
                  {expenseOptions.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold">
                Description
                <input
                  required
                  maxLength={200}
                  value={expense.description}
                  onChange={(event) =>
                    setExpense({ ...expense, description: event.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-normal"
                  placeholder="What was paid for?"
                />
              </label>
              <label className="block text-sm font-semibold">
                Amount (USD)
                <input
                  required
                  type="number"
                  min="0.01"
                  max="1000000"
                  step="0.01"
                  value={expense.amount}
                  onChange={(event) =>
                    setExpense({ ...expense, amount: event.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-normal"
                  placeholder="0.00"
                />
              </label>
              {expense.expense_type === "supplier_per_trip" ? (
                <label className="block text-sm font-semibold">
                  Supplier
                  <select
                    required
                    value={expense.supplier_id}
                    onChange={(event) =>
                      setExpense({
                        ...expense,
                        supplier_id: event.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 font-normal"
                  >
                    <option value="">Choose supplier</option>
                    {suppliers.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              {expense.expense_type === "sales_commission" ? (
                <label className="block text-sm font-semibold">
                  Sales person
                  <select
                    required
                    value={expense.sales_person_id}
                    onChange={(event) =>
                      setExpense({
                        ...expense,
                        sales_person_id: event.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 font-normal"
                  >
                    <option value="">Choose sales person</option>
                    {salesPeople.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              {["supplier_per_trip", "sales_commission"].includes(
                expense.expense_type,
              ) ? (
                <label className="block text-sm font-semibold">
                  Booking{" "}
                  <span className="font-normal text-slate-400">optional</span>
                  <select
                    value={expense.booking_id}
                    onChange={(event) =>
                      setExpense({ ...expense, booking_id: event.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 font-normal"
                  >
                    <option value="">No booking selected</option>
                    {bookings
                      .filter((item) => item.status !== "cancelled")
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.reference} · {item.tour_name || "Transfer"}
                        </option>
                      ))}
                  </select>
                </label>
              ) : null}
              <label className="block text-sm font-semibold">
                Category{" "}
                <span className="font-normal text-slate-400">optional</span>
                <input
                  maxLength={80}
                  value={expense.category}
                  onChange={(event) =>
                    setExpense({ ...expense, category: event.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-normal"
                  placeholder="Internal label"
                />
              </label>
              <label className="block text-sm font-semibold">
                Date
                <input
                  required
                  type="date"
                  value={expense.date}
                  onChange={(event) =>
                    setExpense({ ...expense, date: event.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-normal"
                />
              </label>
              <button
                disabled={busyId === "expense"}
                className="w-full rounded-xl bg-slate-900 py-3 font-bold text-white hover:bg-slate-700 disabled:opacity-60"
              >
                {busyId === "expense" ? "Saving…" : "Save expense"}
              </button>
            </form>
            {expenses.length ? (
              <div className="mt-7 border-t pt-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">Recent expenses</p>
                  <p className="text-xs text-slate-500">
                    {expenses.length} total
                  </p>
                </div>
                <div className="mt-3 space-y-3">
                  {expenses.slice(0, 8).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 p-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">{item.description}</p>
                        <p className="text-xs text-slate-500">
                          {expenseOptions.find(
                            ([value]) => value === item.expense_type,
                          )?.[1] ||
                            item.category ||
                            "Other"}{" "}
                          · {item.expense_date}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">
                          {money(Number(item.amount), item.currency)}
                        </p>
                        <button
                          type="button"
                          aria-label={`Delete expense ${item.description}`}
                          onClick={() => deleteExpense(item)}
                          disabled={busyId === `expense-${item.id}`}
                          className="rounded p-1 text-slate-400 hover:bg-rose-100 hover:text-rose-700 disabled:opacity-40"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-7 border-t pt-5 text-sm text-slate-500">
                No expenses recorded yet.
              </p>
            )}
          </aside>
        ) : null}
      </div>

      {mode === "trips" && can("content") ? (
        <AdminControlCenter initialTab="content" variant="trips" />
      ) : null}
      {mode === "content" &&
      (can("content") || can("settings") || can("operations")) ? (
        <AdminControlCenter
          initialTab={initialControlPanel}
          variant="content"
        />
      ) : null}
      {mode === "policies" && can("settings") ? (
        <AdminControlCenter initialTab="settings" variant="content" />
      ) : null}
      {mode === "currency" && (can("finance") || can("settings")) ? (
        <AdminControlCenter initialTab="settings" variant="content" />
      ) : null}
      {mode === "customers" &&
      (can("bookings") || can("operations")) ? (
        <AdminControlCenter initialTab="notes" variant="content" />
      ) : null}
      {mode === "operations" &&
      (can("operations") || can("staff") || can("settings")) ? (
        <AdminOperationsCenter />
      ) : null}
      {mode === "suppliers" && (can("suppliers") || can("finance")) ? (
        <section
          id="partners"
          className="mt-8 scroll-mt-6 rounded-3xl bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="flex items-start gap-3">
            <UsersRound className="mt-1 text-cyan-700" size={24} />
            <div>
              <h2 className="text-2xl font-bold">Suppliers & sales people</h2>
              <p className="mt-1 text-sm text-slate-500">
                Create reusable contacts and attach them to expenses.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <form
              onSubmit={addPartner}
              className="space-y-4 rounded-2xl bg-slate-50 p-4"
            >
              <label className="block text-sm font-semibold">
                Record type
                <select
                  value={partnerType}
                  onChange={(event) =>
                    setPartnerType(event.target.value as PartnerType)
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 font-normal"
                >
                  <option value="supplier">Supplier</option>
                  <option value="sales_person">Sales person</option>
                </select>
              </label>
              <label className="block text-sm font-semibold">
                Name
                <input
                  required
                  maxLength={120}
                  value={partner.name}
                  onChange={(event) =>
                    setPartner({ ...partner, name: event.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-normal"
                />
              </label>
              {partnerType === "supplier" ? (
                <label className="block text-sm font-semibold">
                  Contact person
                  <input
                    maxLength={120}
                    value={partner.contact_name}
                    onChange={(event) =>
                      setPartner({
                        ...partner,
                        contact_name: event.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-normal"
                  />
                </label>
              ) : (
                <label className="block text-sm font-semibold">
                  Commission %{" "}
                  <span className="font-normal text-slate-400">optional</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={partner.commission_percent}
                    onChange={(event) =>
                      setPartner({
                        ...partner,
                        commission_percent: event.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-normal"
                  />
                </label>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold">
                  Phone
                  <input
                    maxLength={40}
                    value={partner.phone}
                    onChange={(event) =>
                      setPartner({ ...partner, phone: event.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-normal"
                  />
                </label>
                <label className="block text-sm font-semibold">
                  Email
                  <input
                    type="email"
                    maxLength={160}
                    value={partner.email}
                    onChange={(event) =>
                      setPartner({ ...partner, email: event.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-normal"
                  />
                </label>
              </div>
              <label className="block text-sm font-semibold">
                Notes{" "}
                <span className="font-normal text-slate-400">optional</span>
                <textarea
                  maxLength={500}
                  value={partner.notes}
                  onChange={(event) =>
                    setPartner({ ...partner, notes: event.target.value })
                  }
                  className="mt-1 min-h-24 w-full rounded-xl border border-slate-200 p-3 font-normal"
                />
              </label>
              <button
                disabled={busyId === "partner"}
                className="w-full rounded-xl bg-cyan-700 py-3 font-bold text-white hover:bg-cyan-800 disabled:opacity-60"
              >
                {busyId === "partner"
                  ? "Saving…"
                  : `Create ${partnerType === "supplier" ? "supplier" : "sales person"}`}
              </button>
            </form>
            <div className="grid gap-6 md:grid-cols-2">
              <PartnerList
                title="Suppliers"
                empty="No suppliers yet."
                items={suppliers.map((item) => ({
                  id: item.id,
                  name: item.name,
                  detail:
                    item.contact_name ||
                    item.phone ||
                    item.email ||
                    "No contact details",
                }))}
                busyId={busyId}
                onDelete={(id, name) => deletePartner("supplier", id, name)}
              />
              <PartnerList
                title="Sales people"
                empty="No sales people yet."
                items={salesPeople.map((item) => ({
                  id: item.id,
                  name: item.name,
                  detail:
                    item.commission_percent != null
                      ? `${item.commission_percent}% commission`
                      : item.phone || item.email || "No commission set",
                }))}
                busyId={busyId}
                onDelete={(id, name) => deletePartner("sales_person", id, name)}
              />
            </div>
          </div>
          <SalesPerformancePanel
            salesPeople={salesPeople}
            bookings={bookings}
            expenses={expenses}
          />
        </section>
      ) : null}
      {mode === "reports" && can("reports") ? (
        <div id="reports" className="scroll-mt-6">
          <SituationReports bookings={bookings} />
        </div>
      ) : null}
      {mode === "bookings" && expandedId ? (
        <BookingDetailPanel
          booking={
            bookings.find((item) => item.id === expandedId) ||
            visibleBookings.find((item) => item.id === expandedId)!
          }
          onClose={() => setExpandedId(null)}
        />
      ) : null}
    </>
  );
}

function SalesPerformancePanel({
  salesPeople,
  bookings,
  expenses,
}: {
  salesPeople: SalesPerson[];
  bookings: Booking[];
  expenses: Expense[];
}) {
  const rows = salesPeople.map((person) => {
    const sales = bookings.filter(
      (booking) =>
        booking.sales_person_id === person.id &&
        booking.status !== "cancelled" &&
        booking.payment_status !== "refunded",
    );
    const total = sales.reduce(
      (sum, booking) => sum + Number(booking.amount || 0),
      0,
    );
    const earned = sales.reduce(
      (sum, booking) =>
        sum +
        (Number(booking.amount || 0) *
          Number(
            booking.sales_commission_percent ?? person.commission_percent ?? 0,
          )) /
          100,
      0,
    );
    const paid = expenses
      .filter(
        (item) =>
          item.expense_type === "sales_commission" &&
          item.sales_person_id === person.id,
      )
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    return {
      person,
      sales,
      total,
      earned,
      paid,
      outstanding: Math.max(0, earned - paid),
    };
  });
  return (
    <div className="mt-8 border-t pt-6">
      <div>
        <h3 className="text-xl font-black">Sales performance</h3>
        <p className="mt-1 text-sm text-slate-500">
          Active assigned bookings and commission based on the rate saved when
          each booking is assigned. Record commission payments in Expenses.
        </p>
      </div>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Sales person</th>
              <th className="p-3">Sales</th>
              <th className="p-3">Bookings</th>
              <th className="p-3">Commission earned</th>
              <th className="p-3">Paid</th>
              <th className="p-3">Outstanding</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ person, sales, total, earned, paid, outstanding }) => (
              <tr key={person.id} className="border-t">
                <td className="p-3">
                  <strong>{person.name}</strong>
                  <br />
                  <span className="text-xs text-slate-500">
                    Default {Number(person.commission_percent || 0)}%
                  </span>
                </td>
                <td className="p-3 font-bold">{money(total)}</td>
                <td className="p-3">{sales.length}</td>
                <td className="p-3">{money(earned)}</td>
                <td className="p-3 text-emerald-700">{money(paid)}</td>
                <td className="p-3 font-bold text-amber-700">
                  {money(outstanding)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length ? (
          <p className="p-6 text-center text-slate-500">
            Create a sales person to begin tracking performance.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ContactLinks({ booking }: { booking: Booking }) {
  const phone = booking.phone.replace(/\D/g, "");
  return (
    <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold">
      <a
        className="inline-flex items-center gap-1 text-emerald-700 hover:underline"
        href={`https://wa.me/${phone}`}
        target="_blank"
        rel="noreferrer"
      >
        WhatsApp <ExternalLink size={12} />
      </a>
      {booking.customer_email ? (
        <a
          className="inline-flex items-center gap-1 text-blue-700 hover:underline"
          href={`mailto:${booking.customer_email}`}
        >
          <Mail size={12} />
          {booking.customer_email}
        </a>
      ) : null}
    </div>
  );
}

function StatusSelect({
  value,
  disabled,
  onChange,
  options,
}: {
  value: Status | PaymentStatus;
  disabled: boolean;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <select
      aria-label={`Change ${value} status`}
      disabled={disabled}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`w-full rounded-lg border-0 px-2 py-1.5 text-xs font-bold capitalize outline-none ring-1 ring-inset ring-black/5 ${statusColors[value]}`}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function PartnerList({
  title,
  empty,
  items,
  busyId,
  onDelete,
}: {
  title: string;
  empty: string;
  items: { id: string; name: string; detail: string }[];
  busyId: string | null;
  onDelete: (id: string, name: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="font-black text-slate-900">{title}</h3>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
          {items.length}
        </span>
      </div>
      {items.length ? (
        <div className="mt-3 space-y-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 p-3"
            >
              <div>
                <p className="font-bold text-slate-900">{item.name}</p>
                <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
              </div>
              <button
                type="button"
                aria-label={`Delete ${item.name}`}
                onClick={() => onDelete(item.id, item.name)}
                disabled={busyId === `partner-${item.id}`}
                className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-40"
              >
                <Trash2 size={16} />
              </button>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
          {empty}
        </p>
      )}
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  note,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  note: string;
  tone: "blue" | "emerald" | "amber" | "rose" | "slate";
}) {
  const colors = {
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    rose: "border-rose-100 bg-rose-50 text-rose-700",
    slate: "border-slate-200 bg-slate-100 text-slate-700",
  };
  return (
    <div className={`rounded-3xl border p-5 ${colors[tone]}`}>
      <div className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        {label}
      </div>
      <p className="mt-4 text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-600">{note}</p>
    </div>
  );
}
