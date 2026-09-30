import { readFileSync } from "node:fs";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { actAs, createBooking, createFinanceDatabase, createStaff, owner, type FinanceDb } from "./support/finance-db";
import { isKnownApplicationPath } from "@/lib/public-routes";
import { requiresWaiver, validateWaiverSubmission, waiverSignaturesNeeded, waiverStatusLabel, waiverWhatsAppText } from "@/lib/waiver";
import { WAIVER_IS_TEMPLATE, WAIVER_VERSION, getWaiverContent, waiverTemplateNotice } from "@/lib/waiver-content";
import { createWaiverToken, hashIp, verifyWaiverToken, waiverExpiry, waiverUrl } from "@/lib/waiver-token";
import { createSupplierRequestToken } from "@/lib/supplier-request-token";
import { createTicketToken } from "@/lib/ticket-token";

const content = getWaiverContent("en");

function validForm(overrides: Record<string, string | null> = {}) {
  const values: Record<string, string | null> = {
    participant_name: "  Anna   Müller ",
    date_of_birth: "1990-04-12",
    certification: "open_water",
    signature_name: "Anna Müller",
    ...Object.fromEntries(content.medicalQuestions.map((q) => [`medical_${q.id}`, "no"])),
    ...Object.fromEntries(content.acknowledgements.map((a) => [`ack_${a.id}`, "on"])),
    ...overrides,
  };
  return { get: (name: string) => values[name] ?? null };
}

describe("which bookings need a waiver", () => {
  it("covers every Diving-category tour and nothing else", () => {
    for (const slug of ["full-day-diving", "beginner-scuba-diving", "padi-open-water-course", "ssi-open-water-course", "basic-diver-jeddah", "certified-diver-boat-trip-jeddah"]) {
      expect(requiresWaiver(slug), slug).toBe(true);
    }
    for (const slug of ["orange-bay", "full-day-snorkeling", "hurghada-airport-transfer", "", null, undefined, "not-a-tour"]) {
      expect(requiresWaiver(slug), String(slug)).toBe(false);
    }
  });

  it("needs one signature per adult and youth, never infants", () => {
    expect(waiverSignaturesNeeded({ adults: 2, youth: 1, infants: 1, guests: 4 })).toBe(3);
    expect(waiverSignaturesNeeded({ adults: 0, youth: 0, infants: 0, guests: 3 })).toBe(3);
    expect(waiverSignaturesNeeded({ adults: null, youth: null, infants: null, guests: 2 })).toBe(2);
    expect(waiverSignaturesNeeded({ adults: 0, youth: 0, infants: 1, guests: 1 })).toBe(0);
  });

  it("labels waiver status for the admin", () => {
    expect(waiverStatusLabel(1, 2)).toBe("Waivers 1/2 signed");
    expect(waiverStatusLabel(2, 2)).toBe("Waivers 2/2 signed ✓");
  });
});

describe("waiver tokens", () => {
  const previous = process.env.TICKET_SIGNING_SECRET;
  beforeEach(() => { process.env.TICKET_SIGNING_SECRET = "test-waiver-secret"; });
  afterEach(() => { if (previous === undefined) delete process.env.TICKET_SIGNING_SECRET; else process.env.TICKET_SIGNING_SECRET = previous; });
  const now = new Date("2026-10-01T10:00:00Z");

  it("round-trips a booking reference and expiry", () => {
    const token = createWaiverToken("drs-20261001-abc123", new Date("2026-10-10T00:00:00Z"));
    expect(verifyWaiverToken(token, now)).toEqual({ reference: "DRS-20261001-ABC123", expiresAt: new Date("2026-10-10T00:00:00Z"), expired: false });
    expect(verifyWaiverToken(token, new Date("2026-10-11T00:00:00Z"))?.expired).toBe(true);
  });

  it("expires two days after the trip, or 60 days out when the date is unknown", () => {
    expect(waiverExpiry("2026-10-05", now).toISOString()).toBe("2026-10-07T23:59:59.000Z");
    expect(waiverExpiry(null, now).toISOString()).toBe("2026-11-30T10:00:00.000Z");
  });

  it("rejects edited, forged and foreign-secret tokens", () => {
    const token = createWaiverToken("DRS-ABC123", new Date("2026-10-10T00:00:00Z"));
    const [reference, expiry, signature] = token.split(".");
    expect(verifyWaiverToken(`DRS-ABC124.${expiry}.${signature}`, now)).toBeNull();
    expect(verifyWaiverToken(`${reference}.${(parseInt(expiry, 36) + 86_400).toString(36)}.${signature}`, now)).toBeNull();
    expect(verifyWaiverToken("garbage", now)).toBeNull();
    expect(verifyWaiverToken(null, now)).toBeNull();
    process.env.TICKET_SIGNING_SECRET = "other-secret";
    expect(verifyWaiverToken(token, now)).toBeNull();
  });

  it("cannot be confused with ticket or supplier links", () => {
    expect(verifyWaiverToken(createTicketToken("DRS-ABC123", 0), now)).toBeNull();
    expect(verifyWaiverToken(createSupplierRequestToken("0f8fad5b-d9cb-469f-a165-70867728950e"), now)).toBeNull();
  });

  it("builds a public URL without guest data", () => {
    expect(waiverUrl("DRS-ABC123", "2026-10-05", now)).toMatch(/^https:\/\/dailyredsea\.com\/waiver\/DRS-ABC123\.[0-9a-z]+\.[A-Za-z0-9_-]{27}$/);
  });

  it("hashes IPs with the server secret and never returns the raw address", () => {
    const hash = hashIp("203.0.113.9");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain("203.0.113.9");
    process.env.TICKET_SIGNING_SECRET = "other-secret";
    expect(hashIp("203.0.113.9")).not.toBe(hash);
  });

  it("routes /waiver/<token> without a locale prefix only", () => {
    expect(isKnownApplicationPath("/waiver/DRS-ABC123.abc12.x")).toBe(true);
    expect(isKnownApplicationPath("/de/waiver/DRS-ABC123.abc12.x")).toBe(false);
    expect(isKnownApplicationPath("/waiver")).toBe(false);
  });
});

describe("waiver submissions", () => {
  const today = new Date("2026-10-01T00:00:00Z");

  it("accepts a complete form and normalises names", () => {
    const result = validateWaiverSubmission(validForm({ photo_consent: "on" }), content, today);
    expect(result).toMatchObject({ ok: true, value: { participantName: "Anna Müller", dateOfBirth: "1990-04-12", certification: "open_water", medicalFlagged: false, photoConsent: true, signatureName: "Anna Müller" } });
  });

  it("flags any YES medical answer", () => {
    const result = validateWaiverSubmission(validForm({ medical_lungs: "yes" }), content, today);
    expect(result.ok && result.value.medicalFlagged).toBe(true);
    expect(result.ok && result.value.medicalAnswers.lungs).toBe("yes");
  });

  it("requires every medical question, every acknowledgement and a signature", () => {
    expect(validateWaiverSubmission(validForm({ medical_heart: null }), content, today)).toEqual({ ok: false, error: "medical" });
    expect(validateWaiverSubmission(validForm({ medical_heart: "maybe" }), content, today)).toEqual({ ok: false, error: "medical" });
    expect(validateWaiverSubmission(validForm({ ack_truthful: null }), content, today)).toEqual({ ok: false, error: "acknowledge" });
    expect(validateWaiverSubmission(validForm({ signature_name: " " }), content, today)).toEqual({ ok: false, error: "signature" });
    expect(validateWaiverSubmission(validForm({ participant_name: "A" }), content, today)).toEqual({ ok: false, error: "name" });
    expect(validateWaiverSubmission(validForm({ participant_name: "x".repeat(121) }), content, today)).toEqual({ ok: false, error: "name" });
  });

  it("validates the optional date of birth and certification", () => {
    expect(validateWaiverSubmission(validForm({ date_of_birth: "" }), content, today).ok).toBe(true);
    expect(validateWaiverSubmission(validForm({ date_of_birth: "2026-02-30" }), content, today)).toEqual({ ok: false, error: "dob" });
    expect(validateWaiverSubmission(validForm({ date_of_birth: "2030-01-01" }), content, today)).toEqual({ ok: false, error: "dob" });
    expect(validateWaiverSubmission(validForm({ certification: "" }), content, today).ok).toBe(true);
    expect(validateWaiverSubmission(validForm({ certification: "instructor" }), content, today)).toEqual({ ok: false, error: "certification" });
  });
});

describe("waiver content", () => {
  it("is versioned, marked as template wording and covers the required sections", () => {
    expect(WAIVER_VERSION).toMatch(/\S/);
    expect(WAIVER_IS_TEMPLATE).toBe(true);
    expect(waiverTemplateNotice).toMatch(/lawyer/i);
    expect(content.sections.map((s) => s.id)).toEqual(expect.arrayContaining(["assumption-of-risk", "medical-fitness", "instructions", "equipment"]));
    expect(content.medicalQuestions).toHaveLength(8);
    expect(new Set(content.medicalQuestions.map((q) => q.id)).size).toBe(8);
    expect(readFileSync("lib/waiver-content.ts", "utf8")).toContain("TEMPLATE WORDING");
  });

  it("builds a WhatsApp message with the link", () => {
    const text = waiverWhatsAppText({ customerName: "Anna Müller", reference: "DRS-1", tourName: "Full Day Diving", link: "https://dailyredsea.com/waiver/x", needed: 2 });
    expect(text).toContain("Hello Anna!");
    expect(text).toContain("(2 signatures)");
    expect(text).toContain("https://dailyredsea.com/waiver/x");
  });
});

describe("waiver migration", () => {
  const sql = readFileSync("supabase/migrations/20261001110000_guest_requirements_and_waivers.sql", "utf8");
  it("is additive, enables RLS and gives the public no write access", () => {
    expect(sql).not.toMatch(/\bdrop\s+(table|column)\b/i);
    expect(sql).toContain("enable row level security");
    expect(sql).toMatch(/revoke all on public\.booking_waivers from public, anon, authenticated/);
    expect(sql).not.toMatch(/grant[^;]*(insert|update|delete)[^;]*to (anon|authenticated)/i);
    expect(sql).toContain("on delete cascade");
    expect(sql).toContain("guest_requirements jsonb not null default '{}'");
  });
});

describe("booking_waivers schema", () => {
  let db: FinanceDb;
  beforeAll(async () => { db = await createFinanceDatabase(); }, 120_000);
  afterAll(async () => { await db?.close(); });

  const insert = (bookingId: string, overrides: Record<string, unknown> = {}) => {
    const row = { participant_name: "Anna Müller", accepted: true, signature_name: "Anna Müller", waiver_version: WAIVER_VERSION, medical_declaration: JSON.stringify({ answers: { heart: "yes" }, flagged: true }), ...overrides };
    const keys = Object.keys(row);
    return db.query<{ id: string; medical_flagged: boolean }>(
      `insert into public.booking_waivers (booking_id, ${keys.join(", ")}) values ($1, ${keys.map((_, i) => `$${i + 2}`).join(", ")}) returning id, medical_flagged`,
      [bookingId, ...Object.values(row)],
    );
  };

  it("defaults guest_requirements to an empty object and rejects non-objects", async () => {
    const bookingId = await createBooking(db, { amount: 50, tour_slug: "full-day-diving" });
    const { rows } = await db.query<{ guest_requirements: unknown }>("select guest_requirements from public.bookings where id = $1", [bookingId]);
    expect(rows[0].guest_requirements).toEqual({});
    await expect(db.query("update public.bookings set guest_requirements = '[]'::jsonb where id = $1", [bookingId])).rejects.toThrow(/bookings_guest_requirements_object/);
    await db.query(`update public.bookings set guest_requirements = '{"nonSwimmers":1}'::jsonb where id = $1`, [bookingId]);
  });

  it("stores signed waivers, derives the medical flag and rejects invalid rows", async () => {
    const bookingId = await createBooking(db, { amount: 50, tour_slug: "full-day-diving" });
    const { rows } = await insert(bookingId);
    expect(rows[0].medical_flagged).toBe(true);
    const clean = await insert(bookingId, { medical_declaration: JSON.stringify({ answers: { heart: "no" }, flagged: false }) });
    expect(clean.rows[0].medical_flagged).toBe(false);
    await expect(insert(bookingId, { accepted: false })).rejects.toThrow();
    await expect(insert(bookingId, { ip_hash: "203.0.113.9" })).rejects.toThrow();
    await expect(insert(bookingId, { certification: "instructor" })).rejects.toThrow();
  });

  it("gives database clients read access only, through the booking permission", async () => {
    const { rows } = await db.query<{ anon: boolean; insert: boolean; select: boolean; service: boolean }>(`select
      has_table_privilege('anon', 'public.booking_waivers', 'select') as anon,
      has_table_privilege('authenticated', 'public.booking_waivers', 'insert') as insert,
      has_table_privilege('authenticated', 'public.booking_waivers', 'select') as select,
      has_table_privilege('service_role', 'public.booking_waivers', 'insert') as service`);
    expect(rows[0]).toEqual({ anon: false, insert: false, select: true, service: true });

    const bookingId = await createBooking(db, { amount: 50, tour_slug: "full-day-diving" });
    await insert(bookingId);
    const content = await createStaff(db, "content_editor");
    const operations = await createStaff(db, "operations");
    const visible = async (user: { uid: string | null; email: string | null }) => {
      await actAs(db, user);
      await db.exec("set role authenticated");
      try { return (await db.query("select id from public.booking_waivers where booking_id = $1", [bookingId])).rows.length; }
      finally { await db.exec("reset role"); await actAs(db, { uid: null, email: null }); }
    };
    expect(await visible(operations)).toBe(1);
    expect(await visible(owner)).toBe(1);
    expect(await visible(content)).toBe(0);
  });
});
