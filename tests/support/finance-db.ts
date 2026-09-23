import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { randomUUID } from "node:crypto";

const migrations = new URL("../../supabase/migrations/", import.meta.url);

/** Replays the full migration history into an in-memory Postgres with minimal Supabase auth/storage stubs. */
export async function createFinanceDatabase() {
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
    create function auth.jwt() returns jsonb language sql stable as $$ select jsonb_build_object('email', nullif(current_setting('test.email', true), '')) $$;
    create function auth.role() returns text language sql stable as $$ select 'authenticated' $$;
    create schema storage;
    create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid);
    create schema extensions;
  `);
  for (const file of readdirSync(migrations).filter((name) => name.endsWith(".sql")).sort()) {
    await db.exec(readFileSync(new URL(file, migrations), "utf8"));
  }
  return db;
}

export type FinanceDb = PGlite;

/** Acts as a signed-in staff member (or as the system when uid is null). */
export async function actAs(db: FinanceDb, user: { uid: string | null; email: string | null }) {
  await db.query("select set_config('test.uid', $1, false), set_config('test.email', $2, false)", [user.uid ?? "", user.email ?? ""]);
}

export async function createStaff(db: FinanceDb, role: string) {
  const uid = randomUUID();
  const email = `${role}-${uid.slice(0, 8)}@example.com`;
  await db.query("insert into auth.users(id, email) values ($1, $2)", [uid, email]);
  await db.query("insert into public.admin_profiles(id, email, role) values ($1, $2, $3)", [uid, email, role]);
  return { uid, email };
}

export const owner = { uid: null, email: "info@dailyredsea.com" };
export const system = { uid: null, email: null };

let referenceSerial = 0;
export type BookingInput = {
  amount: number;
  currency?: string;
  status?: string;
  payment_status?: string;
  date?: string;
  tour_slug?: string | null;
  tour_name?: string;
  guests?: number;
  adults?: number;
  youth?: number;
  subtotal?: number | null;
  discount_amount?: number;
  sales_commission_percent?: number | null;
  pricing_snapshot?: unknown;
  type?: string;
};

export async function createBooking(db: FinanceDb, input: BookingInput) {
  referenceSerial += 1;
  const { rows } = await db.query<{ id: string }>(
    `insert into public.bookings (reference, type, customer_name, phone, tour_name, tour_slug, date, guests, adults, youth,
       amount, currency, status, payment_status, subtotal, discount_amount, sales_commission_percent, pricing_snapshot)
     values ($1, $2, 'Synthetic Guest', '+201000000000', $3, $4, $5, $6, $7, $8, $9, $10, $11::public.booking_status,
       $12::public.payment_status, $13, $14, $15, $16) returning id`,
    [
      `FIN-${referenceSerial}`, input.type ?? "tour", input.tour_name ?? "Reef Trip", input.tour_slug === undefined ? "reef" : input.tour_slug,
      input.date ?? "2026-10-10", input.guests ?? 2, input.adults ?? input.guests ?? 2, input.youth ?? 0,
      input.amount, input.currency ?? "USD", input.status ?? "confirmed", input.payment_status ?? "paid",
      input.subtotal === undefined ? input.amount : input.subtotal, input.discount_amount ?? 0,
      input.sales_commission_percent ?? null, input.pricing_snapshot === undefined ? null : JSON.stringify(input.pricing_snapshot),
    ],
  );
  return rows[0].id;
}

export async function createSupplier(db: FinanceDb, name = "Blue Boat") {
  const { rows } = await db.query<{ id: string }>("insert into public.suppliers(name) values ($1) returning id", [name]);
  return rows[0].id;
}

export async function assignSupplier(db: FinanceDb, bookingId: string, supplierId: string, internalCost: number | null = null, currency = "USD") {
  await db.query(
    "insert into public.booking_assignments(booking_id, supplier_id, assignment_type, internal_cost, currency) values ($1, $2, 'supplier', $3, $4)",
    [bookingId, supplierId, internalCost, currency],
  );
}

export async function setRate(db: FinanceDb, date: string, currency: string, unitsPerUsd: number) {
  await db.query(
    "insert into public.fx_rates(rate_date, currency, units_per_usd, source) values ($1, $2, $3, 'open_er_api') on conflict (rate_date, currency) do update set units_per_usd = excluded.units_per_usd",
    [date, currency, unitsPerUsd],
  );
}

export async function lines(db: FinanceDb, bookingId: string) {
  const { rows } = await db.query<Record<string, unknown>>(
    "select l.*, s.balance, s.obligation, s.ledger_state, s.ledger_currency, s.supplier_cost_paid_status, s.commission_received_status from public.booking_financial_lines l join public.booking_financial_line_status s on s.line_id = l.id where l.booking_id = $1 order by line_no",
    [bookingId],
  );
  return rows;
}

export async function ledger(db: FinanceDb, where: { bookingId?: string; supplierId?: string }) {
  const { rows } = await db.query<Record<string, unknown>>(
    `select * from public.supplier_ledger where ($1::uuid is null or booking_id = $1) and ($2::uuid is null or supplier_id = $2) order by entry_no`,
    [where.bookingId ?? null, where.supplierId ?? null],
  );
  return rows;
}

/** numeric columns come back as strings; compare as fixed 2-dp strings. */
export const n = (value: unknown) => (value === null || value === undefined ? null : Number(value).toFixed(2));
