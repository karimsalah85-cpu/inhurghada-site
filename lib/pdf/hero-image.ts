import fs from "node:fs";
import path from "node:path";

/**
 * Resolves the PDF hero photo for a booking. Per-tour where a real photo
 * exists, otherwise a keyword-based category fallback, so only owned
 * photography is embedded. Unknown tours use a neutral coast photo, without
 * suggesting it depicts their exact destination.
 *
 * The files are print-sized copies in assets/pdf-images (built from
 * public/images/owned by scripts/build-pdf-images.mjs), not the website
 * originals: those are up to 7 MB each and went straight into the emailed
 * PDF. Add a photo here, then re-run that script.
 */
const bySlug: Record<string, string> = {
  "jeddah-yacht-sunset-cruise": "jeddah-yacht-sunset-cruise.jpg",
  "basic-diver-jeddah": "basic-diver-jeddah.jpg",
  "certified-diver-boat-trip-jeddah": "certified-diver-boat-trip-jeddah.jpg",
  "mahmya-island": "mahmya-island-boats-owner.jpg",
  "senzo-transfer": "senzo-mall.jpg",
};
const keywordFallbacks: [RegExp, string][] = [
  [/dive|diving|scuba/, "red-sea-diver-reef.jpg"],
  [/dolphin/, "dolphin-house-pod.jpg"],
  [/snorkel/, "red-sea-reef-panorama.jpg"],
  [/speedboat|boat|yacht|cruise/, "speedboat-action-wide.jpg"],
  [/quad|safari|desert/, "quad-safari-morning.jpg"],
  [/luxor|karnak/, "luxor-temple-columns.jpg"],
  [/cairo/, "cairo-giza-day.jpg"],
  [/transfer/, "hurghada-transfer-road-sunset.jpg"],
];
const DEFAULT_IMAGE = "red-sea-coast.jpg";
const FOOTER_IMAGE = "footer-strip.jpg";
export const pdfHeroAssetPaths = [...new Set([...Object.values(bySlug), ...keywordFallbacks.map(([, file]) => file), DEFAULT_IMAGE, FOOTER_IMAGE])].map(file => `./assets/pdf-images/${file}`);
const imagesDir = path.join(process.cwd(), "assets/pdf-images");

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

/** The thin marine photo band drawn at the foot of every text page (see drawPdfImageFooter). */
export function resolveFooterImage(): Buffer | null {
  return loadImageBuffer(FOOTER_IMAGE);
}
