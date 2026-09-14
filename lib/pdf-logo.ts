import fs from "node:fs";
import path from "node:path";

/**
 * The reversed (white) wordmark, sized for the navy header used by every
 * generated booking PDF. It ships as a rasterized PNG (rather than the source
 * SVG) because PDFKit cannot embed SVG images directly.
 */
const LOGO_PATH = path.join(process.cwd(), "public/brand/dailyredsea-wordmark-white.png");

/** Matches the source wordmark SVG's `viewBox="0 0 633 98"`, so scaled draws stay undistorted. */
const LOGO_ASPECT_RATIO = 633 / 98;

let cachedLogo: Buffer | null | undefined;

function loadLogoBuffer(): Buffer | null {
  if (cachedLogo === undefined) {
    try {
      cachedLogo = fs.readFileSync(LOGO_PATH);
    } catch {
      cachedLogo = null;
    }
  }
  return cachedLogo;
}

/**
 * PDFKit only dedupes repeated `doc.image()` calls when passed a string path;
 * a raw Buffer re-embeds a brand-new (and asynchronously decoded) XObject on
 * every call. A multi-page status PDF draws the brand mark once per page, so
 * without this cache each page would race its own PNG decode, making the
 * embedded object order (and so the rendered bytes) nondeterministic.
 */
const logoImageByDocument = new WeakMap<PDFKit.PDFDocument, unknown>();
function openLogoImage(doc: PDFKit.PDFDocument, buffer: Buffer): unknown {
  if (!logoImageByDocument.has(doc)) {
    logoImageByDocument.set(doc, (doc as unknown as { openImage(src: Buffer): unknown }).openImage(buffer));
  }
  return logoImageByDocument.get(doc);
}

/**
 * Draws the Daily Red Sea wordmark into a PDFKit document header, right-aligned
 * for RTL locales and left-aligned otherwise. If the logo asset cannot be read
 * or fails to render, this falls back to the plain text brand name on the same
 * font already registered as "Noto" for the document, so PDF generation never
 * fails because of the brand mark.
 */
export function drawPdfBrandMark(
  doc: PDFKit.PDFDocument,
  options: { pageWidth: number; margin: number; y: number; width: number; rtl: boolean },
) {
  const { pageWidth, margin, y, width, rtl } = options;
  const height = width / LOGO_ASPECT_RATIO;
  const x = rtl ? pageWidth - margin - width : margin;
  const logo = loadLogoBuffer();
  if (logo) {
    try {
      doc.image(openLogoImage(doc, logo) as Buffer, x, y, { width, height });
      return;
    } catch {
      // Corrupt or unreadable image data: fall through to the text fallback below.
      logoImageByDocument.delete(doc);
    }
  }
  doc.font("Noto").fontSize(20).fillColor("#ffffff").text("DAILY RED SEA", x, y + height / 2 - 11, { width, align: rtl ? "right" : "left" });
}
