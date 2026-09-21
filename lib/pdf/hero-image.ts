import fs from "node:fs";
import path from "node:path";

/**
 * Resolves the PDF hero photo for a booking. Per-tour where a real photo
 * exists in /public/images, otherwise a keyword-based category fallback, so
 * the hero is never one hardcoded photo for every booking — an Orange Bay
 * confirmation shows Orange Bay, a Jeddah yacht booking shows the yacht
 * cruise photo, a dive booking shows a reef/diver photo, and so on.
 */
const bySlug: Record<string, string> = {
  "orange-bay": "orange-bay.jpeg",
  "orange-bay-full-day-speedboat": "orange-bay.jpeg",
  "orange-bay-half-day-speedboat": "orange-bay.jpeg",
  "full-day-snorkeling": "full-day-snorkeling.jpg",
  "full-day-diving": "full-day-diving.jpg",
  "beginner-scuba-diving": "hurghada-red-sea-scuba-diver.jpeg",
  "padi-open-water-course": "hurghada-red-sea-scuba-diver.jpeg",
  "ssi-open-water-course": "hurghada-red-sea-scuba-diver.jpeg",
  "basic-diver-jeddah": "scuba-diving.jpg",
  "certified-diver-boat-trip-jeddah": "scuba-diving.jpg",
  "mahmya-island": "mahmya-island.jpg",
  "hula-hula-island-snorkeling": "hurghada-island-beach-loungers.jpeg",
  "paradise-island": "hurghada-island-calm-sunset.jpeg",
  "paradise-island-speedboat": "speedboat-cruise.jpeg",
  "hula-hula-speedboat": "speedboat-aerial.jpeg",
  "magawish-speedboat": "speedboat-guests.jpeg",
  "dolphin-house-marsa-alam": "hurghada-red-sea-coral-reef.jpeg",
  "dolphin-house-snorkeling": "hurghada-snorkeling-reef-panorama.jpeg",
  "abu-dabbab-snorkeling": "hurghada-snorkeling-sandy-seabed.jpeg",
  "marsa-mubarak-snorkeling": "hurghada-snorkeling-reef-panorama.jpeg",
  "el-gouna-city-boat-tour": "speedboat-cruise.jpeg",
  "jeddah-yacht-sunset-cruise": "hurghada-island-family-sunset.jpeg",
  "royal-seascope-submarine": "hurghada-red-sea-coral-reef.jpeg",
  "quad-safari-morning": "hurghada-desert-quad-tour.jpeg",
  "quad-safari-sunset": "quad-safari-sunset.jpg",
  "safari": "desert-safari.jpg",
  "super-safari": "desert-safari.jpg",
  "desert-stargazing": "hurghada-desert-camel-closeup.jpeg",
  "horse-riding-sea-desert": "hurghada-desert-camel-profile.jpeg",
  "sahl-hasheesh-horse-riding": "hurghada-desert-camel-profile.jpeg",
  "luxor-private-day-trip": "luxor-day-trip.jpg",
  "cairo-day-trip-flight": "karnak-temple.jpg",
  "cairo-giza-day-trip-bus": "karnak-temple.jpg",
  "hurghada-airport-transfer": "transfer.jpg",
  "senzo-transfer": "senzo-transfer.jpg",
};

const keywordFallbacks: [RegExp, string][] = [
  [/dive|diving|scuba/, "hurghada-red-sea-scuba-diver.jpeg"],
  [/snorkel/, "hurghada-snorkeling-reef-panorama.jpeg"],
  [/island/, "hurghada-island-calm-sunset.jpeg"],
  [/speedboat|boat|yacht|cruise/, "speedboat-cruise.jpeg"],
  [/quad|safari|desert|horse/, "desert-safari.jpg"],
  [/luxor|cairo|karnak/, "karnak-temple.jpg"],
  [/transfer/, "transfer.jpg"],
];

const DEFAULT_IMAGE = "hero-egypt-red-sea.jpg";
const imagesDir = path.join(process.cwd(), "public/images");

let cache: Map<string, Buffer | null> | undefined;

function loadImageBuffer(fileName: string): Buffer | null {
  if (!cache) cache = new Map();
  if (!cache.has(fileName)) {
    try {
      cache.set(fileName, fs.readFileSync(path.join(imagesDir, fileName)));
    } catch {
      cache.set(fileName, null);
    }
  }
  return cache.get(fileName) ?? null;
}

/** Returns the hero photo bytes for a booking's tour, with graceful fallback if the slug is unknown or the file can't be read. */
export function resolveHeroImage(tourSlug?: string | null, itemName?: string | null): Buffer | null {
  const bySlugMatch = tourSlug ? bySlug[tourSlug] : undefined;
  if (bySlugMatch) {
    const buffer = loadImageBuffer(bySlugMatch);
    if (buffer) return buffer;
  }
  const haystack = `${tourSlug || ""} ${itemName || ""}`.toLowerCase();
  for (const [pattern, fileName] of keywordFallbacks) {
    if (pattern.test(haystack)) {
      const buffer = loadImageBuffer(fileName);
      if (buffer) return buffer;
    }
  }
  return loadImageBuffer(DEFAULT_IMAGE);
}
