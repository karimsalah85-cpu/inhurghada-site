"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { ArrowUpRight, ChevronDown, Search, X, PanelLeft, LayoutDashboard, CalendarDays, BookOpen, Users, Truck, Tag, Map, FileText, Star, ChartNoAxesCombined, ClipboardList, Wallet, Coins, Shield, Plug, Layers, History, UserRound } from "lucide-react";
import type { AdminPermission, AdminRole } from "@/lib/admin-auth";

import styles from "./AdminShell.module.css";

const navIcons = [LayoutDashboard, BookOpen, CalendarDays, Users, Truck, Tag, Map, FileText, Star, ChartNoAxesCombined, ClipboardList, Wallet, Coins, Shield, Users, Plug, Layers, History];

type NavItem = { href: string; label: string; permissions?: AdminPermission[]; ownerOnly?: boolean };
type NavGroup = { label: string; items: NavItem[] };

const groups: NavGroup[] = [
  { label: "Workspace", items: [
    { href: "/admin", label: "Overview" },
  ] },
  { label: "Daily operations", items: [
    { href: "/admin/bookings", label: "Bookings", permissions: ["bookings", "reports"] },
    { href: "/admin/operations", label: "Calendar & operations", permissions: ["operations"] },
    { href: "/admin/customers", label: "Customer notes", permissions: ["bookings", "operations"] },
    { href: "/admin/suppliers", label: "Suppliers", permissions: ["suppliers", "finance"] },
  ] },
  { label: "Trips & content", items: [
    { href: "/admin/promo-codes", label: "Promo codes", permissions: ["content"] },
    { href: "/admin/trips", label: "Trips & listings", permissions: ["content"] },
    { href: "/admin/content", label: "Trip content", permissions: ["content"] },
    { href: "/admin/reviews", label: "Reviews", permissions: ["content"] },
  ] },
  { label: "Performance & finance", items: [
    { href: "/admin/analytics", label: "Analytics", permissions: ["finance"] },
    { href: "/admin/reports", label: "Reports", permissions: ["reports"] },
    { href: "/admin/finance", label: "Finance", permissions: ["finance"] },
    { href: "/admin/finance/pnl", label: "Profit & loss", permissions: ["finance"] },
    { href: "/admin/finance/margins", label: "Margins", permissions: ["finance"] },
    { href: "/admin/finance/suppliers", label: "Supplier balances", permissions: ["finance"] },
  ] },
  { label: "Settings & access", items: [
    { href: "/admin/currency", label: "Currency settings", permissions: ["finance", "settings"] },
    { href: "/admin/policies", label: "Terms & policies", permissions: ["settings"] },
    { href: "/admin/users", label: "Users & roles", permissions: ["settings", "staff"] },
    { href: "/admin/integrations", label: "Integrations", permissions: ["settings"] },
    { href: "/admin/environments", label: "Environments", permissions: ["settings"] },
    { href: "/admin/audit-log", label: "Audit log", permissions: ["settings"] },
  ] },
];

let sessionPinned = false;
function navigationPinned() {
  try { return localStorage.getItem("drs-admin-nav-pinned") === "true"; }
  catch { return sessionPinned; }
}
function subscribeNavigation(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("drs-admin-navigation", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("drs-admin-navigation", callback);
  };
}

const authPaths = ["/admin/login", "/admin/mfa", "/admin/forgot-password", "/admin/reset-password"];

export default function AdminShell({ children, permissions, role, environment }: { children: React.ReactNode; permissions: AdminPermission[]; role: AdminRole; environment: "test" | "live" }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const pinned = useSyncExternalStore(subscribeNavigation, navigationPinned, () => false);
  function togglePinned() {
    try { localStorage.setItem("drs-admin-nav-pinned", String(!pinned)); }
    catch { sessionPinned = !pinned; }
    window.dispatchEvent(new Event("drs-admin-navigation"));
  }
  if (authPaths.some((path) => pathname.startsWith(path))) return children;

  const allowed = new Set(permissions);
  const permittedGroups = groups.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.ownerOnly ? role === "owner" : !item.permissions || item.permissions.some((permission) => allowed.has(permission))),
  })).filter((group) => group.items.length);
  const matches = (href: string) => pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`));
  // Nested items (e.g. /admin/finance/suppliers under /admin/finance): only the most specific match is active.
  const activeHref = permittedGroups.flatMap((group) => group.items).map((item) => item.href).filter(matches).sort((a, b) => b.length - a.length)[0];
  const isActive = (href: string) => href === activeHref;
  const currentPage = permittedGroups.flatMap((group) => group.items).find((item) => isActive(item.href))?.label ?? (pathname === "/admin/account" ? "Account & security" : "Admin workspace");
  const visibleGroups = permittedGroups.map((group) => ({
    ...group,
    items: group.items.filter((item) => `${group.label} ${item.label} ${item.href === "/admin/operations" ? "customers CRM calendar communications" : ""}`.toLowerCase().includes(query.trim().toLowerCase())),
  })).filter((group) => group.items.length);
  const closeMenu = () => { setMenuOpen(false); setQuery(""); };

  return <div className={`${styles.shell} min-h-screen bg-slate-50`} data-pinned={pinned}>
    <a href="#admin-workspace" className="sr-only z-50 rounded-lg bg-white p-3 text-slate-950 focus:not-sr-only focus:fixed focus:left-3 focus:top-3">Skip to workspace</a>
    <div className={styles.rail}><aside className={`${styles.sidebar} border-b border-slate-200 bg-slate-950 px-4 py-4 text-white lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto lg:border-b-0 lg:border-r lg:border-slate-800 lg:px-3 lg:py-3`}>
      <div className="flex items-center justify-between gap-3">
        <Link href="/admin" aria-label={`Daily Red Sea admin — ${environment} environment`} title={`Daily Red Sea · ${environment}`} onClick={closeMenu} className={`${styles.brand} rounded text-lg font-black focus-visible:outline-2 focus-visible:outline-cyan-300`}>Daily Red Sea</Link>
        <span className={`${styles.label} rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wide ${environment === "live" ? "bg-emerald-400/20 text-emerald-300" : "bg-amber-400/20 text-amber-300"}`}>{environment}</span>
      </div>
      <button type="button" onClick={togglePinned} aria-pressed={pinned} aria-label={pinned ? "Unpin navigation" : "Pin navigation open"} title={pinned ? "Unpin navigation" : "Pin navigation open"} className="mt-3 hidden min-h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-slate-200 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-cyan-300 lg:flex"><PanelLeft size={20} className="shrink-0" aria-hidden="true"/><span className={styles.label}>{pinned ? "Unpin navigation" : "Pin navigation open"}</span></button>
      <button type="button" aria-expanded={menuOpen} aria-controls="admin-navigation" onClick={() => setMenuOpen(!menuOpen)} className="mt-3 flex min-h-11 w-full items-center justify-between rounded-xl border border-slate-700 px-3 text-sm font-bold focus-visible:outline-2 focus-visible:outline-cyan-300 lg:hidden">
        <span>{currentPage}<span className="ml-2 font-normal text-slate-400">· Menu</span></span>
        <ChevronDown size={18} aria-hidden="true" className={menuOpen ? "rotate-180" : ""}/>
      </button>
      <div id="admin-navigation" className={`${menuOpen ? "block" : "hidden"} lg:block`}>
        <div className={`${styles.search} relative mt-3`}>
          <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-3 text-slate-400"/>
          <label htmlFor="admin-navigation-search" className="sr-only">Find an admin page</label>
          <input id="admin-navigation-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a page…" className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 pl-9 pr-9 text-sm text-white placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none"/>
          {query ? <button type="button" aria-label="Clear page search" onClick={() => setQuery("")} className="absolute right-1 top-1 rounded-lg p-2 text-slate-300 hover:bg-slate-700"><X size={16}/></button> : null}
        </div>
        <nav aria-label="Admin navigation" className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {visibleGroups.map((group) => <section key={group.label}>
            <h2 className={`${styles.label} px-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400`}>{group.label}</h2>
            <div className="mt-2 space-y-1">{group.items.map((item) => {
              const active = isActive(item.href);
              const Icon = navIcons[groups.flatMap((group) => group.items).findIndex((entry) => entry.href === item.href)] || BookOpen;
              return <Link key={item.href} href={item.href} onClick={closeMenu} aria-label={item.label} title={item.label} aria-current={active ? "page" : undefined} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-cyan-300 ${active ? "bg-cyan-400 text-slate-950" : "text-slate-200 hover:bg-slate-800 hover:text-white"}`}><Icon size={20} className="shrink-0" aria-hidden="true"/><span className={styles.label}>{item.label}</span></Link>;
            })}</div>
          </section>)}
        </nav>
        {!visibleGroups.length ? <p role="status" className="mt-4 px-3 text-sm text-slate-300">No pages match “{query}”. Try another name.</p> : null}
        <div className="mt-6 space-y-2 border-t border-slate-800 pt-4 text-xs text-slate-400">
          <p className={`${styles.label} px-3 font-bold capitalize`}>{role.replaceAll("_", " ")}</p>
          <Link href="/admin/account" onClick={closeMenu} aria-label="Account & security" title="Account & security" aria-current={pathname === "/admin/account" ? "page" : undefined} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${pathname === "/admin/account" ? "bg-cyan-400 text-slate-950" : "text-slate-200 hover:bg-slate-800 hover:text-white"}`}><UserRound size={20} className="shrink-0" aria-hidden="true"/><span className={styles.label}>Account & security</span></Link>
          <Link href="/" aria-label="View public site" title="View public site" className="flex items-center gap-2 rounded-lg px-3 py-2.5 hover:bg-slate-800 hover:text-white"><ArrowUpRight size={20} className="shrink-0" aria-hidden="true"/><span className={styles.label}>View public site</span></Link>
        </div>
      </div>
    </aside></div>
    <div id="admin-workspace" tabIndex={-1} className="min-w-0 outline-none">{children}</div>
  </div>;
}
