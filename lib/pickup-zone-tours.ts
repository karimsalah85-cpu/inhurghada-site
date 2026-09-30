import { tours } from "@/data/tours";

export type PickupTourOption = { slug: string; title: string; destination: string; category: string; availableTimes: string[] };

// Transfers are timed per flight or per request, so they have no standard zone pickup time.
const excluded = new Set(["Airport Transfer", "Shopping Transfer"]);

export const pickupTours: PickupTourOption[] = tours
  .filter((tour) => !excluded.has(tour.category || ""))
  .map((tour) => ({ slug: tour.slug, title: tour.title, destination: tour.destinationSlug, category: tour.category || "Other", availableTimes: tour.availableTimes || [] }))
  .sort((a, b) => a.destination.localeCompare(b.destination) || a.title.localeCompare(b.title));

export const pickupTourSlugs = new Set(pickupTours.map((tour) => tour.slug));
