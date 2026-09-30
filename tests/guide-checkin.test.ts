import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { findGuideByCookie, findGuideByPin, generatePin, guideCookieValue, hashPin, isPinFormat, normalizePin } from "@/lib/guide-checkin";

const staffId = "11111111-2222-4333-8444-555555555555";

/** Minimal stand-in for the two tables the guide lookup reads. */
function fakeDatabase(rows: { pins: { staff_member_id: string; pin_hash: string }[]; staff: { id: string; name: string; staff_type: string; phone: string | null; active: boolean }[] }) {
  return {
    from(table: string) {
      const filters: Record<string, unknown> = {};
      const query = {
        select() { return query; },
        eq(column: string, value: unknown) { filters[column] = value; return query; },
        async maybeSingle() {
          const source = (table === "staff_checkin_pins" ? rows.pins : rows.staff) as Record<string, unknown>[];
          return { data: source.find((row) => Object.entries(filters).every(([key, value]) => row[key] === value)) ?? null, error: null };
        },
      };
      return query;
    },
  } as unknown as SupabaseClient;
}

describe("guide check-in PINs", () => {
  const previous = process.env.TICKET_SIGNING_SECRET;
  beforeEach(() => { process.env.TICKET_SIGNING_SECRET = "test-ticket-secret"; });
  afterEach(() => { if (previous === undefined) delete process.env.TICKET_SIGNING_SECRET; else process.env.TICKET_SIGNING_SECRET = previous; });

  it("generates 6-digit PINs and stores only a keyed hash", () => {
    const pin = generatePin();
    expect(isPinFormat(pin)).toBe(true);
    expect(hashPin(pin)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashPin(pin)).not.toContain(pin);
    expect(normalizePin(" 123 456 ")).toBe("123456");
    expect(isPinFormat("12345")).toBe(false);
  });

  it("identifies an active guide by PIN and rejects deactivated ones", async () => {
    const pinHash = hashPin("482913");
    const staff = [{ id: staffId, name: "Ahmed", staff_type: "guide", phone: "+201000000000", active: true }];
    const database = fakeDatabase({ pins: [{ staff_member_id: staffId, pin_hash: pinHash }], staff });
    expect((await findGuideByPin(database, "482913"))?.guide.name).toBe("Ahmed");
    expect(await findGuideByPin(database, "000000")).toBeNull();
    staff[0].active = false;
    expect(await findGuideByPin(database, "482913")).toBeNull();
  });

  it("remembers the phone until the PIN is regenerated", async () => {
    const oldHash = hashPin("482913");
    const staff = [{ id: staffId, name: "Ahmed", staff_type: "guide", phone: null, active: true }];
    const pins = [{ staff_member_id: staffId, pin_hash: oldHash }];
    const database = fakeDatabase({ pins, staff });
    const cookie = guideCookieValue(staffId, oldHash);
    expect((await findGuideByCookie(database, cookie))?.id).toBe(staffId);
    expect(await findGuideByCookie(database, `${staffId}.forged-signature-value-000000000`)).toBeNull();
    pins[0].pin_hash = hashPin("777111");
    expect(await findGuideByCookie(database, cookie)).toBeNull();
  });
});
