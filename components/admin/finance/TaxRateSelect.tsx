"use client";

import { useEffect, useState } from "react";

export type TaxRate = {
  id: string; code: string; name: string; rate_percent: string | number; applies_to: "sales" | "purchases" | "both";
  effective_from: string; effective_to: string | null; default_for_sales: boolean; default_for_purchases: boolean;
  country?: string | null;
};

let cached: Promise<TaxRate[]> | null = null;

/** VAT rates, loaded once per page (empty for staff without finance access, or when none are set up). */
export function loadTaxRates(refresh = false): Promise<TaxRate[]> {
  if (!cached || refresh) {
    cached = fetch("/api/admin/finance/tax-rates", { cache: "no-store" })
      .then(async (response) => (response.ok ? ((await response.json()).taxRates as TaxRate[]) : []))
      .catch(() => []);
  }
  return cached;
}

export function useTaxRates() {
  const [rates, setRates] = useState<TaxRate[] | null>(null);
  useEffect(() => {
    let live = true;
    void loadTaxRates().then((list) => { if (live) setRates(list); });
    return () => { live = false; };
  }, []);
  return rates;
}

/** Rates usable for a kind of transaction on a date (plus the one already chosen, so it stays visible). */
export function ratesFor(rates: TaxRate[], kind: "sales" | "purchases", date: string | null, current?: string | null) {
  const day = date || new Date().toISOString().slice(0, 10);
  return rates.filter((rate) => rate.id === current || ((rate.applies_to === "both" || rate.applies_to === kind)
    && rate.effective_from <= day && (!rate.effective_to || rate.effective_to >= day)));
}

export const rateLabel = (rate: TaxRate) => `${rate.name} (${Number(rate.rate_percent)}%)`;

/** A VAT rate picker. Shows "No VAT" and the rates valid for the kind and date. */
export default function TaxRateSelect({ rates, kind, date, value, onChange, disabled, label = "VAT", className }: {
  rates: TaxRate[]; kind: "sales" | "purchases"; date: string | null; value: string | null; onChange: (id: string | null) => void;
  disabled?: boolean; label?: string; className?: string;
}) {
  const options = ratesFor(rates, kind, date, value);
  return (
    <label className={className ?? "text-sm font-semibold"}>{label}
      <select value={value ?? ""} disabled={disabled} onChange={(event) => onChange(event.target.value || null)}
        className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-base font-normal disabled:opacity-60 sm:text-sm">
        <option value="">No VAT</option>
        {options.map((rate) => <option key={rate.id} value={rate.id}>{rateLabel(rate)}</option>)}
      </select>
    </label>
  );
}
