import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchHistoricalRates, parseCurrencyApi, parseOpenErApi, storeSnapshot } from "@/lib/finance/fx";
import { tourDimensions } from "@/lib/finance/dimensions";

const openErPayload = { result: "success", time_last_update_unix: 1_790_121_751, rates: { USD: 1, EUR: 0.873207, GBP: 0.749328, EGP: 51.655442, SAR: 3.75 } };
const currencyApiPayload = { date: "2026-07-01", usd: { eur: 0.8768582, gbp: 0.75564998, egp: 49.22598776, sar: 3.75 } };

describe("FX source parsing", () => {
  it("reads open.er-api latest rates with their publication date", () => {
    const snapshot = parseOpenErApi(openErPayload);
    expect(snapshot.date).toBe("2026-09-23");
    expect(snapshot.unitsPerUsd).toEqual({ EUR: "0.873207", GBP: "0.749328", EGP: "51.655442", SAR: "3.75" });
  });

  it("reads dated currency-api history", () => {
    expect(parseCurrencyApi(currencyApiPayload, "2026-07-01").unitsPerUsd.EGP).toBe("49.22598776");
  });

  it("refuses incomplete or mismatched payloads instead of inventing rates", () => {
    expect(() => parseOpenErApi({ result: "error" })).toThrow();
    expect(() => parseOpenErApi({ ...openErPayload, rates: { EUR: 0.9 } })).toThrow(/GBP/);
    expect(() => parseOpenErApi({ ...openErPayload, rates: { ...openErPayload.rates, EGP: -1 } })).toThrow(/EGP/);
    expect(() => parseCurrencyApi(currencyApiPayload, "2026-07-02")).toThrow();
  });

  it("falls back to the mirror when jsDelivr fails", async () => {
    const calls: string[] = [];
    const fakeFetch = (async (url: string) => {
      calls.push(url);
      if (url.includes("jsdelivr")) return new Response("nope", { status: 503 });
      return Response.json(currencyApiPayload);
    }) as typeof fetch;
    const snapshot = await fetchHistoricalRates("2026-07-01", fakeFetch);
    expect(snapshot.source).toBe("currency_api");
    expect(calls).toHaveLength(2);
  });
});

describe("storing snapshots", () => {
  function fakeSupabase(existing: { currency: string; source: string }[]) {
    const upserts: unknown[] = [];
    const client = {
      from: () => ({
        select: () => ({ eq: async () => ({ data: existing, error: null }) }),
        upsert: async (rows: unknown) => { upserts.push(rows); return { error: null }; },
      }),
    } as unknown as SupabaseClient;
    return { client, upserts };
  }
  const snapshot = parseOpenErApi(openErPayload);

  it("never overwrites an admin override", async () => {
    const { client, upserts } = fakeSupabase([{ currency: "EGP", source: "manual" }, { currency: "EUR", source: "open_er_api" }]);
    expect(await storeSnapshot(client, snapshot, { replaceAutomatic: true })).toBe(3);
    expect((upserts[0] as { currency: string }[]).map((row) => row.currency)).toEqual(["EUR", "GBP", "SAR"]);
  });

  it("only fills gaps when backfilling history", async () => {
    const { client, upserts } = fakeSupabase([{ currency: "EUR", source: "open_er_api" }]);
    expect(await storeSnapshot(client, snapshot, { replaceAutomatic: false })).toBe(3);
    expect((upserts[0] as { currency: string }[]).map((row) => row.currency)).toEqual(["GBP", "EGP", "SAR"]);
  });
});

describe("tour dimensions", () => {
  it("maps catalog tours to destination and product line", () => {
    const rows = tourDimensions([
      { slug: "giftun", title: "Giftun Island", destinationSlug: "hurghada", category: "Island Trip" },
      { slug: "custom", title: "Custom", destinationSlug: "jeddah", category: undefined },
    ]);
    expect(rows).toEqual([
      { tour_slug: "giftun", tour_name: "Giftun Island", destination: "hurghada", product_line: "Island Trip" },
      { tour_slug: "custom", tour_name: "Custom", destination: "jeddah", product_line: "Tour" },
    ]);
  });

  it("covers the whole live catalog", () => {
    const rows = tourDimensions();
    expect(rows.length).toBeGreaterThan(10);
    expect(new Set(rows.map((row) => row.tour_slug)).size).toBe(rows.length);
    expect(rows.every((row) => row.destination)).toBe(true);
  });
});
