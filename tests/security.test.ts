import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { rateLimit, rateLimitShared } from "@/lib/rate-limit";

describe("security helpers", () => {
  it("limits repeated requests", () => {
    const key = `test-${crypto.randomUUID()}`;
    expect(rateLimit(key, 2, 60_000).allowed).toBe(true);
    expect(rateLimit(key, 2, 60_000).allowed).toBe(true);
    expect(rateLimit(key, 2, 60_000).allowed).toBe(false);
  });

  it("falls back to the in-process limiter when the shared store is unavailable", async () => {
    const key = `test-shared-${crypto.randomUUID()}`;
    expect((await rateLimitShared(key, 2, 60_000)).allowed).toBe(true);
    expect((await rateLimitShared(key, 2, 60_000)).allowed).toBe(true);
    const blocked = await rateLimitShared(key, 2, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });
});
