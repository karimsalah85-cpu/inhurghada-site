import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { bookingRequestHash } from "@/lib/booking-idempotency";

const migration = readFileSync("supabase/migrations/202608120002_booking_idempotency.sql", "utf8");
const route = readFileSync("app/api/bookings/route.ts", "utf8");
const clients = [
  readFileSync("components/booking/BookingForm.tsx", "utf8"),
  readFileSync("components/booking/TransferBookingForm.tsx", "utf8"),
  readFileSync("components/cart/CartCheckout.tsx", "utf8"),
];

describe("durable booking idempotency source contract", () => {
  it("uses stable client UUIDs for retries", () => {
    for (const client of clients) {
      expect(client).toContain("useRef<string | null>(null)");
      expect(client).toContain("crypto.randomUUID()");
      expect(client).toContain("idempotencyKey: idempotencyKey.current");
    }
  });

  it("calls one atomic reservation RPC and never restores direct inserts", () => {
    expect(route).toContain('supabase.rpc("reserve_booking_idempotent"');
    expect(route).not.toMatch(/from\("bookings"\)\.insert/);
    expect(migration).toContain("created := public.reserve_booking(");
    expect(migration).toContain("created := public.reserve_multi_trip_booking(");
  });

  it("serializes concurrent duplicates and rejects changed payloads", () => {
    expect(migration).toContain("on conflict (idempotency_key) do nothing");
    expect(migration).toMatch(/idempotency_key = p_idempotency_key for update/);
    expect(migration).toContain("ledger.request_hash <> p_request_hash");
    expect(migration).toContain("'replayed', true");
  });

  it("keeps capacity, booking, ledger, and notification intents in the same transaction", () => {
    expect(migration).toContain("insert into public.booking_notification_deliveries");
    expect(migration).toContain("set booking_id=created.id,state='completed'");
    expect(migration).not.toMatch(/exception\s+when/i);
  });

  it("deduplicates notification delivery and permits bounded explicit-failure retries", () => {
    expect(migration).toContain("primary key (booking_id, notification_kind)");
    expect(migration).toContain("attempts < 5");
    expect(migration).toContain("state in ('pending','failed')");
    expect(migration).not.toContain("lease_started_at <");
    expect(route).toContain('deliverBookingNotification(supabase, bookingId, "operator_whatsapp"');
  });

  it("stores a hash instead of request PII in the idempotency ledger", () => {
    const ledger = migration.slice(migration.indexOf("create table if not exists public.booking_submission_idempotency"), migration.indexOf("create table if not exists public.booking_notification_deliveries"));
    expect(ledger).toContain("request_hash text");
    expect(ledger).not.toMatch(/email|phone|customer_name/);
  });

  it("retains completed keys durably and exposes functions only to the server role", () => {
    expect(migration).toContain("created_at timestamptz not null default now()");
    expect(migration).not.toMatch(/delete from public\.booking_submission_idempotency/);
    expect(migration).toMatch(/revoke all on function public\.reserve_booking_idempotent[\s\S]*from public,anon,authenticated/);
    expect(migration).toMatch(/grant execute on function public\.reserve_booking_idempotent[\s\S]*to service_role/);
  });

  it("canonicalizes payloads deterministically and detects material changes", () => {
    expect(bookingRequestHash({ travelers: 2, tour: "reef" })).toBe(bookingRequestHash({ tour: "reef", travelers: 2 }));
    expect(bookingRequestHash({ travelers: 2, tour: "reef" })).not.toBe(bookingRequestHash({ travelers: 3, tour: "reef" }));
  });

  it("fails closed when persistence or notification claims fail", () => {
    expect(route).toContain("Booking database save failed");
    expect(route).toContain("Booking notification claim failed");
    expect(route).not.toMatch(/PGRST202|42883/);
  });
});
