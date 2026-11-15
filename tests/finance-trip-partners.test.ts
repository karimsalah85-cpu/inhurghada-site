import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  actAs, assignSupplier, createBooking, createFinanceDatabase, createSupplier, lines, n, owner, setRate, system,
  type FinanceDb,
} from "./support/finance-db";

let db: FinanceDb;
type Row = Record<string, unknown>;

beforeAll(async () => {
  db = await createFinanceDatabase();
  for (const date of ["2026-10-10", "2026-10-12"]) {
    await setRate(db, date, "EUR", 0.8);
    await setRate(db, date, "EGP", 50);
  }
}, 120_000);
afterAll(async () => { await db?.close(); });
beforeEach(async () => { await actAs(db, system); });

const slug = () => `trip-${randomUUID().slice(0, 8)}`;
const setPartner = (tourSlug: string, supplierId: string, role: string) =>
  db.query("insert into public.tour_partners (tour_slug, supplier_id, role) values ($1, $2, $3)", [tourSlug, supplierId, role]);
const setPrice = (supplierId: string, tourSlug: string, price: { adult?: number; youth?: number | null; fixed?: number | null; currency?: string }) =>
  db.query("insert into public.supplier_prices (supplier_id, tour_slug, adult_cost, youth_cost, fixed_cost, currency) values ($1, $2, $3, $4, $5, $6)",
    [supplierId, tourSlug, price.adult ?? 0, price.youth ?? null, price.fixed ?? null, price.currency ?? "USD"]);
const partners = async (bookingId: string) =>
  (await db.query<Row>("select c.*, s.name from public.booking_line_partner_costs c join public.suppliers s on s.id = c.supplier_id where c.booking_id = $1 order by s.name", [bookingId])).rows;
/** Open balance per partner on a booking: positive = they owe Daily Red Sea, negative = Daily Red Sea owes them. */
async function balances(bookingId: string) {
  const { rows } = await db.query<{ name: string; currency: string; balance: string }>(
    `select s.name, e.currency::text, sum(e.amount)::text as balance from public.supplier_ledger e join public.suppliers s on s.id = e.supplier_id
     where e.booking_id = $1 group by s.name, e.currency having sum(e.amount) <> 0 order by s.name`, [bookingId]);
  return Object.fromEntries(rows.map((row) => [`${row.name} ${row.currency}`, n(row.balance)]));
}

/** A trip whose boat company is the main partner and whose transfers come from a separate company. */
async function tripWithTransfer() {
  const tour = slug();
  const boat = await createSupplier(db, `Boat ${tour}`);
  const transfer = await createSupplier(db, `Transfer ${tour}`);
  await setPrice(boat, tour, { adult: 30, youth: 15 });
  await setPrice(transfer, tour, { fixed: 500, currency: "EGP" });
  await setPartner(tour, boat, "main");
  await setPartner(tour, transfer, "transfer");
  return { tour, boat, transfer };
}

describe("several suppliers set on the trip", () => {
  it("gives every new booking the trip provider as main partner and the transfer company as an extra partner", async () => {
    const { tour, boat, transfer } = await tripWithTransfer();
    const booking = await createBooking(db, { amount: 150, tour_slug: tour, adults: 2, youth: 1, guests: 3 });

    const [line] = await lines(db, booking);
    expect(line.supplier_id).toBe(boat);
    expect(line.supplier_cost_source).toBe("supplier_price");
    expect(n(line.supplier_cost)).toBe("75.00"); // 2 x 30 + 1 x 15

    const [extra] = await partners(booking);
    expect(extra).toMatchObject({ supplier_id: transfer, role: "transfer", currency: "EGP", cost_source: "supplier_price", from_trip_setup: true, status: "active" });
    expect(n(extra.cost)).toBe("500.00");

    // Margin: 150 - 75 boat - (EGP 500 = USD 10) transfer.
    expect(n(line.margin_amount_usd)).toBe("65.00");
  });

  it("makes the trip provider owe Daily Red Sea when they collect, while Daily Red Sea owes the transfer company", async () => {
    const { tour } = await tripWithTransfer();
    const booking = await createBooking(db, { amount: 150, tour_slug: tour, adults: 2, youth: 1, guests: 3 });
    // collected_by defaults to the main partner (supplier).
    expect(await balances(booking)).toEqual({
      [`Boat ${tour} USD`]: "75.00", // 150 collected - 75 own cost
      [`Transfer ${tour} EGP`]: "-500.00",
    });
  });

  it("keeps a booking's own supplier assignment ahead of the trip setup", async () => {
    const { tour, transfer } = await tripWithTransfer();
    const otherBoat = await createSupplier(db, `Other boat ${tour}`);
    const booking = await createBooking(db, { amount: 150, tour_slug: tour });
    await assignSupplier(db, booking, otherBoat, 40);
    const [line] = await lines(db, booking);
    expect(line.supplier_id).toBe(otherBoat);
    expect((await partners(booking)).map((row) => row.supplier_id)).toEqual([transfer]);
  });

  it("re-prices the transfer with the guests and adds partners at cost 0 when there is no price", async () => {
    const tour = slug();
    const guide = await createSupplier(db, `Guide ${tour}`);
    const driver = await createSupplier(db, `Driver ${tour}`);
    await setPrice(driver, tour, { adult: 5 });
    await setPartner(tour, guide, "guide");
    await setPartner(tour, driver, "transfer");
    const booking = await createBooking(db, { amount: 100, tour_slug: tour, adults: 2, guests: 2 });

    let rows = await partners(booking);
    expect(rows.map((row) => [row.name, n(row.cost), row.cost_source])).toEqual([
      [`Driver ${tour}`, "10.00", "supplier_price"],
      [`Guide ${tour}`, "0.00", "manual"],
    ]);

    await db.query("update public.bookings set adults = 4, guests = 4 where id = $1", [booking]);
    rows = await partners(booking);
    expect(n(rows[0].cost)).toBe("20.00");
  });

  it("does not add back a partner that finance removed from one booking", async () => {
    const { tour, transfer } = await tripWithTransfer();
    const booking = await createBooking(db, { amount: 150, tour_slug: tour });
    const [extra] = await partners(booking);
    await actAs(db, owner);
    await db.query("select public.finance_remove_partner_cost($1, 'Guest came by taxi')", [extra.id]);
    await actAs(db, system);
    await db.query("update public.bookings set guests = 3, adults = 3 where id = $1", [booking]);
    const rows = await partners(booking);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ supplier_id: transfer, status: "removed" });
  });

  it("applies setup changes to open trips only", async () => {
    const tour = slug();
    const boat = await createSupplier(db, `Boat ${tour}`);
    const transfer = await createSupplier(db, `Transfer ${tour}`);
    await setPrice(transfer, tour, { fixed: 20 });
    const finished = await createBooking(db, { amount: 100, tour_slug: tour, status: "completed" });
    const open = await createBooking(db, { amount: 100, tour_slug: tour, status: "confirmed" });

    await setPartner(tour, boat, "main");
    await setPartner(tour, transfer, "transfer");
    expect((await lines(db, finished))[0].supplier_id).toBeNull();
    expect(await partners(finished)).toHaveLength(0);
    expect((await lines(db, open))[0].supplier_id).toBe(boat);
    expect(await partners(open)).toHaveLength(1);

    // Taking the transfer company off the trip removes it from open trips and clears what was owed.
    await db.query("delete from public.tour_partners where tour_slug = $1 and supplier_id = $2", [tour, transfer]);
    const [removed] = await partners(open);
    expect(removed).toMatchObject({ status: "removed", removed_reason: "Removed from the trip setup" });
    expect(Object.keys(await balances(open))).toEqual([`Boat ${tour} USD`]);

    // Adding it back brings it back.
    await setPartner(tour, transfer, "driver");
    const active = (await partners(open)).filter((row) => row.status === "active");
    expect(active).toHaveLength(1);
    expect(active[0]).toMatchObject({ role: "driver" });
  });

  it("allows only one main partner per trip", async () => {
    const tour = slug();
    await setPartner(tour, await createSupplier(db, `A ${tour}`), "main");
    await expect(setPartner(tour, await createSupplier(db, `B ${tour}`), "main")).rejects.toThrow();
  });
});
