"use client";

import { type FormEvent, useEffect, useState } from "react";
import { RefreshCw, Settings2, Trash2 } from "lucide-react";

type Resource = "content" | "availability" | "staff" | "notes" | "templates" | "settings" | "redirects";
type RecordValue = Record<string, unknown> & { id?: string; key?: string };
type Payload = { configured: false; migration: string } | ({ configured: true; audit: RecordValue[]; health: RecordValue[] } & Record<Resource, RecordValue[]>);
const tabs: Array<[Resource, string]> = [["content", "Content"], ["availability", "Calendar & capacity"], ["staff", "Staff"], ["notes", "Customer notes"], ["templates", "Messages"], ["settings", "Site settings"], ["redirects", "Redirects"]];
const empty: Record<Resource, Record<string, unknown>> = {
  content: { content_type: "blog", slug: "", locale: "en", status: "draft", title: "", excerpt: "", body: "", seo_title: "", seo_description: "", featured_image: "", publish_at: "" },
  availability: { tour_slug: "", service_date: "", start_time: "", capacity: "", blocked: false, price_override: "", currency: "USD", notes: "" },
  staff: { name: "", staff_type: "guide", phone: "", languages: "English", active: true, notes: "" },
  notes: { customer_key: "", customer_name: "", note: "", tags: "" },
  templates: { name: "", channel: "email", event_key: "pickup_reminder", locale: "en", subject: "", body: "", active: true },
  settings: { key: "", value: "", category: "general", public: false, description: "" },
  redirects: { source_path: "", destination_path: "", permanent: true, active: true },
};

export default function AdminControlCenter() {
  const [tab, setTab] = useState<Resource>("content");
  const [data, setData] = useState<Payload | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({ ...empty.content });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setBusy(true); setError("");
    try { const response = await fetch("/api/admin/control-center", { cache: "no-store" }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Could not load control center."); setData(result); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load control center."); }
    finally { setBusy(false); }
  }
  useEffect(() => { const timeout = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timeout); }, []);
  function choose(next: Resource) { setTab(next); setForm({ ...empty[next] }); setError(""); }
  function set(name: string, value: unknown) { setForm((current) => ({ ...current, [name]: value })); }

  async function create(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try { const response = await fetch("/api/admin/control-center", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resource: tab, ...form }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Could not save record."); setForm({ ...empty[tab] }); setNotice("Saved successfully."); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save record."); }
    finally { setBusy(false); }
  }
  async function remove(item: RecordValue) {
    const id = String(item.id || item.key || ""); if (!id || !window.confirm("Delete this record?")) return;
    setBusy(true); setError("");
    try { const response = await fetch(`/api/admin/control-center/${tab}/${encodeURIComponent(id)}`, { method: "DELETE" }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Could not delete record."); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not delete record."); }
    finally { setBusy(false); }
  }

  const items = data?.configured ? data[tab] : [];
  return <section id="control-center" className="mt-8 scroll-mt-6 rounded-3xl bg-white p-5 shadow-sm sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-start gap-3"><Settings2 className="mt-1 text-cyan-700"/><div><h2 className="text-2xl font-bold">Site control center</h2><p className="mt-1 text-sm text-slate-500">Manage content, availability, staff, customers, messages, settings, SEO redirects, and operational history.</p></div></div><button type="button" onClick={load} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold"><RefreshCw size={16} className={busy ? "animate-spin" : ""}/>Refresh</button></div>
    {error ? <p role="alert" className="mt-5 rounded-xl bg-rose-50 p-4 text-sm font-semibold text-rose-800">{error}</p> : null}{notice ? <p role="status" className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{notice}</p> : null}
    {!busy && data?.configured === false ? <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950"><p className="font-black">Database upgrade required</p><p className="mt-2">Run <code>{data.migration}</code> in the Supabase SQL Editor, then refresh this section.</p></div> : null}
    {data?.configured ? <><div className="mt-6 flex gap-2 overflow-x-auto pb-2">{tabs.map(([value, label]) => <button key={value} type="button" onClick={() => choose(value)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold ${tab === value ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700"}`}>{label}</button>)}</div><div className="mt-5 grid gap-8 xl:grid-cols-[0.75fr_1.25fr]"><form onSubmit={create} className="space-y-4 rounded-2xl bg-slate-50 p-4"><h3 className="font-black">Add {tabs.find(([value]) => value === tab)?.[1].toLowerCase()}</h3><ResourceForm resource={tab} form={form} set={set}/><button disabled={busy} className="w-full rounded-xl bg-cyan-700 py-3 font-bold text-white disabled:opacity-50">{busy ? "Saving…" : "Save"}</button></form><div><div className="flex items-center justify-between"><h3 className="font-black">Current records</h3><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{items.length}</span></div><div className="mt-3 max-h-[560px] space-y-3 overflow-y-auto">{items.map((item) => <article key={String(item.id || item.key)} className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 p-4"><div className="min-w-0"><p className="truncate font-bold text-slate-900">{recordTitle(tab, item)}</p><p className="mt-1 text-xs text-slate-500">{recordDetail(tab, item)}</p></div><button type="button" onClick={() => remove(item)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-700"><Trash2 size={16}/></button></article>)}{!items.length ? <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">No records yet.</p> : null}</div></div></div><details className="mt-6 rounded-2xl border border-slate-200 p-4"><summary className="cursor-pointer font-bold">Audit and system health</summary><div className="mt-4 grid gap-5 lg:grid-cols-2"><History title="Recent admin activity" items={data.audit}/><History title="System health & backups" items={data.health}/></div></details></> : null}
  </section>;
}

function Input({ label, name, form, set, type = "text", required = false }: { label: string; name: string; form: Record<string, unknown>; set: (name: string, value: unknown) => void; type?: string; required?: boolean }) { return <label className="block text-sm font-semibold">{label}<input required={required} type={type} value={String(form[name] ?? "")} onChange={(event) => set(name, event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 font-normal"/></label>; }
function Select({ label, name, options, form, set }: { label: string; name: string; options: string[]; form: Record<string, unknown>; set: (name: string, value: unknown) => void }) { return <label className="block text-sm font-semibold">{label}<select value={String(form[name] ?? "")} onChange={(event) => set(name, event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 font-normal">{options.map((value) => <option key={value}>{value}</option>)}</select></label>; }
function Area({ label, name, form, set, required = false }: { label: string; name: string; form: Record<string, unknown>; set: (name: string, value: unknown) => void; required?: boolean }) { return <label className="block text-sm font-semibold">{label}<textarea required={required} value={String(form[name] ?? "")} onChange={(event) => set(name, event.target.value)} className="mt-1 min-h-24 w-full rounded-xl border border-slate-200 bg-white p-3 font-normal"/></label>; }
function Check({ label, name, form, set }: { label: string; name: string; form: Record<string, unknown>; set: (name: string, value: unknown) => void }) { return <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={Boolean(form[name])} onChange={(event) => set(name, event.target.checked)}/>{label}</label>; }
function ResourceForm({ resource, form, set }: { resource: Resource; form: Record<string, unknown>; set: (name: string, value: unknown) => void }) {
  if (resource === "content") return <><div className="grid gap-3 sm:grid-cols-3"><Select label="Type" name="content_type" options={["tour", "blog", "page", "promotion"]} form={form} set={set}/><Select label="Language" name="locale" options={["en", "de", "ru", "ar", "pl", "zh"]} form={form} set={set}/><Select label="Status" name="status" options={["draft", "scheduled", "published", "archived"]} form={form} set={set}/></div><Input label="Title" name="title" form={form} set={set} required/><Input label="URL slug" name="slug" form={form} set={set} required/><Area label="Summary" name="excerpt" form={form} set={set}/><Area label="Content" name="body" form={form} set={set}/><Input label="SEO title" name="seo_title" form={form} set={set}/><Area label="SEO description" name="seo_description" form={form} set={set}/><Input label="Featured image URL" name="featured_image" form={form} set={set}/><Input label="Publish at" name="publish_at" type="datetime-local" form={form} set={set}/></>;
  if (resource === "availability") return <><Input label="Tour slug" name="tour_slug" form={form} set={set} required/><div className="grid gap-3 sm:grid-cols-2"><Input label="Date" name="service_date" type="date" form={form} set={set} required/><Input label="Start time" name="start_time" type="time" form={form} set={set}/><Input label="Capacity" name="capacity" type="number" form={form} set={set}/><Input label="Price override" name="price_override" type="number" form={form} set={set}/></div><Check label="Block this date" name="blocked" form={form} set={set}/><Area label="Notes" name="notes" form={form} set={set}/></>;
  if (resource === "staff") return <><Input label="Name" name="name" form={form} set={set} required/><Select label="Type" name="staff_type" options={["guide", "driver", "crew", "operations"]} form={form} set={set}/><Input label="Phone" name="phone" form={form} set={set}/><Input label="Languages, comma separated" name="languages" form={form} set={set}/><Check label="Active" name="active" form={form} set={set}/><Area label="Notes" name="notes" form={form} set={set}/></>;
  if (resource === "notes") return <><Input label="Customer phone or email" name="customer_key" form={form} set={set} required/><Input label="Customer name" name="customer_name" form={form} set={set}/><Area label="Internal note" name="note" form={form} set={set} required/><Input label="Tags, comma separated" name="tags" form={form} set={set}/></>;
  if (resource === "templates") return <><Input label="Template name" name="name" form={form} set={set} required/><div className="grid gap-3 sm:grid-cols-3"><Select label="Channel" name="channel" options={["email", "whatsapp"]} form={form} set={set}/><Input label="Event key" name="event_key" form={form} set={set} required/><Select label="Language" name="locale" options={["en", "de", "ru", "ar", "pl", "zh"]} form={form} set={set}/></div><Input label="Email subject" name="subject" form={form} set={set}/><Area label="Message" name="body" form={form} set={set} required/><Check label="Active" name="active" form={form} set={set}/></>;
  if (resource === "settings") return <><Input label="Setting key" name="key" form={form} set={set} required/><Input label="Category" name="category" form={form} set={set}/><Area label="Value (text or JSON)" name="value" form={form} set={set} required/><Area label="Description" name="description" form={form} set={set}/><Check label="Safe for public use" name="public" form={form} set={set}/></>;
  return <><Input label="Old path" name="source_path" form={form} set={set} required/><Input label="Destination path or URL" name="destination_path" form={form} set={set} required/><Check label="Permanent (301)" name="permanent" form={form} set={set}/><Check label="Active" name="active" form={form} set={set}/></>;
}
function recordTitle(resource: Resource, item: RecordValue) { return String(item.title || item.name || item.customer_name || item.tour_slug || item.key || item.source_path || resource); }
function recordDetail(resource: Resource, item: RecordValue) { if (resource === "content") return `${item.content_type} · ${item.locale} · ${item.status}`; if (resource === "availability") return `${item.service_date}${item.start_time ? ` · ${item.start_time}` : ""} · ${item.blocked ? "blocked" : `${item.capacity ?? "unlimited"} capacity`}`; if (resource === "notes") return `${item.customer_key} · ${item.note}`; if (resource === "templates") return `${item.channel} · ${item.event_key} · ${item.locale}`; if (resource === "settings") return `${item.category} · ${JSON.stringify(item.value)}`; if (resource === "redirects") return `→ ${item.destination_path}`; return `${item.staff_type || ""} ${item.phone || ""}`.trim(); }
function History({ title, items }: { title: string; items: RecordValue[] }) { return <div><h4 className="font-black">{title}</h4><div className="mt-2 space-y-2">{items.slice(0, 10).map((item, index) => <p key={String(item.id || index)} className="rounded-lg bg-slate-50 p-3 text-xs"><strong>{String(item.summary || item.check_type || item.action || "Record")}</strong><br/><span className="text-slate-500">{String(item.created_at || item.checked_at || "")}</span></p>)}{!items.length ? <p className="text-sm text-slate-500">No records yet.</p> : null}</div></div>; }
