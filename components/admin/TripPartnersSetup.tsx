"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { TRIP_PARTNER_ROLES, tripPartnerRoleLabels, type TripPartnerRole } from "@/lib/finance/partner-roles";

type Row = Record<string, unknown>;
type TripPartner = { id: string; tour_slug: string; supplier_id: string; role: TripPartnerRole; note: string | null };

const field = "w-full rounded-xl border bg-white p-3 text-base sm:text-sm";

/**
 * Several suppliers per trip: one main partner (the trip provider) plus extra
 * partners such as a separate transfer company. Every open booking of the
 * trip picks them up in finance automatically.
 */
export default function TripPartnersSetup({ tours, suppliers, tourPartners, supplierPrices, save }: {
  tours: { slug: string; title: string }[];
  suppliers: Row[];
  tourPartners: Row[];
  supplierPrices: Row[];
  save: (payload: Row) => Promise<void>;
}) {
  const [form, setForm] = useState({ tour_slug: "", supplier_id: "", role: "main" as TripPartnerRole, note: "" });
  const supplierName = useMemo(() => new Map(suppliers.map((supplier) => [String(supplier.id), String(supplier.name)])), [suppliers]);
  const tourTitle = useMemo(() => new Map(tours.map((tour) => [tour.slug, tour.title])), [tours]);
  const partners = tourPartners as unknown as TripPartner[];
  const byTour = useMemo(() => {
    const groups = new Map<string, TripPartner[]>();
    for (const partner of partners) groups.set(partner.tour_slug, [...(groups.get(partner.tour_slug) || []), partner]);
    for (const list of groups.values()) list.sort((a, b) => (a.role === "main" ? -1 : b.role === "main" ? 1 : 0));
    return [...groups.entries()].sort(([a], [b]) => (tourTitle.get(a) || a).localeCompare(tourTitle.get(b) || b));
  }, [partners, tourTitle]);
  const hasPrice = (supplierId: string, tourSlug: string) => supplierPrices.some((price) => price.supplier_id === supplierId && price.tour_slug === tourSlug);
  const chosenTrip = partners.filter((partner) => partner.tour_slug === form.tour_slug);

  function submit(event: FormEvent) {
    event.preventDefault();
    void save({ action: "tour_partner", ...form }).then(() => setForm((current) => ({ ...current, supplier_id: "", note: "" })));
  }
  function remove(partner: TripPartner) {
    const name = supplierName.get(partner.supplier_id) || "this supplier";
    if (!window.confirm(`Remove ${name} from ${tourTitle.get(partner.tour_slug) || partner.tour_slug}? Open bookings of this trip will drop them too; finished trips stay as they are.`)) return;
    void save({ action: "tour_partner_remove", id: partner.id });
  }

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 p-4 sm:p-5">
      <h3 className="text-lg font-black">Trip suppliers</h3>
      <p className="mt-1 text-sm text-slate-600">
        Give a trip more than one supplier, for example the boat company as the main partner and a separate transfer company.
        Every open booking of the trip gets them in finance automatically: the main partner owes you the guest money they collect minus their cost,
        and you owe each extra partner their price for the trip. A supplier assigned on a booking still replaces the main partner for that booking.
      </p>

      <form onSubmit={submit} className="mt-4 grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-2">
        <label className="text-sm font-semibold">Trip
          <select required value={form.tour_slug} onChange={(event) => setForm({ ...form, tour_slug: event.target.value })} className={`mt-1 ${field}`}>
            <option value="">Choose trip</option>
            {tours.map((tour) => <option key={tour.slug} value={tour.slug}>{tour.title}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold">Supplier
          <select required value={form.supplier_id} onChange={(event) => setForm({ ...form, supplier_id: event.target.value })} className={`mt-1 ${field}`}>
            <option value="">Choose supplier</option>
            {suppliers.filter((supplier) => supplier.active !== false).map((supplier) => <option key={String(supplier.id)} value={String(supplier.id)}>{String(supplier.name)}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold">Role on this trip
          <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as TripPartnerRole })} className={`mt-1 ${field}`}>
            {TRIP_PARTNER_ROLES.map((role) => <option key={role} value={role}>{tripPartnerRoleLabels[role]}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold">Note (optional)
          <input maxLength={500} value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="e.g. hotel pickups only" className={`mt-1 ${field}`} />
        </label>
        {form.tour_slug && form.supplier_id && !hasPrice(form.supplier_id, form.tour_slug) ? (
          <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 md:col-span-2">
            This supplier has no price for this trip yet. Add one under “Supplier tour price” so bookings get their cost automatically; otherwise finance enters it per booking.
          </p>
        ) : null}
        {form.role === "main" && chosenTrip.some((partner) => partner.role === "main" && partner.supplier_id !== form.supplier_id) ? (
          <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 md:col-span-2">This trip already has a main partner. Remove it or change its role first.</p>
        ) : null}
        <button className="rounded-xl bg-blue-700 p-3 font-bold text-white md:col-span-2">Save trip supplier</button>
      </form>

      {byTour.length ? (
        <ul className="mt-5 space-y-3">
          {byTour.map(([slug, list]) => (
            <li key={slug} className="rounded-2xl border border-slate-200 p-4">
              <p className="font-bold">{tourTitle.get(slug) || slug}</p>
              <ul className="mt-2 divide-y divide-slate-100">
                {list.map((partner) => (
                  <li key={partner.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                    <span className="min-w-0">
                      <strong>{supplierName.get(partner.supplier_id) || "Unknown supplier"}</strong>{" "}
                      <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold ${partner.role === "main" ? "bg-blue-100 text-blue-900" : "bg-slate-100 text-slate-700"}`}>{tripPartnerRoleLabels[partner.role] || partner.role}</span>
                      {!hasPrice(partner.supplier_id, slug) ? <span className="ml-2 text-xs text-amber-800">no price for this trip</span> : null}
                      {partner.note ? <span className="block text-xs text-slate-500">{partner.note}</span> : null}
                    </span>
                    <button type="button" onClick={() => remove(partner)} aria-label={`Remove ${supplierName.get(partner.supplier_id) || "supplier"}`} className="rounded-lg p-2.5 text-rose-700 hover:bg-rose-50">
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : <p className="mt-4 text-sm text-slate-500">No trip suppliers yet.</p>}
    </section>
  );
}
