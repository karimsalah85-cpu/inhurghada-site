"use client";

import { tours } from "@/data/tours";
import { groupTierRanges } from "@/lib/group-pricing";
import type { AdminBoatPrices, AdminGroupPrices } from "@/lib/tour-pricing";

const inputClass = "mt-1 w-full rounded-xl border px-3 py-2 text-sm font-normal";

/**
 * Price fields for trips that are charged from a table instead of one adult price: one row per
 * private boat, or one per group-size step. An empty field keeps the price shown as its placeholder.
 */
export default function TourPriceTables({ slug, form, set }: { slug: string; form: Record<string, unknown>; set: (name: string, value: unknown) => void }) {
  const tour = tours.find((item) => item.slug === slug);
  if (!tour?.boatOptions?.length && !tour?.groupPricing?.length) return null;
  const currency = tour.currency || "USD";
  const boats = (form.adminBoatPrices && typeof form.adminBoatPrices === "object" ? form.adminBoatPrices : {}) as AdminBoatPrices;
  const groups = (form.adminGroupPrices && typeof form.adminGroupPrices === "object" ? form.adminGroupPrices : {}) as AdminGroupPrices;
  const setBoat = (id: string, field: "price" | "extraHourPrice", value: string) => set("adminBoatPrices", { ...boats, [id]: { ...boats[id], [field]: value } });
  const setGroup = (minTravelers: number, value: string) => set("adminGroupPrices", { ...groups, [String(minTravelers)]: value });
  const shown = (value: unknown) => value == null ? "" : String(value);

  return <div className="space-y-3 rounded-xl border border-cyan-300 bg-white p-3">
    <div>
      <h5 className="text-sm font-black text-cyan-950">{tour.boatOptions?.length ? "Private boat prices" : "Group-size prices"} ({currency})</h5>
      <p className="mt-1 text-xs leading-5 text-slate-600">Guests are charged these amounts at checkout. Leave a field empty to keep the price shown in grey.</p>
    </div>
    {tour.boatOptions?.map((option) => <div key={option.id} className="grid gap-3 sm:grid-cols-2">
      <label className="block text-sm font-semibold">{option.label}
        <input type="number" min={0.01} step="0.01" inputMode="decimal" value={shown(boats[option.id]?.price)} placeholder={option.price.toFixed(2)} onChange={(event) => setBoat(option.id, "price", event.target.value)} className={inputClass} />
      </label>
      {option.extraHourPrice !== undefined ? <label className="block text-sm font-semibold">Extra hour
        <input type="number" min={0.01} step="0.01" inputMode="decimal" value={shown(boats[option.id]?.extraHourPrice)} placeholder={option.extraHourPrice.toFixed(2)} onChange={(event) => setBoat(option.id, "extraHourPrice", event.target.value)} className={inputClass} />
      </label> : null}
    </div>)}
    {tour.groupPricing?.length ? <div className="grid gap-3 sm:grid-cols-3">
      {groupTierRanges(tour.groupPricing, tour.groupSize).map((tier) => <label key={tier.minTravelers} className="block text-sm font-semibold">{tier.label} travelers, per person
        <input type="number" min={0.01} step="0.01" inputMode="decimal" value={shown(groups[String(tier.minTravelers)])} placeholder={tier.pricePerPerson.toFixed(2)} onChange={(event) => setGroup(tier.minTravelers, event.target.value)} className={inputClass} />
      </label>)}
    </div> : null}
  </div>;
}
