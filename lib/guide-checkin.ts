import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { signingSecret } from "@/lib/ticket-token";

/**
 * Check-in for external guides and drivers without an admin login.
 * Each staff member gets a 6-digit PIN (stored only as a keyed hash). Typing it
 * on a scanned ticket page checks the guest in and remembers that phone with a
 * signed cookie, so later scans need a single tap.
 */
export const guideCookieName = "drs_guide";
export const guideCookieMaxAge = 60 * 60 * 24 * 60; // 60 days
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type CheckinGuide = { id: string; name: string; staffType: string; phone: string | null };

export const normalizePin = (value: unknown) => (typeof value === "string" ? value.replace(/\s+/g, "") : "");
export const isPinFormat = (pin: string) => /^\d{6}$/.test(pin);
export const hashPin = (pin: string) => createHmac("sha256", signingSecret()).update(`checkin-pin:${pin}`).digest("hex");
export const generatePin = () => String(randomInt(0, 1_000_000)).padStart(6, "0");

const cookieSignature = (staffId: string, pinHash: string) =>
  createHmac("sha256", signingSecret()).update(`guide:${staffId}:${pinHash}`).digest("base64url").slice(0, 32);

/** Binding the cookie to the PIN hash means regenerating a PIN signs that guide out everywhere. */
export const guideCookieValue = (staffId: string, pinHash: string) => `${staffId}.${cookieSignature(staffId, pinHash)}`;

async function activeGuide(database: SupabaseClient, staffId: string): Promise<CheckinGuide | null> {
  const { data } = await database.from("staff_members").select("id,name,staff_type,phone,active").eq("id", staffId).maybeSingle();
  if (!data?.active) return null;
  return { id: data.id, name: data.name, staffType: data.staff_type, phone: data.phone ?? null };
}

export async function findGuideByPin(database: SupabaseClient, pin: string): Promise<{ guide: CheckinGuide; pinHash: string } | null> {
  if (!isPinFormat(pin)) return null;
  let pinHash: string;
  try { pinHash = hashPin(pin); } catch { return null; }
  const { data, error } = await database.from("staff_checkin_pins").select("staff_member_id").eq("pin_hash", pinHash).maybeSingle();
  if (error || !data) return null;
  const guide = await activeGuide(database, data.staff_member_id);
  return guide ? { guide, pinHash } : null;
}

export async function findGuideByCookie(database: SupabaseClient, value: string | undefined): Promise<CheckinGuide | null> {
  const [staffId, supplied] = (value || "").split(".");
  if (!staffId || !supplied || !uuidPattern.test(staffId)) return null;
  const { data, error } = await database.from("staff_checkin_pins").select("pin_hash").eq("staff_member_id", staffId).maybeSingle();
  if (error || !data) return null;
  let expected: string;
  try { expected = cookieSignature(staffId, data.pin_hash); } catch { return null; }
  const a = Buffer.from(supplied), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return activeGuide(database, staffId);
}

/** Issues a fresh unique PIN for one staff member, replacing any previous PIN. */
export async function issuePin(database: SupabaseClient, staffId: string): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const pin = generatePin();
    const { error } = await database.from("staff_checkin_pins")
      .upsert({ staff_member_id: staffId, pin_hash: hashPin(pin), created_at: new Date().toISOString() }, { onConflict: "staff_member_id" });
    if (!error) return pin;
    if (error.code !== "23505") throw new Error(error.message);
  }
  throw new Error("Could not generate a unique PIN. Try again.");
}
