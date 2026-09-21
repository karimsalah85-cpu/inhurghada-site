import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateOtp, hashOtp, signRedemptionToken, verifyRedemptionToken } from "@/lib/referral-server";

const secret = "test-only-referral-secret-not-used-in-production";
const customer = "first.last+holiday@example.co.uk";
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-21T12:00:00Z"));
  vi.stubEnv("REFERRAL_TOKEN_SECRET", secret);
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });
function forged(claims: unknown) {
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return `${payload}.${createHmac("sha256", secret).update(payload).digest("hex")}`;
}
describe("referral redemption proof", () => {
  it("roundtrips a dotted email without splitting the identity", () => {
    expect(verifyRedemptionToken(signRedemptionToken(customer), customer)).toBe(true);
  });
  it("cannot authorize another customer's wallet", () => {
    expect(verifyRedemptionToken(signRedemptionToken(customer), "other@example.co.uk")).toBe(false);
  });
  it("rejects modified claims and modified signatures", () => {
    const token = signRedemptionToken(customer);
    const [payload, signature] = token.split(".");
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    claims.customerKey = "attacker@example.com";
    const altered = `${Buffer.from(JSON.stringify(claims)).toString("base64url")}.${signature}`;
    expect(verifyRedemptionToken(altered, claims.customerKey)).toBe(false);
    expect(verifyRedemptionToken(`${payload}.${signature.slice(0, -1)}${signature.endsWith("0") ? "1" : "0"}`, customer)).toBe(false);
  });
  it("expires precisely after thirty minutes", () => {
    const token = signRedemptionToken(customer);
    vi.advanceTimersByTime(30 * 60 * 1000 - 1);
    expect(verifyRedemptionToken(token, customer)).toBe(true);
    vi.advanceTimersByTime(1);
    expect(verifyRedemptionToken(token, customer)).toBe(false);
  });
  it("rejects malformed, oversized and legacy ambiguous proofs", () => {
    for (const token of [undefined, "", "a.b.c", "not-json." + "0".repeat(64), "x".repeat(2049), `${customer}.${Date.now() + 1000}.${"0".repeat(64)}`]) {
      expect(verifyRedemptionToken(token, customer)).toBe(false);
    }
  });
  it("rejects unsupported versions and invalid expiry claims even with a correct MAC", () => {
    for (const claims of [
      { version: 2, customerKey: customer, expires: Date.now() + 1000 },
      { version: 1, customerKey: customer, expires: String(Date.now() + 1000) },
      { version: 1, customerKey: customer, expires: Date.now() + 31 * 60 * 1000 },
    ]) expect(verifyRedemptionToken(forged(claims), customer)).toBe(false);
  });
  it("fails closed when the secret is absent or has rotated", () => {
    const token = signRedemptionToken(customer);
    vi.stubEnv("REFERRAL_TOKEN_SECRET", "different-secret");
    expect(verifyRedemptionToken(token, customer)).toBe(false);
    vi.stubEnv("REFERRAL_TOKEN_SECRET", "");
    expect(verifyRedemptionToken(token, customer)).toBe(false);
    expect(() => signRedemptionToken(customer)).toThrow("REFERRAL_TOKEN_SECRET");
  });
});
describe("OTP generation", () => {
  it("generates six digits and hashes without retaining the plaintext", () => {
    const otp = generateOtp();
    expect(otp).toMatch(/^\d{6}$/);
    expect(hashOtp(otp)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashOtp("000123")).not.toBe(hashOtp("123"));
  });
});

const api = vi.hoisted(() => ({ rpc: vi.fn(), origin: vi.fn(), limit: vi.fn() }));
vi.mock("@/utils/supabase/admin", () => ({ createRequiredAdminClient: () => ({ rpc: api.rpc }) }));
vi.mock("@/lib/request-origin", () => ({ hasValidRequestOrigin: api.origin }));
vi.mock("@/lib/rate-limit", () => ({ rateLimitShared: api.limit }));
import { NextRequest } from "next/server";
import { POST as confirmOtp } from "@/app/api/referral/verify/confirm/route";
function confirmation() { return new NextRequest("https://dailyredsea.com/api/referral/verify/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: customer, code: "123456" }) }); }
describe("atomic referral OTP confirmation", () => {
  beforeEach(() => { api.rpc.mockReset(); api.origin.mockReturnValue(true); api.limit.mockResolvedValue({ allowed: true }); });
  it("does not query reward accounts when atomic consumption fails", async () => {
    api.rpc.mockResolvedValue({ data: null, error: { message: "database unavailable" } });
    const response = await confirmOtp(confirmation());
    expect(response.status).toBe(503);
    expect(api.rpc).toHaveBeenCalledTimes(1);
    expect(api.rpc).toHaveBeenCalledWith("consume_referral_otp", { p_customer_key: customer, p_code_hash: hashOtp("123456") });
    expect(await response.json()).not.toHaveProperty("redemptionToken");
  });
  it("does not expose rewards for an expired, consumed, or wrong code", async () => {
    api.rpc.mockResolvedValue({ data: false, error: null });
    const response = await confirmOtp(confirmation());
    expect(response.status).toBe(400);
    expect(api.rpc).toHaveBeenCalledTimes(1);
    expect(await response.json()).not.toHaveProperty("balanceUnits");
  });
  it("fails closed if account reading fails after the code is consumed", async () => {
    api.rpc.mockResolvedValueOnce({ data: true, error: null }).mockResolvedValueOnce({ data: null, error: { message: "query failed" } });
    const response = await confirmOtp(confirmation());
    expect(response.status).toBe(503);
    expect(await response.json()).not.toHaveProperty("redemptionToken");
  });
  it("returns a proof only after consumption and account lookup succeed", async () => {
    api.rpc.mockResolvedValueOnce({ data: true, error: null }).mockResolvedValueOnce({ data: { qualified: true, referral_code: "DRS-ABCDEF", balance_units: 4, qualified_referrals: 4, pending_referrals: 0 }, error: null });
    const response = await confirmOtp(confirmation());
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.balanceUnits).toBe(4);
    expect(verifyRedemptionToken(body.redemptionToken, customer)).toBe(true);
    expect(verifyRedemptionToken(body.redemptionToken, "other@example.com")).toBe(false);
  });
  it("rejects origin violations and rate-limited attempts without consuming a code", async () => {
    api.origin.mockReturnValue(false);
    expect((await confirmOtp(confirmation())).status).toBe(403);
    api.origin.mockReturnValue(true);
    api.limit.mockResolvedValue({ allowed: false });
    expect((await confirmOtp(confirmation())).status).toBe(429);
    expect(api.rpc).not.toHaveBeenCalled();
  });
});
