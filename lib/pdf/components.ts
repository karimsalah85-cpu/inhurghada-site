import { pdfColors, pdfFonts, pdfPage, pdfRadius } from "@/lib/pdf/theme";
import { drawPdfLogo } from "@/lib/pdf/logo";
import { rtlLabelText, rtlWrappableText, wrapArabicParagraph } from "@/lib/pdf/rtl-text";
import { pickScriptFont } from "@/lib/pdf/script-font";
import { iconCalendar, iconClock, iconPeople, iconPin, iconWhatsapp, iconAlert, iconWave, iconShield, iconDiveMask } from "@/lib/pdf/icons";
import { resolveFooterImage } from "@/lib/pdf/hero-image";

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
// digit-reversal/nbsp handling and script-aware font selection only live here.
// ---------------------------------------------------------------------------

export function pdfWrite(
  doc: Doc,
  value: string,
  x: number,
  y: number,
  width: number,
  options: { size?: number; color?: string; align?: Align; rtl?: boolean; bold?: boolean; letterSpacing?: number; lineGap?: number; wrap?: boolean } = {},
) {
  const { size = 10, color = pdfColors.text, align, rtl = false, lineGap = 2, wrap = false, letterSpacing = 0 } = options;
  setScriptFont(doc, value);
  doc.fontSize(size).fillColor(color);
  // PDFKit's own line-wrapping for right-to-left text is unreliable — wrapped
  // Arabic lines can render at overlapping vertical positions. For any text
  // that might wrap, pre-compute explicit line breaks (see rtl-text.ts) and
  // let PDFKit lay out pre-broken lines instead of wrapping RTL runs itself.
  const text = wrap
    ? (rtl ? wrapArabicParagraph(doc, value, width, size, rtl) : rtlWrappableText(value, rtl))
    : rtlLabelText(value, rtl);
  doc.text(text, x, y, { width, align: align ?? (rtl ? "right" : "left"), lineGap, characterSpacing: letterSpacing });
}

/** Height a paragraph will take before drawing it — needed for manual pagination (pdfkit has no automatic reflow). */
export function pdfTextHeight(doc: Doc, value: string, width: number, size: number, rtl = false, lineGap = 2) {
  setScriptFont(doc, value);
  doc.fontSize(size);
  // Must match pdfWrite's wrap:true text transform exactly, or a measured
  // height can under/over-predict the actual rendered height (see pdfWrite).
  const text = rtl ? wrapArabicParagraph(doc, value, width, size, rtl) : rtlWrappableText(value, rtl);
  return doc.heightOfString(text, { width, lineGap });
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
  options: { rtl?: boolean; align?: Align; labelColor?: string; valueColor?: string } = {},
) {
  pdfWrite(doc, label, x, y, width, { size: 8, color: options.labelColor ?? pdfColors.muted, rtl: options.rtl, align: options.align, letterSpacing: 0.3 });
  pdfWrite(doc, value, x, y + 14, width, { size: 10.5, color: options.valueColor ?? pdfColors.text, rtl: options.rtl, align: options.align });
}

// ---------------------------------------------------------------------------
// Page chrome
// ---------------------------------------------------------------------------

/** Fills the full page with the sand/ivory background every PDF uses. */
export function pdfPageBackground(doc: Doc) {
  doc.rect(0, 0, pdfPage.width, pdfPage.height).fill(pdfColors.sand);
}

/**
 * PDFKit only reuses an embedded image when it is handed the same opened
 * image object; a raw Buffer is embedded again on every call. The footer
 * photo is drawn on every text page, so open each photo once per document
 * and a ten-page report carries one copy of it, not ten.
 */
const openedPhotos = new WeakMap<Doc, Map<Buffer, unknown>>();
function drawCoverPhoto(doc: Doc, photo: Buffer, x: number, y: number, width: number, height: number) {
  let perDoc = openedPhotos.get(doc);
  if (!perDoc) { perDoc = new Map(); openedPhotos.set(doc, perDoc); }
  let opened = perDoc.get(photo);
  if (!opened) { opened = (doc as unknown as { openImage(src: Buffer): unknown }).openImage(photo); perDoc.set(photo, opened); }
  doc.save();
  doc.rect(x, y, width, height).clip();
  doc.image(opened as Buffer, x, y, { cover: [width, height], align: "center", valign: "center" });
  doc.restore();
}

/**
 * The header of every text page (the ticket's policy page, the status
 * voucher's price breakdown, the admin report, the supplier statement): a
 * white band with the full-color wordmark, a thin aqua rule and the page
 * title, with an optional muted subtitle (period, reference, generated date).
 * Page 1 of a customer document uses the photographic drawPdfHero instead.
 * Returns the header's height.
 */
export function drawPdfHeader(doc: Doc, options: { title: string; subtitle?: string; rtl?: boolean }) {
  const { title, subtitle, rtl = false } = options;
  const width = pdfPage.width - pdfPage.margin * 2;
  const titleHeight = pdfTextHeight(doc, title, width, 18, rtl);
  const subtitleHeight = subtitle ? pdfTextHeight(doc, subtitle, width, 9, rtl) : 0;
  const height = Math.max(115, 76 + titleHeight + (subtitle ? subtitleHeight + 6 : 0) + 14);
  doc.rect(0, 0, pdfPage.width, height).fill(pdfColors.white);
  drawPdfLogo(doc, { x: rtl ? pdfPage.width - pdfPage.margin : pdfPage.margin, y: 24, width: 165, variant: "dark", align: rtl ? "right" : "left" });
  doc.moveTo(pdfPage.margin, 62).lineTo(pdfPage.width - pdfPage.margin, 62).strokeColor(pdfColors.aqua).lineWidth(0.8).stroke();
  pdfWrite(doc, title, pdfPage.margin, 76, width, { size: 18, color: pdfColors.navy, rtl, bold: true, wrap: true });
  if (subtitle) pdfWrite(doc, subtitle, pdfPage.margin, 76 + titleHeight + 4, width, { size: 9, color: pdfColors.muted, rtl, wrap: true });
  return height;
}

/** One consistent footer: brand, site, WhatsApp/support line, page number, optional document reference. */
export function drawPdfFooter(
  doc: Doc,
  options: { page?: number; totalPages?: number; reference?: string; y?: number; rtl?: boolean },
) {
  const { page, totalPages, reference, y = pdfPage.height - 30, rtl = false } = options;
  const parts = ["Daily Red Sea", "dailyredsea.com", "WhatsApp support"];
  if (reference) parts.push(reference);
  if (page) parts.push(totalPages ? `Page ${page} of ${totalPages}` : `Page ${page}`);
  pdfWrite(doc, parts.join("   ·   "), pdfPage.margin, y, pdfPage.width - pdfPage.margin * 2, { size: 7.5, color: pdfColors.muted, rtl, align: "left" });
}

/**
 * The photographic strip footer (a thin marine-image band with a dark
 * overlay) on every text page, echoing the page-1 hero so each page still
 * reads as the same travel brand. Falls back to a plain navy strip if the
 * photo can't be read.
 */
export function drawPdfImageFooter(doc: Doc, options: { reference?: string; page: number; totalPages: number; rtl?: boolean }) {
  const height = 54;
  const y = pdfPage.height - height;
  const photo = resolveFooterImage();
  doc.rect(0, y, pdfPage.width, height).fill(pdfColors.navy);
  if (photo) {
    try { drawCoverPhoto(doc, photo, 0, y, pdfPage.width, height); } catch { /* keep the navy strip */ }
  }
  doc.save();
  const overlay = doc.linearGradient(0, y, 0, y + height);
  overlay.stop(0, pdfColors.navyDark, 0.55).stop(1, pdfColors.navyDark, 0.82);
  doc.rect(0, y, pdfPage.width, height).fill(overlay);
  doc.restore();
  pdfWrite(doc, ["dailyredsea.com", options.reference, `Page ${options.page} of ${options.totalPages}`].filter(Boolean).join("   ·   "), pdfPage.margin, y + height / 2 - 5, pdfPage.width - pdfPage.margin * 2, { size: 8, color: pdfColors.white, rtl: options.rtl });
}

// ---------------------------------------------------------------------------
// Content components
// ---------------------------------------------------------------------------

/** A rounded white card — the base surface a handful of simple components still sit on. */
export function pdfCard(doc: Doc, x: number, y: number, width: number, height: number, fill = pdfColors.white) {
  doc.roundedRect(x, y, width, height, pdfRadius.card).fill(fill);
}

export function drawSectionTitle(doc: Doc, value: string, x: number, y: number, width: number, rtl = false) {
  pdfWrite(doc, value, x, y, width, { size: 10, color: pdfColors.navy, rtl, bold: true });
}

/** A single label/value pair — the smallest content unit. */
export function drawInfoRow(doc: Doc, label: string, value: string, x: number, y: number, width: number, rtl = false) {
  pdfLabelValue(doc, label, value, x, y, width, { rtl });
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
  let size = 9;
  while (size > 6 && pdfTextHeight(doc, label, width - 12, size, rtl, 1) > height - 6) size -= 0.25;
  const textHeight = pdfTextHeight(doc, label, width - 12, size, rtl, 1);
  pdfWrite(doc, label, x + 6, y + (height - textHeight) / 2, width - 12, { size, color: fg, align: "center", rtl, wrap: true, lineGap: 1 });
}

/** Height drawPriceBlock needs for its label and 22pt amount. */
export const pdfPriceBlockHeight = 76;

/** The navy total block: small label, large amount, optional note alongside. Draw it `pdfPriceBlockHeight` tall. */
export function drawPriceBlock(doc: Doc, label: string, amount: string, note: string | undefined, x: number, y: number, width: number, height: number, rtl = false) {
  doc.roundedRect(x, y, width, height, pdfRadius.card).fill(pdfColors.navy);
  const labelWidth = note ? width * 0.42 : width - 40;
  const labelX = rtl && note ? x + width - 20 - labelWidth : x + 20;
  pdfWrite(doc, label, labelX, y + 16, labelWidth, { size: 8, color: "#9FC3D6", rtl, letterSpacing: 0.3 });
  pdfWrite(doc, amount, labelX, y + 31, labelWidth, { size: 22, color: pdfColors.white, rtl, bold: true });
  if (note) pdfWrite(doc, note, rtl ? x + 20 : x + width * 0.5, y + 22, width * 0.5 - 20, { size: 8.5, color: "#cfe3ee", rtl, wrap: true, lineGap: 2 });
}

/**
 * A white card with the ticket's outline and the aqua edge of the guest
 * card, holding a two-column grid of label/value pairs — the summary block
 * at the top of the admin report and the supplier statement. Returns the
 * height consumed.
 */
export function drawPdfSummaryCard(doc: Doc, rows: [string, string][], x: number, y: number, width: number) {
  const pad = 20;
  const gap = 20;
  const colWidth = (width - pad * 2 - gap) / 2;
  const cellHeight = (index: number) => rows[index] ? 14 + pdfTextHeight(doc, rows[index][1], colWidth, 10.5) : 0;
  const rowHeights: number[] = [];
  for (let index = 0; index < rows.length; index += 2) rowHeights.push(Math.max(cellHeight(index), cellHeight(index + 1)) + 10);
  const height = rowHeights.reduce((sum, value) => sum + value, 0) + pad * 2 - 10;
  doc.roundedRect(x, y, width, height, pdfRadius.card).fill(pdfColors.white);
  doc.roundedRect(x, y, width, height, pdfRadius.card).lineWidth(1).strokeColor(pdfColors.border).stroke();
  doc.roundedRect(x, y + 12, 4, height - 24, 2).fill(pdfColors.aqua);
  let cursor = y + pad;
  rowHeights.forEach((rowHeight, row) => {
    for (const col of [0, 1]) {
      const entry = rows[row * 2 + col];
      if (!entry) continue;
      const cellX = x + pad + col * (colWidth + gap);
      pdfWrite(doc, entry[0], cellX, cursor, colWidth, { size: 8, color: pdfColors.muted, letterSpacing: 0.3 });
      pdfWrite(doc, entry[1], cellX, cursor + 14, colWidth, { size: 10.5, color: pdfColors.text, wrap: true });
    }
    cursor += rowHeight;
  });
  return height;
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
    pdfWrite(doc, value, cursor + 5, y + 8, column.width - 10, { size: sizes, color: header ? pdfColors.navy : pdfColors.text, align: column.align ?? (rtl ? "right" : index === 0 ? "left" : "right"), rtl });
    cursor += column.width;
  });
  return rowHeight;
}

// ---------------------------------------------------------------------------
// Page-1 hero + ticket system
// ---------------------------------------------------------------------------

/**
 * The large photographic header for page 1 of a customer-facing document: a
 * real destination/experience photo (see lib/pdf/hero-image.ts), a dark navy
 * gradient overlay for text legibility, the official logo top-left, and a
 * large "Booking Confirmed"-style title with a supporting line. Pass the
 * booking reference separately (not inside `subtitle`) so it stays readable
 * in right-to-left documents.
 */
export function drawPdfHero(doc: Doc, options: { image: Buffer | null; height: number; title: string; subtitle: string; reference?: string; rtl?: boolean }) {
  const { image, height, title, subtitle, reference, rtl = false } = options;
  doc.rect(0, 0, pdfPage.width, height).fill(pdfColors.navy);
  if (image) {
    try { drawCoverPhoto(doc, image, 0, 0, pdfPage.width, height); } catch { /* keep the navy band */ }
  }
  doc.save();
  const overlay = doc.linearGradient(0, 0, 0, height);
  overlay.stop(0, pdfColors.navyDark, 0.35).stop(0.55, pdfColors.navyDark, 0.55).stop(1, pdfColors.navyDark, 0.9);
  doc.rect(0, 0, pdfPage.width, height).fill(overlay);
  doc.restore();

  // The reversed/white wordmark used here previously could lose contrast against a bright
  // sky/sand hero photo (the overlay gradient is lightest at the very top, right where the
  // logo sits). A white backing plate lets the official full-color mark render instead, with
  // guaranteed contrast regardless of the underlying photo.
  const heroLogoWidth = 185;
  const heroLogoAspectRatio = 1566 / 254; // Matches the wordmark asset's own ratio (see lib/pdf/logo.ts).
  const heroLogoHeight = heroLogoWidth / heroLogoAspectRatio;
  const heroLogoPadX = 14;
  const heroLogoPadY = 10;
  const heroLogoY = 26;
  const heroLogoX = rtl ? pdfPage.width - pdfPage.margin - heroLogoWidth : pdfPage.margin;
  doc.roundedRect(heroLogoX - heroLogoPadX, heroLogoY - heroLogoPadY, heroLogoWidth + heroLogoPadX * 2, heroLogoHeight + heroLogoPadY * 2, 10).fill(pdfColors.white);
  drawPdfLogo(doc, { x: rtl ? pdfPage.width - pdfPage.margin : pdfPage.margin, y: heroLogoY, width: heroLogoWidth, variant: "dark", align: rtl ? "right" : "left" });
  pdfWrite(doc, title, pdfPage.margin, height - 92, pdfPage.width - pdfPage.margin * 2, { size: title.length > 40 ? 21 : 27, color: pdfColors.white, rtl, bold: true });
  const lineWidth = pdfPage.width - pdfPage.margin * 2;
  if (reference && rtl) {
    // A Latin booking reference inside an Arabic line is laid out right-to-left with it, so
    // "DRS-ABC123" printed as "321CBA-SRD". Draw it on its own at the opposite margin instead.
    pdfWrite(doc, subtitle, pdfPage.margin, height - 38, lineWidth, { size: 11, color: "#dceaf1", rtl });
    pdfWrite(doc, reference, pdfPage.margin, height - 38, lineWidth, { size: 11, color: "#dceaf1", align: "left" });
  } else {
    pdfWrite(doc, reference ? `${subtitle}  ·  ${reference}` : subtitle, pdfPage.margin, height - 38, lineWidth, { size: 11, color: "#dceaf1", rtl });
  }
  return height;
}

export type TicketZones = { leftX: number; leftWidth: number; stubX: number; stubWidth: number; top: number; height: number };

/**
 * The dominant boarding-pass component: one rounded card split into a wide
 * information side (~70%) and a navy stub (~30%), joined by a dashed
 * perforation with circular cut-outs — TicketStub is drawn as part of this
 * same call since the stub's navy fill must sit visually "inside" the same
 * physical ticket, not as an independent floating card.
 */
export function drawExperienceTicket(doc: Doc, options: { x: number; y: number; width: number; height: number; rtl?: boolean }): TicketZones {
  const { x, y, width, height, rtl = false } = options;
  const stubWidth = Math.round(width * 0.3);
  const leftWidth = width - stubWidth;
  const stubX = rtl ? x : x + leftWidth;
  const leftX = rtl ? x + stubWidth : x;

  doc.roundedRect(x, y, width, height, pdfRadius.ticket).fill(pdfColors.white);
  doc.roundedRect(stubX, y, stubWidth, height, pdfRadius.ticket).fill(pdfColors.navy);
  // The card previously had no outline, so its silhouette only read where it happened to sit
  // over a darker part of the sand page background. Stroke it after both fills so the outline
  // is visible on top of the navy stub too.
  doc.roundedRect(x, y, width, height, pdfRadius.ticket).lineWidth(1).strokeColor(pdfColors.border).stroke();

  const seamX = rtl ? x + stubWidth : stubX;
  doc.save();
  // Punch-hole notches: filled with the page's own sand color to read as a cutout, plus a
  // thin stroke so the edge stays visible even where the fill alone would blend into the
  // navy stub (an unstroked fill made these nearly invisible on that side before).
  for (const notchY of [y, y + height]) {
    doc.circle(seamX, notchY, 10).fill(pdfColors.sand);

  }
  for (const edgeX of [x, x + width]) {
    for (let notchY = y + 48; notchY < y + height - 24; notchY += 34) {
      doc.circle(edgeX, notchY, 6).fill(pdfColors.sand);
    }
  }
  // A heavier, tighter dash than the previous 1px hairline so the perforation reads clearly
  // in print against both the white and navy sides of the seam.
  doc.dash(4, { space: 3 }).moveTo(seamX, y + 16).lineTo(seamX, y + height - 16).strokeColor(pdfColors.border).lineWidth(1.5).stroke();
  doc.undash();
  doc.restore();

  return { leftX, leftWidth, stubX, stubWidth, top: y, height };
}

/** One column of the ticket's 4-column metadata row: small icon, uppercase label, value. */
export function drawPdfInfoItem(doc: Doc, options: { icon: "calendar" | "clock" | "people" | "pin" | "shield"; label: string; value: string; x: number; y: number; width: number; rtl?: boolean }) {
  const { icon, label, value, x, y, width, rtl = false } = options;
  const iconSize = 15;
  const iconFn = { calendar: iconCalendar, clock: iconClock, people: iconPeople, pin: iconPin, shield: iconShield }[icon];
  iconFn(doc, rtl ? x + width - iconSize : x, y, iconSize, pdfColors.aqua);
  const labelY = y + iconSize + 8;
  // The label can wrap in a narrow column (e.g. "Pickup / meeting point"), so the
  // value's position is derived from the label's measured height, not a fixed offset.
  const labelHeight = pdfTextHeight(doc, label, width, 7, rtl, 1);
  pdfWrite(doc, label, x, labelY, width, { size: 7, color: pdfColors.muted, rtl, letterSpacing: 0.4, lineGap: 1 });
  pdfWrite(doc, value, x, labelY + labelHeight + 3, width, { size: 9.5, color: pdfColors.text, rtl, wrap: true });
}

/** Compact guest-details card: name, WhatsApp, email — the only "guest" block under the ticket. */
export function drawPdfGuestDetails(doc: Doc, options: { title: string; name: string; whatsapp: string; email: string; x: number; y: number; width: number; height: number; rtl?: boolean }) {
  const { title, name, whatsapp, email, x, y, width, height, rtl = false } = options;
  doc.roundedRect(x, y, width, height, pdfRadius.card).fill(pdfColors.white);
  doc.roundedRect(x, y, 4, height, 2).fill(pdfColors.aqua);
  pdfWrite(doc, title, x + 22, y + 16, width - 40, { size: 9.5, color: pdfColors.navy, rtl, bold: true, letterSpacing: 0.3 });
  if (width < 300) {
    for (const [index, value] of [name, whatsapp, email].entries()) {
      pdfWrite(doc, value, x + 18, y + 51 + index * 37, width - 36, {size: 9, rtl: index === 0 ? rtl : false, wrap: true});
    }
    return;
  }
  const colWidth = (width - 64) / 3;
  drawInfoRow(doc, "Guest name", name, x + 22, y + 40, colWidth, rtl);
  drawInfoRow(doc, "WhatsApp", whatsapp, x + 22 + colWidth + 10, y + 40, colWidth, rtl);
  drawInfoRow(doc, "Email", email, x + 22 + (colWidth + 10) * 2, y + 40, colWidth, rtl);
}

/**
 * Aqua-tinted "what happens next" panel with a WhatsApp glyph — the one strong support
 * call-to-action under the ticket. The caller draws its own full-card `doc.link` over this,
 * so the CTA pill drawn here is a visual affordance, not the click target itself.
 *
 * `cta` is optional and, when supplied, must already be localized by the caller (matching
 * every other string this component receives) — this function never invents new copy.
 * Without it, the pill still renders with just the WhatsApp glyph and no text, which needs
 * no translation and keeps the affordance visible for existing callers unchanged.
 */
export function drawPdfWhatsAppPanel(doc: Doc, options: { title: string; body: string; x: number; y: number; width: number; height: number; rtl?: boolean; cta?: string }) {
  const { title, body, x, y, width, height, rtl = false, cta } = options;
  doc.roundedRect(x, y, width, height, pdfRadius.card).fill("#EAF6F8");
  const pad = 22;
  const iconSize = 22;
  // Top-align the icon with the title instead of centering it on the full card height: at the
  // ~288pt-wide narrow column this panel is actually laid out in (the booking confirmation's
  // two-column support row), the card is much taller than its text, and a vertically-centered
  // icon used to float away from the title/body block it belongs to.
  const iconX = rtl ? x + width - pad - iconSize : x + pad;
  iconWhatsapp(doc, iconX, y + 16, iconSize, pdfColors.aqua);
  const textX = rtl ? x + pad : x + pad + iconSize + 14;
  const textWidth = Math.max(0, width - pad * 2 - iconSize - 14);
  pdfWrite(doc, title, textX, y + 16, textWidth, { size: 10, color: pdfColors.navy, rtl, bold: true, wrap: true, lineGap: 1 });
  // The title previously assumed a single line. At narrow widths a longer localized title can
  // wrap, and the body used to be drawn at a fixed offset regardless — colliding with a
  // wrapped title. Measure the title's actual height instead.
  const titleHeight = pdfTextHeight(doc, title, textWidth, 10, rtl, 1);
  const bodyY = y + 16 + Math.max(titleHeight, iconSize) + 10;
  const bodyX = x + pad;
  const bodyWidth = width - pad * 2;
  pdfWrite(doc, body, bodyX, bodyY, bodyWidth, { size: 8.5, color: pdfColors.text, rtl, wrap: true, lineGap: 2 });

  // A visible WhatsApp CTA pill anchored to the card's bottom edge, instead of leaving the
  // rest of a tall narrow card blank below the paragraph — previously nothing in this panel
  // signaled that the whole card is a tap target.
  const ctaHeight = 26;
  const ctaY = y + height - pad - ctaHeight;
  const bodyHeight = pdfTextHeight(doc, body, bodyWidth, 8.5, rtl, 2);
  if (ctaY > bodyY + bodyHeight + 10) {
    const ctaX = x + pad;
    const ctaWidth = width - pad * 2;
    doc.roundedRect(ctaX, ctaY, ctaWidth, ctaHeight, pdfRadius.chip).fill(pdfColors.aqua);
    const ctaIconSize = 15;
    const ctaIconX = rtl ? ctaX + ctaWidth - 14 - ctaIconSize : ctaX + 14;
    iconWhatsapp(doc, ctaIconX, ctaY + ctaHeight / 2 - ctaIconSize / 2, ctaIconSize, pdfColors.white);
    if (cta) {
      const ctaTextX = rtl ? ctaX + 14 : ctaIconX + ctaIconSize + 8;
      const ctaTextWidth = Math.max(0, ctaWidth - 28 - ctaIconSize - 8);
      pdfWrite(doc, cta, ctaTextX, ctaY + ctaHeight / 2 - 5, ctaTextWidth, { size: 8.5, color: pdfColors.white, rtl, bold: true, align: rtl ? "right" : "left" });
    }
  }
}

const policyIconIndex = ["calendar", "alert", "wave", "shield", "dive"] as const;

/** One horizontal policy row: icon, bold heading, body text, subtle separator — used for all 5 cancellation-policy topics on page 2. Returns the height consumed. */
export function drawPdfPolicyRow(doc: Doc, options: { icon: number; heading: string; body: string; x: number; y: number; width: number; rtl?: boolean }) {
  const { heading, body, x, y, width, rtl = false } = options;
  const iconSize = 22;
  const iconGap = 14;
  const headingWidth = 150;
  const headingGap = 20;
  const bodyWidth = width - iconSize - iconGap - headingWidth - headingGap;
  // Reading order mirrors for RTL: icon / heading / body all flow from the
  // trailing edge, so their boxes never share the same x range as they did
  // in an earlier version of this function (a real overlap bug for Arabic).
  const iconX = rtl ? x + width - iconSize : x;
  const headingX = rtl ? iconX - iconGap - headingWidth : iconX + iconSize + iconGap;
  const bodyX = rtl ? headingX - headingGap - bodyWidth : headingX + headingWidth + headingGap;

  const bodyHeight = pdfTextHeight(doc, body, bodyWidth, 9.5, rtl, 3.5);
  const rowHeight = Math.max(bodyHeight, iconSize + 30, 40);

  drawPolicyIcon(doc, options.icon, iconX, y, iconSize);
  pdfWrite(doc, heading, headingX, y, headingWidth, { size: 10.5, color: pdfColors.navy, rtl, bold: true });
  pdfWrite(doc, body, bodyX, y, bodyWidth, { size: 9.5, color: pdfColors.text, rtl, wrap: true, lineGap: 3.5 });
  doc.moveTo(x, y + rowHeight + 14).lineTo(x + width, y + rowHeight + 14).strokeColor(pdfColors.border).lineWidth(0.75).stroke();
  return rowHeight + 30;
}

function drawPolicyIcon(doc: Doc, index: number, x: number, y: number, size: number) {
  const topic = policyIconIndex[index] ?? "calendar";
  switch (topic) {
    case "calendar": return iconCalendar(doc, x, y, size, pdfColors.aqua);
    case "alert": return iconCalendarAlert(doc, x, y, size);
    case "wave": return iconWaveWrapped(doc, x, y, size);
    case "shield": return iconShieldWrapped(doc, x, y, size);
    case "dive": return iconDiveWrapped(doc, x, y, size);
  }
}

// Thin wrappers keep the public drawPdfPolicyRow signature stable (an integer topic
// index) while reusing the actual icon primitives from lib/pdf/icons.ts.
function iconCalendarAlert(doc: Doc, x: number, y: number, size: number) { iconAlert(doc, x, y, size, pdfColors.coral); }
function iconWaveWrapped(doc: Doc, x: number, y: number, size: number) { iconWave(doc, x, y, size, pdfColors.aqua); }
function iconShieldWrapped(doc: Doc, x: number, y: number, size: number) { iconShield(doc, x, y, size, pdfColors.aqua); }
function iconDiveWrapped(doc: Doc, x: number, y: number, size: number) { iconDiveMask(doc, x, y, size, pdfColors.aqua); }

/** Embeds a pre-rendered QR PNG (see lib/pdf/qrcode.ts) with an optional caption underneath. */
export function drawQrCodeBlock(doc: Doc, png: Buffer, x: number, y: number, size: number, caption?: string) {
  doc.image(png, x, y, { width: size, height: size });
  if (caption) pdfWrite(doc, caption, x, y + size + 6, size, { size: 7, color: pdfColors.muted, align: "center" });
}
