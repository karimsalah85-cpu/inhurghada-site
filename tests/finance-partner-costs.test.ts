import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  actAs, assignSupplier, createBooking, createFinanceDatabase, createStaff, createSupplier, lines, n, owner, setRate, system,
  type FinanceDb,
} from "./support/finance-db";

let db: FinanceDb;
type Row = Record<string, unknown>;

beforeAll(async () => {
  db = await createFinanceDatabase();
  for (const date of ["2026-08-10", "2026-08-20"]) {
    await setRate(db, date, "EUR", 0.8);
    await setRate(db, date, "EGP", 50);
  }
}, 120_000);
afterAll(async () => { await db?.close(); });
beforeEach(async () => { await actAs(db, system); });

async function asOwner<T>(work: () => Promise<T>) {
  await actAs(db, owner);
  try { return await work(); } finally { await actAs(db, system); }
}
const addPartner = (lineId: unknown, supplierId: string, options: { role?: string; cost?: number | null; currency?: string | null; fee?: number } = {}) =>
  asOwner(async () => (await db.query<Row>("select * from public.finance_add_partner_cost($1, $2, $3, $4, $5, $6, null)",
    [lineId, supplierId, options.role ?? "guide", options.cost === undefined ? 500 : options.cost, options.currency === undefined ? "EGP" : options.currency, options.fee ?? 0])).rows[0]);
const updatePartner = (id: unknown, changes: Record<string, unknown>) =>
  asOwner(async () => (await db.query<Row>("select * from public.finance_update_partner_cost($1, $2)", [id, JSON.stringify(changes)])).rows[0]);
const removePartner = (id: unknown, reason = "Guide did not join the trip") =>
  asOwner(async () => (await db.query<Row>("select * from public.finance_remove_partner_cost($1, $2)", [id, reason])).rows[0]);

/** What each partner is owed on a booking (negative = Daily Red Sea owes them), by currency. */
async function owed(bookingId: string) {
  const { rows } = await db.query<{ name: string; currency: string; balance: string }>(
    `select s.name, e.currency::text, sum(e.amount)::text as balance from public.supplier_ledger e join public.suppliers s on s.id = e.supplier_id
     where e.booking_id = $1 group by s.name, e.currency having sum(e.amount) <> 0 order by s.name`, [bookingId]);
  return Object.fromEntries(rows.map((row) => [`${row.name} ${row.currency}`, n(row.balance)]));
}

/** A USD 200 boat trip on 2026-08-20, collected by Daily Red Sea, boat costing EGP 4,000. */
async function boatTrip(status = "confirmed") {
  const boat = await createSupplier(db, `Boat ${randomUUID().slice(0, 6)}`);
  const booking = await createBooking(db, { amount: 200, date: "2026-08-20", status });
  await assignSupplier(db, booking, boat, 4000, "EGP");
  const [line] = await lines(db, booking);
  await asOwner(() => db.query("select public.finance_update_line($1, '{\"collected_by\": \"daily_red_sea\"}')", [line.id]));
  return { boat, booking, lineId: line.id };
}

describe("extra partners on a trip", () => {
  it("adds a guide and a driver, each owed their own cost, and subtracts both from the margin", async () => {
    const { booking, lineId } = await boatTrip();
    const guide = await createSupplier(db, "Guide Ahmed");
    const driver = await createSupplier(db, "Driver Samir");
    await addPartner(lineId, guide, { role: "guide", cost: 500 });
    await addPartner(lineId, driver, { role: "driver", cost: 20, currency: "EUR" });

    // USD: revenue 200; boat EGP 4,000 = 80; guide EGP 500 = 10; driver EUR 20 = 25.
    const [line] = await lines(db, booking);
    expect([n(line.supplier_cost_usd), n(line.extra_partner_cost_usd), n(line.total_partner_cost_usd), n(line.margin_amount_usd)])
      .toEqual(["80.00", "35.00", "115.00", "85.00"]);
    expect([n(line.extra_partner_cost_booking_ccy), n(line.margin_amount)]).toEqual(["35.00", "85.00"]);
    const balances = await owed(booking);
    expect(balances).toMatchObject({ "Guide Ahmed EGP": "-500.00", "Driver Samir EUR": "-20.00" });
    expect(Object.keys(balances)).toHaveLength(3);
  });

  it("reposts when a cost changes and reverses when a partner is removed, never editing the ledger", async () => {
    const { booking, lineId } = await boatTrip();
    const guide = await createSupplier(db, "Guide Mona");
    const row = await addPartner(lineId, guide, { cost: 500 });
    await updatePartner(row.id, { cost: 600 });
    expect((await owed(booking))["Guide Mona EGP"]).toBe("-600.00");
    await removePartner(row.id);
    expect((await owed(booking))["Guide Mona EGP"]).toBeUndefined();
    const { rows } = await db.query<Row>("select entry_type, amount::text from public.supplier_ledger where partner_cost_id = $1 order by entry_no", [row.id]);
    expect(rows.map((entry) => [entry.entry_type, n(entry.amount)])).toEqual([
      ["supplier_cost_payable", "-500.00"], ["reversal", "500.00"], ["supplier_cost_payable", "-600.00"], ["reversal", "600.00"],
    ]);
    await expect(updatePartner(row.id, { cost: 1 })).rejects.toThrow(/removed/);
    await expect(db.query("delete from public.booking_line_partner_costs where id = $1", [row.id])).rejects.toThrow(/never deleted/);
    // The partner can be added again after removal.
    await addPartner(lineId, guide, { cost: 450 });
    expect((await owed(booking))["Guide Mona EGP"]).toBe("-450.00");
  });

  it("cancelling the booking leaves only each partner's agreed cancellation fee", async () => {
    const { booking, lineId } = await boatTrip();
    const guide = await createSupplier(db, "Guide Cancel");
    const driver = await createSupplier(db, "Driver Cancel");
    await addPartner(lineId, guide, { cost: 500, fee: 150 });
    await addPartner(lineId, driver, { cost: 300 });
    await db.query("update public.bookings set status = 'cancelled', cancellation_reason = 'weather' where id = $1", [booking]);
    const balances = await owed(booking);
    expect(balances["Guide Cancel EGP"]).toBe("-150.00");
    expect(balances["Driver Cancel EGP"]).toBeUndefined();
    const [line] = await lines(db, booking);
    expect(n(line.extra_partner_cost_usd)).toBe("3.00");
    // Reinstating the booking brings the full costs back.
    await db.query("update public.bookings set status = 'confirmed' where id = $1", [booking]);
    expect(await owed(booking)).toMatchObject({ "Guide Cancel EGP": "-500.00", "Driver Cancel EGP": "-300.00" });
  });

  it("owes nothing while the booking is still a pending request", async () => {
    const { booking, lineId } = await boatTrip("new");
    const guide = await createSupplier(db, "Guide Pending");
    await addPartner(lineId, guide, { cost: 500 });
    expect(await owed(booking)).toEqual({});
    await db.query("update public.bookings set status = 'confirmed' where id = $1", [booking]);
    expect((await owed(booking))["Guide Pending EGP"]).toBe("-500.00");
  });

  it("uses the partner's price for the tour when no cost is entered", async () => {
    const { booking, lineId } = await boatTrip();
    const guide = await createSupplier(db, "Guide Priced");
    await db.query("insert into public.supplier_prices(supplier_id, tour_slug, adult_cost, fixed_cost, currency) values ($1, 'reef', 100, 50, 'EGP')", [guide]);
    const row = await addPartner(lineId, guide, { cost: null, currency: null });
    // 2 adults x EGP 100 + EGP 50 fixed.
    expect([n(row.cost), row.currency, row.cost_source]).toEqual(["250.00", "EGP", "supplier_price"]);
    const nobody = await createSupplier(db, "Guide No Price");
    await expect(addPartner(lineId, nobody, { cost: null, currency: null })).rejects.toThrow(/no price for this tour/);
    expect((await owed(booking))["Guide Priced EGP"]).toBe("-250.00");
  });

  it("refuses the main partner, duplicates and inactive partners", async () => {
    const { boat, lineId } = await boatTrip();
    await expect(addPartner(lineId, boat)).rejects.toThrow(/already the main partner/);
    const guide = await createSupplier(db, "Guide Twice");
    await addPartner(lineId, guide);
    await expect(addPartner(lineId, guide)).rejects.toThrow(/already on this trip/);
    const retired = await createSupplier(db, "Guide Retired");
    await db.query("update public.suppliers set active = false where id = $1", [retired]);
    await expect(addPartner(lineId, retired)).rejects.toThrow(/inactive/);
  });

  it("locks the USD value once the trip-date rate is final", async () => {
    const boat = await createSupplier(db, "Boat Late Rate");
    const booking = await createBooking(db, { amount: 100, date: "2026-08-25" });
    await assignSupplier(db, booking, boat, 1000, "EGP");
    const [line] = await lines(db, booking);
    const guide = await createSupplier(db, "Guide Late Rate");
    const row = await addPartner(line.id, guide, { cost: 400 });
    expect([n(row.recognised_cost_usd), row.fx_locked]).toEqual(["8.00", false]);
    await setRate(db, "2026-08-25", "EGP", 40);
    await db.query("select public.finance_refresh_unlocked_fx()");
    const { rows: [after] } = await db.query<Row>("select recognised_cost_usd, fx_locked from public.booking_line_partner_costs where id = $1", [row.id]);
    expect([n(after.recognised_cost_usd), after.fx_locked]).toEqual(["10.00", true]);
    const { rows: [entry] } = await db.query<Row>(
      "select amount_usd from public.supplier_ledger where partner_cost_id = $1 and entry_type = 'supplier_cost_payable' and not exists (select 1 from public.supplier_ledger r where r.reverses_entry_id = supplier_ledger.id)", [row.id]);
    expect(n(entry.amount_usd)).toBe("-10.00");
  });

  it("settles and pays an extra partner through the normal supplier tools", async () => {
    const { booking, lineId } = await boatTrip();
    const guide = await createSupplier(db, "Guide Paid");
    await addPartner(lineId, guide, { cost: 500 });
    await asOwner(() => db.query("select public.finance_post_supplier_entry($1, 'payment_to_supplier', 200, 'EGP', '2026-08-20', $2, 'Cash on the pier')", [guide, lineId]));
    expect((await owed(booking))["Guide Paid EGP"]).toBe("-300.00");
    await asOwner(() => db.query("select public.finance_post_net_settlement($1, $2, $3, '2026-08-21', 'Weekly payout')", [randomUUID(), guide, [lineId]]));
    expect((await owed(booking))["Guide Paid EGP"]).toBeUndefined();
  });

  it("is limited to the owner and the accountant", async () => {
    const { lineId } = await boatTrip();
    const guide = await createSupplier(db, "Guide Perms");
    await actAs(db, await createStaff(db, "operations"));
    await expect(db.query("select public.finance_add_partner_cost($1, $2, 'guide', 10, 'EGP')", [lineId, guide])).rejects.toThrow(/manage_finance/);
    await actAs(db, await createStaff(db, "finance"));
    await db.query("select public.finance_add_partner_cost($1, $2, 'guide', 10, 'EGP')", [lineId, guide]);
  });
});
