import Link from "next/link";
import AdminPageFrame from "@/components/admin/AdminPageFrame";
import { requireAdminPage } from "@/lib/admin-page-auth";

type AuditRow = { id: string; actor_email: string | null; action: string; resource_type: string; resource_id: string | null; summary: string | null; before_data: unknown; after_data: unknown; created_at: string };

const PAGE_SIZE = 100;

export default async function AuditLogPage({ searchParams }: { searchParams?: Promise<{ page?: string }> }) {
  const { supabase } = await requireAdminPage("settings");
  const page = Math.max(1, Number((await searchParams)?.page) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE; // fetch one extra row to detect a next page
  const { data, error } = await supabase.from("admin_audit_log").select("id,actor_email,action,resource_type,resource_id,summary,before_data,after_data,created_at").order("created_at", { ascending: false }).range(from, to);
  const rows = ((data as AuditRow[] | null) || []).slice(0, PAGE_SIZE);
  const hasNextPage = (data?.length || 0) > PAGE_SIZE;
  return <AdminPageFrame eyebrow="System & access" title="Audit log" description="Append-only history of administrative changes, including the actor, affected record, and timestamp.">{error ? <p role="alert" className="rounded-2xl bg-rose-50 p-4 text-rose-800">{error.message}</p> : <><div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-100 text-xs uppercase text-slate-500"><tr><th className="p-4">When</th><th className="p-4">Who</th><th className="p-4">Action</th><th className="p-4">Resource</th><th className="p-4">Change</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t border-slate-100"><td className="whitespace-nowrap p-4">{new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" }).format(new Date(row.created_at))}</td><td className="p-4">{row.actor_email || "System"}</td><td className="p-4 font-bold capitalize">{row.action}</td><td className="p-4"><span className="font-bold">{row.resource_type}</span>{row.resource_id ? <span className="block max-w-48 truncate text-xs text-slate-500">{row.resource_id}</span> : null}</td><td className="p-4">{row.summary || "Administrative change"}</td></tr>)}{!rows.length ? <tr><td colSpan={5} className="p-8 text-center text-slate-500">{page > 1 ? "No entries on this page." : "No audit entries yet."}</td></tr> : null}</tbody></table></div><div className="mt-4 flex items-center justify-between text-sm font-bold text-slate-600"><span>Page {page}</span><div className="flex gap-2">{page > 1 ? <Link href={`/admin/audit-log?page=${page - 1}`} className="rounded-xl border border-slate-300 bg-white px-4 py-2 hover:border-slate-500">Previous</Link> : <span className="rounded-xl border border-slate-200 px-4 py-2 text-slate-300">Previous</span>}{hasNextPage ? <Link href={`/admin/audit-log?page=${page + 1}`} className="rounded-xl border border-slate-300 bg-white px-4 py-2 hover:border-slate-500">Next</Link> : <span className="rounded-xl border border-slate-200 px-4 py-2 text-slate-300">Next</span>}</div></div></>}</AdminPageFrame>;
}
