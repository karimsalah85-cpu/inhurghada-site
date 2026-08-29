"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type ApprovedReview = { customer_name: string; rating: number; body: string; created_at: string };
export type TripReviewsPayload = { average: number; count: number; reviews: ApprovedReview[] };

type TripReviewsValue = TripReviewsPayload & { loaded: boolean };

const empty: TripReviewsValue = { average: 0, count: 0, reviews: [], loaded: false };

const TripReviewsContext = createContext<TripReviewsValue>(empty);

/**
 * Fetches a trip's approved reviews once and shares them with every consumer on
 * the page (the rating badge in the header and the guest-reviews section lower
 * down), so both show the same live average and the endpoint is only hit once.
 */
export function TripReviewsProvider({ tourSlug, children }: { tourSlug: string; children: React.ReactNode }) {
  const [value, setValue] = useState<TripReviewsValue>(empty);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/reviews?tour_slug=${encodeURIComponent(tourSlug)}`, { cache: "no-store", signal: controller.signal })
      .then((response) => (response.ok ? (response.json() as Promise<TripReviewsPayload>) : null))
      .then((payload) => setValue({ ...(payload ?? empty), loaded: true }))
      .catch((error: unknown) => { if ((error as { name?: string }).name !== "AbortError") setValue({ ...empty, loaded: true }); });
    return () => controller.abort();
  }, [tourSlug]);
  return <TripReviewsContext.Provider value={value}>{children}</TripReviewsContext.Provider>;
}

export function useTripReviews() {
  return useContext(TripReviewsContext);
}
