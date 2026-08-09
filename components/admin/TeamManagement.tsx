"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Staff = { id: string; email: string; display_name: string | null; role: string; active: boolean };
const roles = ["manager", "sales", "finance", "operations", "content_editor"];

export default function TeamManagement({ canManage }: { canManage: boolean }) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [form, setForm] = useState({ name: "", email: "", role: "sales", mode: "invite", password: "" });
  const [message, setMessage] = useState("");
  const load = async () => {
    const response = await fetch("/api/admin/staff-accounts");
    const data = await response.json();
    if (response.ok) setStaff(data.staff || []);
    else setMessage(data.error || "Could not load current users.");
  };
  // eslint-disable-next-line react-hooks/set-state-in-effect -- users are loaded from the protected API after mount
  useEffect(() => { void load(); }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/admin/staff-accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await response.json();
    setMessage(response.ok ? (form.mode === "invite" ? "Invitation sent." : "Account created.") : (data.error || "Could not create account."));
    if (response.ok) { setForm({ ...form, name: "", email: "", password: "" }); await load(); }
  }
  async function update(item: Staff, patch: Partial<Staff>) {
    await fetch("/api/admin/staff-accounts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, role: patch.role || item.role, active: patch.active ?? item.active }) });
    await load();
  }
  return <>
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-bold uppercase tracking-widest text-cyan-700">Administration</p><h1 className="mt-2 text-3xl font-black">Team accounts</h1></div><div className="flex gap-2"><Link href="/admin/account" className="rounded-xl border px-4 py-2 text-sm font-bold">Change my password</Link><Link href="/admin" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">Back to admin</Link></div></div>
    <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_.7fr]">
      <section className="rounded-3xl bg-white p-6 shadow-sm"><h2 className="text-xl font-black">Current users</h2><div className="mt-4 divide-y">{staff.map(item => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-bold">{item.display_name || item.email}</p><p className="text-sm text-slate-500">{item.email}</p></div><div className="flex gap-2"><select disabled={!canManage || item.role === "owner"} value={item.role} onChange={event => void update(item, { role: event.target.value })} className="rounded-lg border p-2 text-sm disabled:opacity-60"><option value="owner">owner</option>{roles.map(role => <option key={role}>{role}</option>)}</select><button disabled={!canManage || item.role === "owner"} onClick={() => void update(item, { active: !item.active })} className={`rounded-lg px-3 py-2 text-sm font-bold disabled:opacity-60 ${item.active ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>{item.active ? "Deactivate" : "Reactivate"}</button></div></div>)}</div>{!staff.length ? <p className="mt-4 text-sm text-slate-500">No staff accounts are recorded yet.</p> : null}</section>
      {canManage ? <form onSubmit={submit} className="h-fit rounded-3xl bg-white p-6 shadow-sm"><h2 className="text-xl font-black">Add user</h2><select value={form.mode} onChange={event => setForm({ ...form, mode: event.target.value })} className="mt-4 w-full rounded-xl border p-3"><option value="invite">Email invitation</option><option value="create">Create with password</option></select><input required value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="Full name" className="mt-3 w-full rounded-xl border p-3"/><input required type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} placeholder="Email" className="mt-3 w-full rounded-xl border p-3"/><select value={form.role} onChange={event => setForm({ ...form, role: event.target.value })} className="mt-3 w-full rounded-xl border p-3">{roles.map(role => <option key={role}>{role}</option>)}</select>{form.mode === "create" ? <input required type="password" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} placeholder="Temporary strong password" className="mt-3 w-full rounded-xl border p-3"/> : null}<button className="mt-4 w-full rounded-xl bg-cyan-700 p-3 font-bold text-white">{form.mode === "invite" ? "Send invitation" : "Create account"}</button>{message ? <p role="status" className="mt-3 text-sm font-semibold">{message}</p> : null}</form> : <aside className="h-fit rounded-3xl bg-white p-6 text-sm text-slate-600 shadow-sm"><h2 className="text-xl font-black text-slate-900">Owner controls</h2><p className="mt-3">Sign in with the owner account to invite users or change roles and access.</p>{message ? <p role="status" className="mt-3 font-semibold text-rose-700">{message}</p> : null}</aside>}
    </div>
  </>;
}
