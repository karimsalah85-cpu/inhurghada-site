import { describe, expect, it, vi } from "vitest";
import { readAdminRows } from "@/lib/admin-query";

describe("admin paginated datasets", () => {
  it("reads past a provider cap smaller than the requested page", async () => {
    const all = Array.from({ length: 1250 }, (_, id) => ({ id }));
    const fetch = vi.fn(async (from: number, to: number) => ({ data: all.slice(from, Math.min(to + 1, from + 200)), error: null, count: all.length }));
    const result = await readAdminRows(fetch, 5000);
    expect(result.data).toEqual(all);
    expect(result.truncated).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(7);
  });
  it("warns when the application cap actually excludes records", async () => {
    const result = await readAdminRows(async (from, to) => ({ data: Array.from({ length: to - from + 1 }, (_, id) => id + from), error: null, count: 6000 }), 5000);
    expect(result.data).toHaveLength(5000);
    expect(result.truncated).toBe(true);
  });
  it("does not report an exact-limit complete dataset as truncated", async () => {
    const result = await readAdminRows(async () => ({ data: [1, 2], error: null, count: 2 }), 2);
    expect(result.truncated).toBe(false);
  });
  it("discards partial totals when a later query fails", async () => {
    const result = await readAdminRows(async (from) => from ? { data: null, error: { message: "Unavailable" }, count: null } : { data: [1], error: null, count: 2 }, 5000);
    expect(result.data).toEqual([]);
    expect(result.error?.message).toBe("Unavailable");
  });
});
