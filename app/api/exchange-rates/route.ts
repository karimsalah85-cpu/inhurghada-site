import { NextResponse } from "next/server";

export const runtime = "nodejs";

const fallbackRates = { USD: 1, EUR: 0.876691, GBP: 0.747063, EGP: 51.008475 };

export async function GET() {
  try {
    const response = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 86400 },
    });
    if (!response.ok) throw new Error(`Rate provider returned ${response.status}`);
    const data = await response.json() as { result?: string; time_last_update_unix?: number; rates?: Record<string, number> };
    if (data.result !== "success" || !data.rates) throw new Error("Invalid rate response");
    const rates = Object.fromEntries(Object.keys(fallbackRates).map((currency) => {
      const rate = data.rates?.[currency];
      if (!Number.isFinite(rate) || Number(rate) <= 0) throw new Error(`Missing ${currency} rate`);
      return [currency, Number(rate)];
    }));
    return NextResponse.json({ base: "USD", rates, updatedAt: data.time_last_update_unix ? new Date(data.time_last_update_unix * 1000).toISOString() : null }, { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } });
  } catch (error) {
    console.error("Exchange rate refresh failed", error);
    return NextResponse.json({ base: "USD", rates: fallbackRates, updatedAt: null, fallback: true }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
  }
}
