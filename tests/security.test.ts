import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyStripeSignature } from "@/lib/booking-service";
import { rateLimit } from "@/lib/rate-limit";

describe("security helpers", () => {
  it("accepts a current valid Stripe signature", () => {
    const body = '{"id":"evt_test"}';
    const secret = "whsec_test";
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = crypto.createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
    expect(verifyStripeSignature(body, `t=${timestamp},v1=${signature}`, secret)).toBe(true);
  });

  it("rejects invalid, malformed and replayed signatures without throwing", () => {
    expect(verifyStripeSignature("{}", "t=1,v1=bad", "secret")).toBe(false);
    expect(verifyStripeSignature("{}", "malformed", "secret")).toBe(false);
    expect(verifyStripeSignature("{}", null, "secret")).toBe(false);
  });

  it("limits repeated requests", () => {
    const key = `test-${crypto.randomUUID()}`;
    expect(rateLimit(key, 2, 60_000).allowed).toBe(true);
    expect(rateLimit(key, 2, 60_000).allowed).toBe(true);
    expect(rateLimit(key, 2, 60_000).allowed).toBe(false);
  });
});
