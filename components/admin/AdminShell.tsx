"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminPermission, AdminRole } from "@/lib/admin-auth";

type NavItem = { href: string; label: string; permissions?: AdminPermission[]; ownerOnly?: boolean };
type NavGroup = { label: string; items: NavItem[] };

const groups: NavGroup[] = [
  { label: "Catalog & bookings", items: [
    { href: "/admin/trips", label: "Trips & listings", permissions: ["content"] },
    { href: "/admin/reviews", label: "Reviews", permissions: ["content"] },
    { href: "/admin/bookings", label: "Bookings", permissions: ["bookings", "reports"] },
    { href: "/admin/customers", label: "Customers", permissions: ["bookings", "operations"] },
  ] },
  { label: "Content & configuration", items: [
    { href: "/admin/content", label: "Trip content", permissions: ["content"] },
    { href: "/admin/policies", label: "Terms & policies", permissions: ["settings"] },
    { href: "/admin/currency", label: "Currency settings", permissions: ["finance", "settings"] },
  ] },
  { label: "Operations & business", items: [
    { href: "/admin/operations", label: "Operations", permissions: ["operations"] },
    { href: "/admin/finance", label: "Finance", permissions: ["finance"] },
    { href: "/admin/suppliers", label: "Suppliers", permissions: ["suppliers", "finance"] },
    { href: "/admin/analytics", label: "Analytics", permissions: ["finance", "reports"] },
    { href: "/admin/reports", label: "Reports", permissions: ["reports"] },
  ] },
  { label: "System & access", items: [
    { href: "/admin/users", label: "Users & roles", permissions: ["settings", "staff"] },
    { href: "/admin/integrations", label: "Integrations", permissions: ["settings"] },
    { href: "/admin/environments", label: "Environments", permissions: ["settings"] },
    { href: "/admin/audit-log", label: "Audit log", permissions: ["settings"] },
  ] },
];

const authPaths = ["/admin/login", "/admin/mfa", "/admin/forgot-password", "/admin/reset-password"];

export default function AdminShell({ children, permissions, role, environment }: { children: React.ReactNode; permissions: AdminPermission[]; role: AdminRole; environment: "test" | "live" }) {
  const pathname = usePathname();
  if (authPaths.some((path) => pathname.startsWith(path))) return children;
  const allowed = new Set(permissions);
  const visibleGroups = groups.map((group) => ({ ...group, items: group.items.filter((item) => item.ownerOnly ? role === "owner" : !item.permissions || item.permissions.some((permission) => allowed.has(permission))) })).filter((group) => group.items.length);
  return <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[260px_1fr]">
    <aside className="border-b border-slate-200 bg-slate-950 px-4 py-5 text-white lg:min-h-screen lg:border-b-0 lg:border-r lg:border-slate-800 lg:px-5">
      <div className="flex items-center justify-between gap-3 lg:block"><Link href="/admin" className="text-xl font-black">Daily Red Sea</Link><span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${environment === "live" ? "bg-emerald-400/20 text-emerald-300" : "bg-amber-400/20 text-amber-300"}`}>{environment}</span></div>
      <nav aria-label="Admin navigation" className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-1">{visibleGroups.map((group) => <section key={group.label}><h2 className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{group.label}</h2><div className="mt-2 space-y-1">{group.items.map((item) => { const active = pathname === item.href; return <Link key={item.href} href={item.href} className={`block rounded-lg px-3 py-2 text-sm font-bold ${active ? "bg-cyan-400 text-slate-950" : "text-slate-200 hover:bg-slate-800 hover:text-white"}`}>{item.label}</Link>; })}</div></section>)}</nav>
      <div className="mt-6 border-t border-slate-800 pt-4 text-xs text-slate-400"><p className="font-bold capitalize">{role.replaceAll("_", " ")}</p><Link href="/admin/account" className="mt-2 inline-block hover:text-white">Account & security</Link></div>
    </aside>
    <div className="min-w-0">{children}</div>
  </div>;
}
