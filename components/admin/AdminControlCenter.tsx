"use client";

import { type FormEvent, useEffect, useState } from "react";
import { Pencil, RefreshCw, Settings2, Trash2, Upload } from "lucide-react";

type Resource = "content" | "media" | "availability" | "staff" | "assignments" | "notes" | "templates" | "queue" | "settings" | "redirects";
type RecordValue = Record<string, unknown> & { id?: string; key?: string };
type Payload = { configured: false; migration: string } | ({ configured: true; audit: RecordValue[]; health: RecordValue[] } & Record<Resource, RecordValue[]>);
const tabs: Array<[Resource, string]> = [["content", "Live content"], ["media", "Media"], ["availability", "Calendar & capacity"], ["staff", "Staff"], ["assignments", "Assignments"], ["notes", "Customer notes"], ["templates", "Message templates"], ["queue", "Message queue"], ["settings", "Site settings"], ["redirects", "Redirects"]];
const empty: Record<Resource, Record<string, unknown>> = {
  content: { content_type: "blog", slug: "", locale: "en", status: "draft", title: "", excerpt: "", body: "", price: "", originalPrice: "", packagePrice: "", adultPrice: "", childPrice: "", infantPrice: "", duration: "", location: "", availableTimes: "", priceUnit: "", seo_title: "", seo_description: "", featured_image: "", publish_at: "" },
  media: { storage_path: "", public_url: "", file_name: "", mime_type: "image/jpeg", alt_text: "", credit: "" },
  availability: { tour_slug: "", service_date: "", start_time: "", capacity: "", blocked: false, price_override: "", currency: "USD", notes: "" },
  staff: { name: "", staff_type: "guide", phone: "", languages: "English", active: true, notes: "" },
  assignments: { booking_id: "", supplier_id: "", staff_member_id: "", assignment_type: "guide", pickup_time: "", internal_cost: "", currency: "USD", status: "assigned", notes: "" },
  notes: { customer_key: "", customer_name: "", note: "", tags: "" },
  templates: { name: "", channel: "email", event_key: "pickup_reminder", locale: "en", subject: "", body: "", active: true },
  queue: { booking_id: "", template_id: "", channel: "email", recipient: "", scheduled_for: "" },
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
  const [editId, setEditId] = useState("");

  async function load() {
    setBusy(true); setError("");
    try { const response = await fetch("/api/admin/control-center", { cache: "no-store" }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Could not load control center."); setData(result); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load control center."); }
    finally { setBusy(false); }
  }
  useEffect(() => { const timeout = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timeout); }, []);
  function choose(next: Resource) { setTab(next); setForm({ ...empty[next] }); setEditId(""); setError(""); }
  function set(name: string, value: unknown) { setForm((current) => ({ ...current, [name]: value })); }

  async function create(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try { const prepared = tab === "content" ? prepareContent(form) : form; const response = await fetch(editId ? `/api/admin/control-center/${tab}/${encodeURIComponent(editId)}` : "/api/admin/control-center", { method: editId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editId ? prepared : { resource: tab, ...prepared }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Could not save record."); setForm({ ...empty[tab] }); setEditId(""); setNotice(editId ? "Updated successfully. The published site now uses this record." : "Saved successfully."); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save record."); }
    finally { setBusy(false); }
  }
  function edit(item: RecordValue) {
    const id = String(item.id || item.key || "");
    const next = { ...item };
    if (tab === "content") {
      const body = item.body && typeof item.body === "object" && !Array.isArray(item.body) ? item.body as Record<string, unknown> : {};
      next.body = JSON.stringify(body, null, 2);
      next.price = body.price ?? "";
      next.originalPrice = body.originalPrice ?? "";
      next.packagePrice = body.packagePrice ?? "";
      const participant = body.participantPricing && typeof body.participantPricing === "object" ? body.participantPricing as Record<string, unknown> : {};
      next.adultPrice = participant.adults ?? "";
      next.childPrice = participant.youth ?? "";
      next.infantPrice = participant.infants ?? "";
      next.duration = body.duration ?? "";
      next.location = body.location ?? "";
      next.priceUnit = body.priceUnit ?? "";
      next.availableTimes = Array.isArray(body.availableTimes) ? body.availableTimes.join(", ") : "";
    }
    if (["staff", "notes"].includes(tab)) {
      if (Array.isArray(item.languages)) next.languages = item.languages.join(", ");
      if (Array.isArray(item.tags)) next.tags = item.tags.join(", ");
    }
    setEditId(id); setForm(next); setNotice(""); setError("");
  }
  async function importCurrentSite() {
    if (!window.confirm("Import the current tours and blogs into admin? Existing admin records will not be overwritten.")) return;
    setBusy(true); setError("");
    try { const response = await fetch("/api/admin/control-center/import", { method: "POST" }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Import failed."); setNotice(`Imported ${result.imported} current site records. You can now edit them here.`); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Import failed."); }
    finally { setBusy(false); }
  }
  async function runAutomation() {
    setBusy(true); setError("");
    try { const response = await fetch("/api/admin/automation/run", { method: "POST" }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Automation failed."); setNotice(`Automation complete: ${result.published} published, ${result.sent} sent, ${result.failed} failed.`); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Automation failed."); }
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
    <div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-start gap-3"><Settings2 className="mt-1 text-cyan-700"/><div><h2 className="text-2xl font-bold">Site control center</h2><p className="mt-1 text-sm text-slate-500">Manage the records used by the published site, plus availability, staff, customers, messages, settings, redirects, and history.</p></div></div><div className="flex flex-wrap gap-2"><button type="button" onClick={importCurrentSite} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2 text-sm font-bold text-white"><Upload size={16}/>Import current site</button><button type="button" onClick={runAutomation} disabled={busy} className="rounded-xl border border-cyan-300 px-4 py-2 text-sm font-bold text-cyan-800">Run automation</button><button type="button" onClick={load} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold"><RefreshCw size={16} className={busy ? "animate-spin" : ""}/>Refresh</button></div></div>
    {error ? <p role="alert" className="mt-5 rounded-xl bg-rose-50 p-4 text-sm font-semibold text-rose-800">{error}</p> : null}{notice ? <p role="status" className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{notice}</p> : null}
    {!busy && data?.configured === false ? <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950"><p className="font-black">Database upgrade required</p><p className="mt-2">Run <code>{data.migration}</code> in the Supabase SQL Editor, then refresh this section.</p></div> : null}
    {data?.configured ? <><div className="mt-6 flex gap-2 overflow-x-auto pb-2">{tabs.map(([value, label]) => <button key={value} type="button" onClick={() => choose(value)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold ${tab === value ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700"}`}>{label}</button>)}</div><div className="mt-5 grid gap-8 xl:grid-cols-[0.75fr_1.25fr]"><form onSubmit={create} className="space-y-4 rounded-2xl bg-slate-50 p-4"><div className="flex items-center justify-between"><h3 className="font-black">{editId ? "Edit" : "Add"} {tabs.find(([value]) => value === tab)?.[1].toLowerCase()}</h3>{editId ? <button type="button" onClick={() => { setEditId(""); setForm({ ...empty[tab] }); }} className="text-sm font-bold text-slate-500">Cancel</button> : null}</div><ResourceForm resource={tab} form={form} set={set}/><button disabled={busy} className="w-full rounded-xl bg-cyan-700 py-3 font-bold text-white disabled:opacity-50">{busy ? "Saving…" : editId ? "Update live record" : "Save"}</button></form><div><div className="flex items-center justify-between"><h3 className="font-black">Current records</h3><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{items.length}</span></div><div className="mt-3 max-h-[560px] space-y-3 overflow-y-auto">{items.map((item) => <article key={String(item.id || item.key)} className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 p-4"><div className="min-w-0"><p className="truncate font-bold text-slate-900">{recordTitle(tab, item)}</p><p className="mt-1 text-xs text-slate-500">{recordDetail(tab, item)}</p></div><div className="flex"><button type="button" aria-label="Edit record" onClick={() => edit(item)} className="rounded-lg p-2 text-slate-500 hover:bg-cyan-50 hover:text-cyan-700"><Pencil size={16}/></button><button type="button" aria-label="Delete record" onClick={() => remove(item)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-700"><Trash2 size={16}/></button></div></article>)}{!items.length ? <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">No records yet.</p> : null}</div></div></div><details className="mt-6 rounded-2xl border border-slate-200 p-4"><summary className="cursor-pointer font-bold">Audit and system health</summary><div className="mt-4 grid gap-5 lg:grid-cols-2"><History title="Recent admin activity" items={data.audit}/><History title="System health & backups" items={data.health}/></div></details></> : null}
  </section>;
}

function Input({ label, name, form, set, type = "text", required = false, step }: { label: string; name: string; form: Record<string, unknown>; set: (name: string, value: unknown) => void; type?: string; required?: boolean; step?: string }) { return <label className="block text-sm font-semibold">{label}<input required={required} type={type} step={step || (type === "number" ? "0.01" : undefined)} value={String(form[name] ?? "")} onChange={(event) => set(name, event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 font-normal"/></label>; }
function Select({ label, name, options, form, set }: { label: string; name: string; options: string[]; form: Record<string, unknown>; set: (name: string, value: unknown) => void }) { return <label className="block text-sm font-semibold">{label}<select value={String(form[name] ?? "")} onChange={(event) => set(name, event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 font-normal">{options.map((value) => <option key={value}>{value}</option>)}</select></label>; }
function Area({ label, name, form, set, required = false }: { label: string; name: string; form: Record<string, unknown>; set: (name: string, value: unknown) => void; required?: boolean }) { return <label className="block text-sm font-semibold">{label}<textarea required={required} value={String(form[name] ?? "")} onChange={(event) => set(name, event.target.value)} className="mt-1 min-h-24 w-full rounded-xl border border-slate-200 bg-white p-3 font-normal"/></label>; }
function Check({ label, name, form, set }: { label: string; name: string; form: Record<string, unknown>; set: (name: string, value: unknown) => void }) { return <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={Boolean(form[name])} onChange={(event) => set(name, event.target.checked)}/>{label}</label>; }
function optionalNumber(value: unknown) { return value === "" || value == null ? undefined : Number(value); }
function prepareContent(form: Record<string, unknown>) {
  if (form.content_type !== "tour") return form;
  let body: Record<string, unknown> = {};
  if (typeof form.body === "string" && form.body.trim()) {
    try { const parsed = JSON.parse(form.body); if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) body = parsed; }
    catch { throw new Error("Advanced tour data must be valid JSON."); }
  } else if (form.body && typeof form.body === "object") body = form.body as Record<string, unknown>;
  const price = optionalNumber(form.price);
  const originalPrice = optionalNumber(form.originalPrice);
  if (price === undefined || !Number.isFinite(price) || price < 0) throw new Error("Enter a valid current tour price.");
  if (originalPrice !== undefined && (!Number.isFinite(originalPrice) || originalPrice <= price)) throw new Error("Original price must be higher than the discounted current price, or left empty.");
  const adultPrice = optionalNumber(form.adultPrice);
  const childPrice = optionalNumber(form.childPrice);
  const infantPrice = optionalNumber(form.infantPrice);
  const participantPricing: Record<string, unknown> = { ...(body.participantPricing && typeof body.participantPricing === "object" ? body.participantPricing as Record<string, unknown> : {}), adults: adultPrice ?? price };
  if (childPrice === undefined) delete participantPricing.youth; else participantPricing.youth = childPrice;
  if (infantPrice === undefined) delete participantPricing.infants; else participantPricing.infants = infantPrice;
  body = { ...body, price: String(price), packagePrice: String(optionalNumber(form.packagePrice) ?? price), participantPricing };
  if (originalPrice === undefined) delete body.originalPrice; else body.originalPrice = String(originalPrice);
  for (const key of ["duration", "location", "priceUnit"] as const) { const value = String(form[key] || "").trim(); if (value) body[key] = value; else delete body[key]; }
  const times = String(form.availableTimes || "").split(",").map((value) => value.trim()).filter(Boolean);
  if (times.length) body.availableTimes = times; else delete body.availableTimes;
  const { price: _price, originalPrice: _originalPrice, packagePrice: _packagePrice, adultPrice: _adultPrice, childPrice: _childPrice, infantPrice: _infantPrice, duration: _duration, location: _location, priceUnit: _priceUnit, availableTimes: _availableTimes, ...record } = form;
  void _price; void _originalPrice; void _packagePrice; void _adultPrice; void _childPrice; void _infantPrice; void _duration; void _location; void _priceUnit; void _availableTimes;
  return { ...record, body };
}
function ResourceForm({ resource, form, set }: { resource: Resource; form: Record<string, unknown>; set: (name: string, value: unknown) => void }) {
  if (resource === "content") return <><div className="grid gap-3 sm:grid-cols-3"><Select label="Type" name="content_type" options={["tour", "blog", "page", "promotion"]} form={form} set={set}/><Select label="Language" name="locale" options={["en", "de", "ru", "ar", "pl", "zh"]} form={form} set={set}/><Select label="Status" name="status" options={["draft", "scheduled", "published", "archived"]} form={form} set={set}/></div><Input label="Title" name="title" form={form} set={set} required/><Input label="URL slug" name="slug" form={form} set={set} required/><Area label="Summary / description" name="excerpt" form={form} set={set}/>{form.content_type === "tour" ? <div className="space-y-4 rounded-2xl border border-cyan-200 bg-cyan-50/50 p-4"><h4 className="font-black text-cyan-950">Tour pricing and booking</h4><div className="grid gap-3 sm:grid-cols-2"><Input label="Current price" name="price" type="number" form={form} set={set} required/><Input label="Original price (before discount)" name="originalPrice" type="number" form={form} set={set}/><Input label="Adult price" name="adultPrice" type="number" form={form} set={set}/><Input label="Child price" name="childPrice" type="number" form={form} set={set}/><Input label="Infant price" name="infantPrice" type="number" form={form} set={set}/><Input label="Package price" name="packagePrice" type="number" form={form} set={set}/><Input label="Price unit" name="priceUnit" form={form} set={set}/><Input label="Available times, comma separated" name="availableTimes" form={form} set={set}/><Input label="Duration" name="duration" form={form} set={set}/><Input label="Location" name="location" form={form} set={set}/></div><p className="text-xs leading-5 text-cyan-900">When Original price is higher than Current price, the public site shows the original price crossed out. Booking totals use the adult, child, and infant prices above.</p><Area label="Advanced tour data (JSON: itinerary, inclusions, age bands, notes and FAQs)" name="body" form={form} set={set}/></div> : <Area label="Content" name="body" form={form} set={set}/>}<Input label="SEO title" name="seo_title" form={form} set={set}/><Area label="SEO description" name="seo_description" form={form} set={set}/><Input label="Featured image URL" name="featured_image" form={form} set={set}/><Input label="Publish at" name="publish_at" type="datetime-local" form={form} set={set}/></>;
  if (resource === "media") return <><Input label="Public image URL" name="public_url" form={form} set={set} required/><Input label="Storage path (defaults to URL)" name="storage_path" form={form} set={set}/><Input label="File name" name="file_name" form={form} set={set} required/><Input label="MIME type" name="mime_type" form={form} set={set}/><Area label="Accessible alt text" name="alt_text" form={form} set={set}/><Input label="Photo credit" name="credit" form={form} set={set}/></>;
  if (resource === "availability") return <><Input label="Tour slug" name="tour_slug" form={form} set={set} required/><div className="grid gap-3 sm:grid-cols-2"><Input label="Date" name="service_date" type="date" form={form} set={set} required/><Input label="Start time" name="start_time" type="time" form={form} set={set}/><Input label="Capacity" name="capacity" type="number" form={form} set={set}/><Input label="Price override" name="price_override" type="number" form={form} set={set}/></div><Check label="Block this date" name="blocked" form={form} set={set}/><Area label="Notes" name="notes" form={form} set={set}/></>;
  if (resource === "staff") return <><Input label="Name" name="name" form={form} set={set} required/><Select label="Type" name="staff_type" options={["guide", "driver", "crew", "operations"]} form={form} set={set}/><Input label="Phone" name="phone" form={form} set={set}/><Input label="Languages, comma separated" name="languages" form={form} set={set}/><Check label="Active" name="active" form={form} set={set}/><Area label="Notes" name="notes" form={form} set={set}/></>;
  if (resource === "assignments") return <><Input label="Booking ID" name="booking_id" form={form} set={set} required/><Select label="Assignment type" name="assignment_type" options={["supplier", "guide", "driver", "crew"]} form={form} set={set}/><Input label="Supplier ID (when applicable)" name="supplier_id" form={form} set={set}/><Input label="Staff member ID (when applicable)" name="staff_member_id" form={form} set={set}/><Input label="Pickup time" name="pickup_time" type="datetime-local" form={form} set={set}/><Input label="Internal cost" name="internal_cost" type="number" form={form} set={set}/><Select label="Status" name="status" options={["assigned", "accepted", "completed", "cancelled"]} form={form} set={set}/><Area label="Internal notes" name="notes" form={form} set={set}/></>;
  if (resource === "notes") return <><Input label="Customer phone or email" name="customer_key" form={form} set={set} required/><Input label="Customer name" name="customer_name" form={form} set={set}/><Area label="Internal note" name="note" form={form} set={set} required/><Input label="Tags, comma separated" name="tags" form={form} set={set}/></>;
  if (resource === "templates") return <><Input label="Template name" name="name" form={form} set={set} required/><div className="grid gap-3 sm:grid-cols-3"><Select label="Channel" name="channel" options={["email", "whatsapp"]} form={form} set={set}/><Input label="Event key" name="event_key" form={form} set={set} required/><Select label="Language" name="locale" options={["en", "de", "ru", "ar", "pl", "zh"]} form={form} set={set}/></div><Input label="Email subject" name="subject" form={form} set={set}/><Area label="Message" name="body" form={form} set={set} required/><Check label="Active" name="active" form={form} set={set}/></>;
  if (resource === "queue") return <><Select label="Channel" name="channel" options={["email", "whatsapp"]} form={form} set={set}/><Input label="Recipient email or phone" name="recipient" form={form} set={set} required/><Input label="Booking ID (optional)" name="booking_id" form={form} set={set}/><Input label="Template ID (optional)" name="template_id" form={form} set={set}/><Input label="Send at" name="scheduled_for" type="datetime-local" form={form} set={set}/></>;
  if (resource === "settings") return <><Input label="Setting key" name="key" form={form} set={set} required/><Input label="Category" name="category" form={form} set={set}/><Area label="Value (text or JSON)" name="value" form={form} set={set} required/><Area label="Description" name="description" form={form} set={set}/><Check label="Safe for public use" name="public" form={form} set={set}/></>;
  return <><Input label="Old path" name="source_path" form={form} set={set} required/><Input label="Destination path or URL" name="destination_path" form={form} set={set} required/><Check label="Permanent (301)" name="permanent" form={form} set={set}/><Check label="Active" name="active" form={form} set={set}/></>;
}
function recordTitle(resource: Resource, item: RecordValue) { return String(item.title || item.name || item.customer_name || item.tour_slug || item.key || item.source_path || resource); }
function recordDetail(resource: Resource, item: RecordValue) { if (resource === "content") return `${item.content_type} · ${item.locale} · ${item.status}`; if (resource === "media") return `${item.alt_text || "No alt text"} · ${item.public_url || item.storage_path}`; if (resource === "availability") return `${item.service_date}${item.start_time ? ` · ${item.start_time}` : ""} · ${item.blocked ? "blocked" : `${item.capacity ?? "unlimited"} capacity`}`; if (resource === "assignments") return `${item.assignment_type} · ${item.status} · booking ${item.booking_id}`; if (resource === "notes") return `${item.customer_key} · ${item.note}`; if (resource === "templates") return `${item.channel} · ${item.event_key} · ${item.locale}`; if (resource === "queue") return `${item.channel} · ${item.recipient} · ${item.status}`; if (resource === "settings") return `${item.category} · ${JSON.stringify(item.value)}`; if (resource === "redirects") return `→ ${item.destination_path}`; return `${item.staff_type || ""} ${item.phone || ""}`.trim(); }
function History({ title, items }: { title: string; items: RecordValue[] }) { return <div><h4 className="font-black">{title}</h4><div className="mt-2 space-y-2">{items.slice(0, 10).map((item, index) => <p key={String(item.id || index)} className="rounded-lg bg-slate-50 p-3 text-xs"><strong>{String(item.summary || item.check_type || item.action || "Record")}</strong><br/><span className="text-slate-500">{String(item.created_at || item.checked_at || "")}</span></p>)}{!items.length ? <p className="text-sm text-slate-500">No records yet.</p> : null}</div></div>; }
