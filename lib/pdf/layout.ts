import { pdfPage } from "@/lib/pdf/theme";
import { pdfPageBackground, drawPdfHeader, drawPdfFooter, type PdfHeaderVariant } from "@/lib/pdf/components";

type Doc = PDFKit.PDFDocument;

/**
 * Manual pagination helper for flowing (non-fixed-layout) documents — the
 * status voucher, policy pages and admin report all stack an unknown number
 * of rows/paragraphs. PDFKit has no CSS `break-inside: avoid` or automatic
 * reflow, so every generator that lists a variable number of things must
 * track its own cursor and decide when to start a new page; this class is
 * that bookkeeping in one place instead of duplicated per generator.
 */
export class PdfFlow {
  doc: Doc;
  y = 0;
  page = 0;
  private readonly bottom: number;
  private readonly header: { variant: PdfHeaderVariant; title: string; subtitle?: string; rtl: boolean };

  constructor(doc: Doc, options: { header: { variant: PdfHeaderVariant; title: string; subtitle?: string; rtl?: boolean }; bottomMargin?: number }) {
    this.doc = doc;
    this.header = { rtl: false, ...options.header };
    this.bottom = pdfPage.height - (options.bottomMargin ?? 56);
  }

  /** Starts a new page: background, header, resets the cursor to just below it. */
  newPage() {
    this.doc.addPage();
    this.page += 1;
    pdfPageBackground(this.doc);
    const headerBottom = drawPdfHeader(this.doc, this.header);
    this.y = headerBottom + 22;
    return this.y;
  }

  /** Starts a new page only if `space` more vertical room is needed before the footer. Call before drawing any card/block that must never be split across pages. */
  ensure(space: number) {
    if (this.page === 0 || this.y + space > this.bottom) this.newPage();
  }

  advance(consumed: number) {
    this.y += consumed;
    return this.y;
  }
}

/**
 * Stamps "Page X of Y" footers across every page currently in `doc` — call
 * once, after all content is drawn (requires `bufferPages: true`, which
 * lib/pdf/render.ts's createPdfDocument always sets), right before `doc.end()`.
 * Deliberately whole-document rather than per-flow: a document can mix a
 * fixed-layout page (the booking-confirmation ticket) with flowing pages
 * (the policy section), and page numbers must count the whole thing, not
 * just whichever PdfFlow drew the later pages.
 */
export function stampPdfFooters(doc: Doc, options: { reference?: string; rtl?: boolean } = {}) {
  const totalPages = doc.bufferedPageRange().count;
  for (let index = 0; index < totalPages; index++) {
    doc.switchToPage(index);
    drawPdfFooter(doc, { page: index + 1, totalPages, reference: options.reference, rtl: options.rtl });
  }
}
