import { pdfColors, pdfFonts, pdfPage, pdfRadius } from "@/lib/pdf/theme";
import { drawPdfBrandMark } from "@/lib/pdf/logo";
import { rtlLabelText, rtlWrappableText, wrapArabicParagraph } from "@/lib/pdf/rtl-text";
import { pickScriptFont } from "@/lib/pdf/script-font";

type Doc = PDFKit.PDFDocument;
type Align = "left" | "right" | "center";

/**
 * Every drawing component in this file takes the PDFKit document plus a
 * small `rtl` flag; there is no other framework layer. PDFKit has no CSS box
 * model, so "components" here are functions that draw at an explicit x/y and
 * (where relevant) return the vertical space they consumed, rather than
 * React-style elements — that's the correct idiom for the engine this project
 * actually uses (see the PDF inventory: raw pdfkit, not HTML/React-to-PDF).
 */

// ---------------------------------------------------------------------------
// Text primitive — every other component writes text through this, so RTL
// digit-reversal/nbsp handling only lives in one place (lib/pdf/rtl-text.ts).
// ---------------------------------------------------------------------------

export function pdfWrite(
  doc: Doc,
  value: string,
  x: number,
  y: number,
  width: number,
  options: { size?: number; color?: string; align?: Align; rtl?: boolean; bold?: boolean; lineGap?: number; wrap?: boolean } = {},
) {
  const { size = 10, color = pdfColors.ink, align, rtl = false, lineGap = 2, wrap = false } = options;
  setScriptFont(doc, value);
  doc.fontSize(size).fillColor(color);
  const text = wrap ? rtlWrappableText(value, rtl) : rtlLabelText(value, rtl);
  doc.text(text, x, y, { width, align: align ?? (rtl ? "right" : "left"), lineGap });
}

/** Height a paragraph will take before drawing it — needed for manual pagination (pdfkit has no automatic reflow). */
export function pdfTextHeight(doc: Doc, value: string, width: number, size: number, rtl = false, lineGap = 2) {
  setScriptFont(doc, value);
  doc.fontSize(size);
  return doc.heightOfString(rtlWrappableText(value, rtl), { width, lineGap });
}

/** Word-wraps Arabic text explicitly (see lib/pdf/rtl-text.ts) — use for longer status/report paragraphs. */
export function pdfWrapArabic(doc: Doc, value: string, width: number, size: number, rtl: boolean) {
  setScriptFont(doc, value);
  doc.fontSize(size);
  return wrapArabicParagraph(doc, value, width, size, rtl);
}

/**
 * Selects the embedded face matching `value`'s script (Arabic/CJK/Latin),
 * falling back to the document's default "Noto" face if that script's font
 * isn't registered — true for the single-locale documents (confirmation,
 * status voucher), which only ever register one face. Only documents that
 * mix scripts in one render (the admin report) need to call
 * registerAllScriptFonts() up front to get real per-cell script coverage.
 */
function setScriptFont(doc: Doc, value: string) {
  const preferred = pickScriptFont(value);
  try {
    doc.font(preferred);
  } catch {
    doc.font(pdfFonts.name);
  }
}

export function pdfLabelValue(
  doc: Doc,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
  options: { rtl?: boolean; align?: Align } = {},
) {
  pdfWrite(doc, label, x, y, width, { size: 8, color: pdfColors.muted, rtl: options.rtl, align: options.align });
  pdfWrite(doc, value, x, y + 15, width, { size: 10, color: pdfColors.navy, rtl: options.rtl, align: options.align });
}

// ---------------------------------------------------------------------------
// Page chrome
// ---------------------------------------------------------------------------

/** Fills the full page with the sand/ivory background every PDF uses. */
export function pdfPageBackground(doc: Doc) {
  doc.rect(0, 0, pdfPage.width, pdfPage.height).fill(pdfColors.sand);
}

export type PdfHeaderVariant = "hero" | "compact";

/**
 * Hero header: full-bleed navy band with the logo and a large title — use for
 * customer-facing experience documents (booking confirmations, vouchers,
 * transfer/excursion/dive passes). Compact header: a thin branded band —
 * use for invoices, policies, receipts and other text-heavy documents.
 */
export function drawPdfHeader(
  doc: Doc,
  options: { variant: PdfHeaderVariant; title: string; subtitle?: string; rtl?: boolean; logoWidth?: number },
) {
  const { variant, title, subtitle, rtl = false, logoWidth = 170 } = options;
  const height = variant === "hero" ? 158 : 92;
  doc.rect(0, 0, pdfPage.width, height).fill(pdfColors.navy);
  doc.rect(0, height, pdfPage.width, variant === "hero" ? 5 : 3).fill(pdfColors.coral);
  drawPdfBrandMark(doc, { pageWidth: pdfPage.width, margin: pdfPage.margin, y: variant === "hero" ? 32 : 22, width: variant === "hero" ? logoWidth : 140, rtl });
  if (variant === "hero") {
    pdfWrite(doc, title, pdfPage.margin, 76, 320, { size: 18, color: pdfColors.white, rtl });
    if (subtitle) pdfWrite(doc, subtitle, pdfPage.margin, 104, 320, { size: 9, color: "#dbeafe", rtl });
  } else {
    pdfWrite(doc, title, pdfPage.margin, 60, pdfPage.width - pdfPage.margin * 2 - 140, { size: 14, color: pdfColors.white, rtl });
    if (subtitle) pdfWrite(doc, subtitle, pdfPage.margin, 78, pdfPage.width - pdfPage.margin * 2 - 140, { size: 8.5, color: "#dbeafe", rtl });
  }
  return height + (variant === "hero" ? 5 : 3);
}

/** One consistent footer: brand, site, WhatsApp/support line, page number, optional document reference. */
export function drawPdfFooter(
  doc: Doc,
  options: { page?: number; totalPages?: number; reference?: string; y?: number; rtl?: boolean },
) {
  const { page, totalPages, reference, y = pdfPage.height - 32, rtl = false } = options;
  const parts = ["Daily Red Sea", "dailyredsea.com", "WhatsApp support"];
  if (reference) parts.push(reference);
  if (page) parts.push(totalPages ? `Page ${page} of ${totalPages}` : `Page ${page}`);
  pdfWrite(doc, parts.join(" | "), pdfPage.margin, y, pdfPage.width - pdfPage.margin * 2, { size: 8, color: pdfColors.muted, rtl, align: "left" });
}

// ---------------------------------------------------------------------------
// Content components
// ---------------------------------------------------------------------------

/** A rounded white card — the base surface every other component sits on. */
export function pdfCard(doc: Doc, x: number, y: number, width: number, height: number, fill = pdfColors.white) {
  doc.roundedRect(x, y, width, height, pdfRadius.card).fill(fill);
}

export function drawSectionTitle(doc: Doc, value: string, x: number, y: number, width: number, rtl = false) {
  pdfWrite(doc, value, x, y, width, { size: 10, color: pdfColors.navy, rtl, bold: true });
}

/** A single label/value pair — the smallest content unit (see InfoGrid for a row of these). */
export function drawInfoRow(doc: Doc, label: string, value: string, x: number, y: number, width: number, rtl = false) {
  pdfLabelValue(doc, label, value, x, y, width, { rtl });
}

/** A 2-column grid of InfoRows, auto-laid-out across `width`. Returns the height consumed. */
export function drawInfoGrid(doc: Doc, rows: [string, string][], x: number, y: number, width: number, rtl = false, rowHeight = 38) {
  const colWidth = width / 2 - 10;
  rows.forEach(([label, value], index) => {
    const row = Math.floor(index / 2);
    const col = index % 2;
    const colX = x + col * (colWidth + 20);
    drawInfoRow(doc, label, value, colX, y + row * rowHeight, colWidth, rtl);
  });
  return Math.ceil(rows.length / 2) * rowHeight;
}

export type StatusTone = "positive" | "negative" | "warning" | "neutral";

export function statusToneFor(value: string): StatusTone {
  if (["confirmed", "completed", "paid", "qualified", "approved", "active"].includes(value)) return "positive";
  if (["cancelled", "rejected", "fraud"].includes(value)) return "negative";
  if (["unpaid", "pending", "pending_review"].includes(value)) return "warning";
  return "neutral";
}

/** A pill-shaped status chip, e.g. "Confirmed" / "Paid" / "Cancelled". */
export function drawStatusBadge(doc: Doc, label: string, x: number, y: number, width: number, height: number, tone: StatusTone, rtl = false) {
  const { bg, fg } = pdfColors.status[tone];
  doc.roundedRect(x, y, width, height, pdfRadius.chip).fill(bg);
  pdfWrite(doc, label, x, y + height / 2 - 6, width, { size: 9, color: fg, align: "center", rtl });
}

/** The coral "total due" block — the one place coral is used as a large fill, per the brand rule of one CTA accent. */
export function drawPriceBlock(doc: Doc, label: string, amount: string, note: string | undefined, x: number, y: number, width: number, height: number, rtl = false) {
  doc.roundedRect(x, y, width, height, pdfRadius.card).fill(pdfColors.coral);
  const labelWidth = note ? width * 0.42 : width - 32;
  pdfWrite(doc, label, x + 16, y + 17, labelWidth, { size: 9, color: "#ffe9e5", rtl });
  pdfWrite(doc, amount, x + 16, y + 36, labelWidth, { size: 22, color: pdfColors.white, rtl });
  if (note) pdfWrite(doc, note, x + width * 0.44, y + 25, width * 0.44, { size: 9, color: pdfColors.white, rtl, wrap: true });
}

/**
 * The ticket/boarding-pass motif — use once per document, for the most
 * important reference/transaction area only (booking reference + a compact
 * QR), never for every section. Draws a rounded stub card with a dashed
 * perforation and punched notches between the "info" side and the "stub".
 */
export function drawTicketCard(
  doc: Doc,
  options: { x: number; y: number; width: number; height: number; stubWidth: number; rtl?: boolean },
) {
  const { x, y, width, height, stubWidth, rtl = false } = options;
  const stubX = rtl ? x : x + width - stubWidth;
  const infoWidth = width - stubWidth;
  doc.save();
  pdfCard(doc, x, y, width, height);
  // Punch a circular notch out of the top/bottom edge at the perforation line, boarding-pass style.
  const perforationX = rtl ? x + stubWidth : stubX;
  doc.circle(perforationX, y, 9).fill(pdfColors.sand);
  doc.circle(perforationX, y + height, 9).fill(pdfColors.sand);
  doc.dash(4, { space: 4 }).moveTo(perforationX, y + 14).lineTo(perforationX, y + height - 14).strokeColor(pdfColors.border).lineWidth(1).stroke();
  doc.undash();
  doc.restore();
  return { infoX: rtl ? stubX + stubWidth : x, infoWidth, stubX, stubWidth };
}

/** A soft-tinted callout, e.g. "What happens next" or a policy highlight. */
export function drawCalloutCard(doc: Doc, title: string, body: string, x: number, y: number, width: number, height: number, rtl = false, tint = "#eff6ff") {
  doc.roundedRect(x, y, width, height, pdfRadius.card).fill(tint);
  pdfWrite(doc, title, x + 16, y + 15, width - 32, { size: 9, color: pdfColors.navy, rtl });
  pdfWrite(doc, body, x + 16, y + 34, width - 32, { size: 8.5, color: pdfColors.muted, rtl, wrap: true });
}

/** A titled block of policy paragraphs with manual pagination (pdfkit has no CSS `break-inside: avoid`,
 * so callers must check remaining space themselves — see PdfDocumentFlow.ensureSpace). */
export function drawPolicySection(doc: Doc, title: string, x: number, y: number, width: number, rtl = false) {
  pdfWrite(doc, title, x, y, width, { size: 14, color: pdfColors.navy, rtl });
  return y + 39;
}

export type TableColumn = { label: string; width: number; align?: Align };

/** Draws one table row (header or data). Returns the height consumed, for manual pagination by the caller. */
export function drawTableRow(doc: Doc, values: string[], columns: TableColumn[], x: number, y: number, options: { header?: boolean; zebra?: boolean; rtl?: boolean } = {}) {
  const { header = false, zebra = false, rtl = false } = options;
  const sizes = 9;
  const heights = values.map((value, index) => pdfTextHeight(doc, value, columns[index].width - 10, sizes, rtl));
  const rowHeight = Math.max(...heights) + 16;
  if (header) doc.rect(x, y, columns.reduce((sum, column) => sum + column.width, 0), rowHeight).fill(pdfColors.status.neutral.bg);
  else if (zebra) doc.rect(x, y, columns.reduce((sum, column) => sum + column.width, 0), rowHeight).fill(pdfColors.white);
  let cursor = x;
  values.forEach((value, index) => {
    const column = columns[index];
    pdfWrite(doc, value, cursor + 5, y + 8, column.width - 10, { size: sizes, color: header ? pdfColors.navy : pdfColors.ink, align: column.align ?? (rtl ? "right" : index === 0 ? "left" : "right"), rtl });
    cursor += column.width;
  });
  return rowHeight;
}

/** A dedicated area for a manual signature/date line — for waivers and policy documents. */
export function drawSignatureArea(doc: Doc, label: string, x: number, y: number, width: number, rtl = false) {
  doc.moveTo(x, y + 32).lineTo(x + width, y + 32).strokeColor(pdfColors.border).lineWidth(1).stroke();
  pdfWrite(doc, label, x, y + 38, width, { size: 8, color: pdfColors.muted, rtl });
  return 60;
}

/** Embeds a pre-rendered QR PNG (see lib/pdf/qrcode.ts) with an optional caption underneath. */
export function drawQrCodeBlock(doc: Doc, png: Buffer, x: number, y: number, size: number, caption?: string) {
  doc.image(png, x, y, { width: size, height: size });
  if (caption) pdfWrite(doc, caption, x, y + size + 6, size, { size: 7, color: pdfColors.muted, align: "center" });
}
