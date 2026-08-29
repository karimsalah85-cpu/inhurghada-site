"use client";

import { useTripReviews } from "@/components/tours/TripReviewsContext";

/**
 * Header rating chip. Shows the live approved-review average once it has loaded;
 * until then (or when a trip has no approved reviews yet) it falls back to the
 * catalog's seed rating so the number never disappears or contradicts the
 * guest-reviews section below.
 */
export default function TripRatingBadge({ fallbackRating, fallbackCount, label }: { fallbackRating: string | number; fallbackCount: number; label: string }) {
  const { average, count, loaded } = useTripReviews();
  const useLive = loaded && count > 0;
  const rating = useLive ? average : fallbackRating;
  const reviewCount = useLive ? count : fallbackCount;
  if (!useLive && !(Number.isFinite(reviewCount) && reviewCount > 0)) return null;
  return (
    <>
      <span>★ {rating}</span>
      <span>{reviewCount} {label}</span>
      <span>•</span>
    </>
  );
}
