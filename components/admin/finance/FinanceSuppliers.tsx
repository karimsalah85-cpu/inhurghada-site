"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatMoney, type FinanceCurrency } from "@/lib/finance/money";
import type { BalanceLabel } from "@/lib/finance/supplier-ledger";

type SupplierSummary = {
  id: string;
  name: string;
  type: string;
  active: boolean;
  balances: { currency: FinanceCurrency; balance: string }[];
  usd_balance: string;
  missing_rates: FinanceCurrency[];
  label: BalanceLabel;
  last_entry_date: string | null;
};
type SyncError = { id: number; booking_id: string | null; context: string; message: string; created_at: string };
type Payload = { configured: boolean; error?: string; suppliers?: SupplierSummary[]; syncErrors?: SyncError[]; rates?: Partial<Record<FinanceCurrency, { rate_date: string }>> };

export const toneClasses: Record<BalanceLabel["tone"], string> = {
  owes_us: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  we_owe: "bg-amber-50 text-amber-900 ring-amber-200",
  settled: "bg-slate-100 text-slate-700 ring-slate-200",
};

export function FinanceNotConfigured({ message }: { message?: string }) {
  return <div role="status" className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-950"><h2 className="text-lg font-black">Finance is not set up yet</h2><p className="mt-2 text-sm leading-6">{message || "The finance database migrations have not been applied to this environment."} Nothing is recorded until they are.</p></div>;
}

export default function FinanceSuppliers() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [showSettled, setShowSettled] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetch("/api/admin/finance/suppliers", { cache: "no-store" })
        .then(async (response) => {
          const payload = await response.json() as Payload;
          if (!response.ok && payload.configured !== false) throw new Error(payload.error || "Could not load supplier balances.");
          setData(payload);
        })
        .catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load supplier balances."));
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  if (error) return <p role="alert" className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-800">{error}</p>;
  if (!data) return <p className="text-sm text-slate-500">Loading supplier balances…</p>;
  if (data.configured === false) return <FinanceNotConfigured message={data.error} />;

  const suppliers = (data.suppliers || []).filter((supplier) =>
    supplier.name.toLowerCase().includes(query.trim().toLowerCase()) && (showSettled || supplier.label.tone !== "settled"));
  const rateDates = Object.entries(data.rates || {}).map(([currency, rate]) => `${currency} ${rate?.rate_date}`).join(" · ");

  return <div className="space-y-6">
    {data.syncErrors?.length ? <section role="alert" className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-rose-900">
      <h2 className="font-black">Finance sync problems ({data.syncErrors.length})</h2>
      <ul className="mt-2 space-y-1 text-sm">{data.syncErrors.map((item) => <li key={item.id}><span className="font-semibold">{item.context}</span> · {new Date(item.created_at).toLocaleString("en-GB")} · {item.message}</li>)}</ul>
    </section> : null}

    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-950">Supplier balances</h2>
          <p className="mt-1 text-sm text-slate-500">USD position at the latest daily rates{rateDates ? ` (${rateDates})` : ""}. Per-currency amounts are exact.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search suppliers" aria-label="Search suppliers" className="rounded-xl border border-slate-200 px-3 py-2" />
          <label className="flex items-center gap-2"><input type="checkbox" checked={showSettled} onChange={(event) => setShowSettled(event.target.checked)} /> Show settled</label>
        </div>
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500"><tr><th className="py-2 pr-4">Supplier</th><th className="py-2 pr-4">Position</th><th className="py-2 pr-4">By currency</th><th className="py-2 pr-4">Last entry</th><th className="py-2" /></tr></thead>
          <tbody>
            {suppliers.map((supplier) => <tr key={supplier.id} className="border-t border-slate-100 align-top">
              <td className="py-3 pr-4"><Link href={`/admin/finance/suppliers/${supplier.id}`} className="font-bold text-slate-950 hover:text-cyan-700">{supplier.name}</Link><p className="text-xs capitalize text-slate-500">{supplier.type}{supplier.active ? "" : " · inactive"}</p></td>
              <td className="py-3 pr-4"><span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ring-1 ${toneClasses[supplier.label.tone]}`}>{supplier.label.text}</span>{supplier.missing_rates.length ? <p className="mt-1 text-xs text-amber-700">No rate yet for {supplier.missing_rates.join(", ")}</p> : null}</td>
              <td className="py-3 pr-4 tabular-nums">{supplier.balances.length ? supplier.balances.map((balance) => <div key={balance.currency}>{formatMoney(balance.balance, balance.currency)}</div>) : <span className="text-slate-400">—</span>}</td>
              <td className="py-3 pr-4 text-slate-600">{supplier.last_entry_date || "—"}</td>
              <td className="py-3 text-right"><Link href={`/admin/finance/suppliers/${supplier.id}`} className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-slate-500">Open ledger</Link></td>
            </tr>)}
            {!suppliers.length ? <tr><td colSpan={5} className="py-6 text-center text-slate-500">No suppliers match.</td></tr> : null}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-slate-500">Positive balances mean the supplier owes Daily Red Sea; negative balances mean Daily Red Sea owes the supplier.</p>
    </section>
  </div>;
}
