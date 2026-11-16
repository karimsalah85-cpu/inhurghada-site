"use client";

import { useCallback, useEffect, useState } from "react";
import { pickDatePrice, type DatePriceLookup, type DatePriceSlot } from "@/lib/date-pricing";

/**
 * Prices set for single dates, for the trips in the cart. Until a date has loaded it uses the
 * normal price; the server recalculates the total at checkout either way.
 */
export function useDatePrices(trips: ReadonlyArray<{ tourSlug: string; date: string }>): DatePriceLookup {
  const [slots, setSlots] = useState<Record<string, DatePriceSlot[]>>({});
  const keys = [...new Set(trips.map((trip) => `${trip.tourSlug}|${trip.date}`))].sort().join(",");

  useEffect(() => {
    const controller = new AbortController();
    for (const key of keys ? keys.split(",") : []) {
      const [tour, date] = key.split("|");
      fetch(`/api/availability?tour=${encodeURIComponent(tour)}&date=${encodeURIComponent(date)}`, { signal: controller.signal })
        .then((response) => response.ok ? response.json() : null)
        .then((result) => { if (result?.slots) setSlots((current) => ({ ...current, [key]: result.slots })); })
        .catch(() => undefined);
    }
    return () => controller.abort();
  }, [keys]);

  return useCallback((tourSlug, date, time) => pickDatePrice(slots[`${tourSlug}|${date}`], time), [slots]);
}
