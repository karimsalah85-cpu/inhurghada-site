import fs from "node:fs";
import path from "node:path";

/**
 * The official Daily Red Sea wordmark, in both the reversed/white variant
 * (for the photographic hero and other dark backgrounds) and the full-color
 * variant (for light backgrounds, e.g. the page-2 compact header). Both ship
 * as rasterized PNGs — PDFKit cannot embed SVG directly — matching the
 * source wordmark SVG's `viewBox="0 0 633 98"` aspect ratio so scaled draws
 * are never distorted. Never recreate the wordmark as text except as the
 * last-resort fallback if an asset can't be read, so PDF generation never
 * hard-fails because of the brand mark.
 */
const LOGO_PATHS = {
  light: path.join(process.cwd(), "public/brand/dailyredsea-wordmark-white.png"),
  dark: path.join(process.cwd(), "public/brand/dailyredsea-wordmark.png"),
} as const;

const LOGO_ASPECT_RATIO = 633 / 98;

const cachedLogos = new Map<keyof typeof LOGO_PATHS, Buffer | null>();

function loadLogoBuffer(variant: keyof typeof LOGO_PATHS): Buffer | null {
  if (!cachedLogos.has(variant)) {
    try {
      cachedLogos.set(variant, fs.readFileSync(LOGO_PATHS[variant]));
    } catch {
      cachedLogos.set(variant, null);
    }
  }
  return cachedLogos.get(variant) ?? null;
}

/**
 * PDFKit only dedupes repeated `doc.image()` calls when passed a string path;
 * a raw Buffer re-embeds a brand-new (and asynchronously decoded) XObject on
 * every call. A multi-page document draws the brand mark once per page, so
 * without this cache each page would race its own PNG decode, making the
 * embedded object order (and so the rendered bytes) nondeterministic.
 */
const logoImageByDocument = new WeakMap<PDFKit.PDFDocument, Map<string, unknown>>();
function openLogoImage(doc: PDFKit.PDFDocument, variant: string, buffer: Buffer): unknown {
  if (!logoImageByDocument.has(doc)) logoImageByDocument.set(doc, new Map());
  const perDoc = logoImageByDocument.get(doc)!;
  if (!perDoc.has(variant)) {
    perDoc.set(variant, (doc as unknown as { openImage(src: Buffer): unknown }).openImage(buffer));
  }
  return perDoc.get(variant);
}

/**
 * Draws the official Daily Red Sea wordmark, preserving its aspect ratio and
 * clear space. Use `variant: "light"` (the reversed/white mark) over
 * photographic or navy backgrounds, and `variant: "dark"` (the full-color
 * mark) over light/sand backgrounds — never the same variant on both, and
 * never recreated as text except as the fallback below.
 */
export function drawPdfLogo(
  doc: PDFKit.PDFDocument,
  options: { x: number; y: number; width: number; variant: "light" | "dark"; align?: "left" | "right" },
) {
  const { x, y, width, variant, align = "left" } = options;
  const height = width / LOGO_ASPECT_RATIO;
  const drawX = align === "right" ? x - width : x;
  const logo = loadLogoBuffer(variant);
  if (logo) {
    try {
      doc.image(openLogoImage(doc, variant, logo) as Buffer, drawX, y, { width, height });
      return height;
    } catch {
      cachedLogos.set(variant, null);
    }
  }
  const textColor = variant === "light" ? "#ffffff" : "#073B5C";
  doc.font("Noto").fontSize(Math.round(width / 8)).fillColor(textColor).text("DAILY RED SEA", drawX, y + height / 2 - width / 16, { width, align });
  return height;
}
