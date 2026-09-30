import { Banknote, BookOpen, CalendarDays, ChartNoAxesCombined, Coins, LayoutDashboard, Map, MessageSquareText, Shield, SlidersHorizontal, Star, Tag, Truck, UserRoundCog, Users, type LucideIcon } from "lucide-react";
import type { AdminPermission, AdminRole } from "@/lib/admin-auth";

export type AdminNavPage = { href: string; label: string; permissions?: AdminPermission[] };
export type AdminNavSection = { label: string; icon: LucideIcon; pages: AdminNavPage[]; keywords?: string };
export type AdminNavGroup = { label: string; sections: AdminNavSection[] };

// One entry per sidebar link. Sections with more than one page get a tab bar at the top of the workspace.
export const adminNav: AdminNavGroup[] = [
  { label: "Today", sections: [
    { label: "Today", icon: LayoutDashboard, pages: [{ href: "/admin", label: "Today" }], keywords: "overview dashboard home" },
  ] },
  { label: "Bookings", sections: [
    { label: "Bookings", icon: BookOpen, pages: [{ href: "/admin/bookings", label: "Bookings", permissions: ["bookings", "reports"] }], keywords: "reservations guests" },
    { label: "Dispatch & calendar", icon: CalendarDays, pages: [
      { href: "/admin/operations", label: "Calendar & assignments", permissions: ["operations"] },
      { href: "/admin/operations/manifest", label: "Pickup manifest", permissions: ["operations"] },
    ], keywords: "operations pickups drivers boats assignments manifest run sheet" },
    { label: "Customers", icon: Users, pages: [{ href: "/admin/customers", label: "Customers", permissions: ["operations"] }], keywords: "crm guests notes repeat" },
    { label: "Messages", icon: MessageSquareText, pages: [{ href: "/admin/messages", label: "Messages", permissions: ["operations"] }], keywords: "whatsapp email conversations templates queue communications" },
  ] },
  { label: "Catalog", sections: [
    { label: "Trips", icon: Map, pages: [
      { href: "/admin/trips", label: "Listings", permissions: ["content"] },
      { href: "/admin/content", label: "Content & media", permissions: ["content"] },
    ], keywords: "tours listings content media photos" },
    { label: "Availability & pricing", icon: SlidersHorizontal, pages: [{ href: "/admin/availability", label: "Availability & pricing", permissions: ["operations"] }], keywords: "capacity block dates price override seats weather close" },
    { label: "Promotions", icon: Tag, pages: [{ href: "/admin/promo-codes", label: "Promo codes", permissions: ["content"] }], keywords: "discount coupons referrals" },
    { label: "Reviews", icon: Star, pages: [{ href: "/admin/reviews", label: "Reviews", permissions: ["content"] }] },
  ] },
  { label: "Partners & team", sections: [
    { label: "Partners & sales people", icon: Truck, pages: [{ href: "/admin/suppliers", label: "Partners & sales people", permissions: ["suppliers", "finance"] }], keywords: "suppliers boats drivers hotels commission contracts prices" },
    { label: "Guides & staff", icon: UserRoundCog, pages: [{ href: "/admin/staff", label: "Guides & staff", permissions: ["operations"] }], keywords: "guides drivers crew check-in pin assignments" },
  ] },
  { label: "Money", sections: [
    { label: "Finance", icon: Coins, pages: [
      { href: "/admin/finance", label: "Overview & expenses", permissions: ["finance"] },
      { href: "/admin/finance/reports", label: "Reports", permissions: ["finance"] },
      { href: "/admin/finance/pnl", label: "Profit & loss", permissions: ["finance"] },
      { href: "/admin/finance/margins", label: "Margins", permissions: ["finance"] },
      { href: "/admin/finance/suppliers", label: "Supplier balances", permissions: ["finance"] },
      { href: "/admin/finance/payments-to-record", label: "Payments to record", permissions: ["finance"] },
      { href: "/admin/finance/cancellations", label: "Cancellations", permissions: ["finance"] },
      { href: "/admin/finance/credit-notes", label: "Credit notes", permissions: ["finance"] },
      { href: "/admin/finance/vat", label: "VAT", permissions: ["finance"] },
    ], keywords: "expenses pnl profit loss margins vat credit notes payments cash accountant export" },
    { label: "Insights", icon: ChartNoAxesCombined, pages: [
      { href: "/admin/reports", label: "Bookings report", permissions: ["reports"] },
      { href: "/admin/analytics", label: "Marketing", permissions: ["finance"] },
      { href: "/admin/reports/profit", label: "Booking profit", permissions: ["operations"] },
    ], keywords: "reports analytics google ads ga4 traffic statistics" },
  ] },
  { label: "Settings", sections: [
    { label: "Site settings", icon: Banknote, pages: [
      { href: "/admin/settings", label: "General", permissions: ["settings"] },
      { href: "/admin/currency", label: "Currency", permissions: ["finance", "settings"] },
      { href: "/admin/policies", label: "Terms & policies", permissions: ["settings"] },
      { href: "/admin/settings/redirects", label: "Redirects", permissions: ["content"] },
    ], keywords: "currency exchange rates policies terms redirects contact social announcement" },
    { label: "Users & system", icon: Shield, pages: [
      { href: "/admin/users", label: "Users & roles", permissions: ["settings", "staff"] },
      { href: "/admin/integrations", label: "Integrations", permissions: ["settings"] },
      { href: "/admin/system", label: "SEO & backups", permissions: ["settings"] },
      { href: "/admin/environments", label: "Environment", permissions: ["settings"] },
      { href: "/admin/audit-log", label: "Audit log", permissions: ["settings"] },
    ], keywords: "staff accounts permissions roles integrations environment audit backups seo" },
  ] },
];

export function canSeePage(page: AdminNavPage, permissions: Iterable<AdminPermission>, role: AdminRole) {
  void role;
  if (!page.permissions) return true;
  const allowed = new Set(permissions);
  return page.permissions.some((permission) => allowed.has(permission));
}

/** Sidebar model for a user: sections they can reach, each pointing at its first permitted page. */
export function visibleNav(permissions: Iterable<AdminPermission>, role: AdminRole) {
  const allowed = [...permissions];
  return adminNav.map((group) => ({
    ...group,
    sections: group.sections
      .map((section) => ({ ...section, pages: section.pages.filter((page) => canSeePage(page, allowed, role)) }))
      .filter((section) => section.pages.length > 0),
  })).filter((group) => group.sections.length > 0);
}

const pathMatches = (pathname: string, href: string) => pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`));

/** The most specific page matching the path, and the section that owns it. */
export function activeNavPage(pathname: string, groups: AdminNavGroup[] = adminNav) {
  let best: { section: AdminNavSection; page: AdminNavPage } | null = null;
  for (const group of groups) for (const section of group.sections) for (const page of section.pages) {
    if (pathMatches(pathname, page.href) && (!best || page.href.length > best.page.href.length)) best = { section, page };
  }
  return best;
}
