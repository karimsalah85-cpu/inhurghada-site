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
      doc.image(logo, x, y, { width, height });
      return;
    } catch {
      // Corrupt or unreadable image data: fall through to the text fallback below.
    }
  }
  doc.font("Noto").fontSize(20).fillColor("#ffffff").text("DAILY RED SEA", x, y + height / 2 - 11, { width, align: rtl ? "right" : "left" });
}
