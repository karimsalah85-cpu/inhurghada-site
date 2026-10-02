import { pdfPage } from "@/lib/pdf/theme";
import { pdfPageBackground, drawPdfHeader, drawPdfFooter, drawPdfImageFooter } from "@/lib/pdf/components";

type Doc = PDFKit.PDFDocument;

/** Room kept clear above the photo strip footer on text pages. */
export const pdfFlowBottomMargin = 88;

/**
 * Manual pagination helper for flowing (non-fixed-layout) pages — the
 * ticket's policy page, the status voucher's price breakdown, the admin
 * report and the supplier statement all stack an unknown number of
 * rows/paragraphs. PDFKit has no CSS `break-inside: avoid` or automatic
 * reflow, so every generator that lists a variable number of things must
 * track its own cursor and decide when to start a new page; this class is
 * that bookkeeping in one place instead of duplicated per generator. Every
 * page it starts gets the same white brand header (drawPdfHeader).
 */
export class PdfFlow {
  doc: Doc;
  y = 0;
  page = 0;
  /** Lowest y content may reach before the footer. */
  readonly bottom: number;
  private readonly header: { title: string; subtitle?: string; rtl: boolean };

  constructor(doc: Doc, options: { header: { title: string; subtitle?: string; rtl?: boolean }; bottomMargin?: number }) {
    this.doc = doc;
    this.header = { rtl: false, ...options.header };
    this.bottom = pdfPage.height - (options.bottomMargin ?? pdfFlowBottomMargin);
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
 * Stamps the footers across every page currently in `doc` — call once, after
 * all content is drawn (requires `bufferPages: true`, which lib/pdf/render.ts's
 * createPdfDocument always sets), right before `doc.end()`. Deliberately
 * whole-document rather than per-flow: a document can mix a fixed-layout
 * page (the ticket) with flowing pages (the policy section), and page numbers
 * must count the whole thing, not just whichever PdfFlow drew the later pages.
 *
 * Pages before `imageFromPage` get the plain text footer (the photographic
 * page 1 already has its hero); every later page gets the photo strip. A
 * document with no hero page passes `imageFromPage: 0`.
 */
export function stampPdfFooters(doc: Doc, options: { reference?: string; rtl?: boolean; imageFromPage?: number } = {}) {
  const totalPages = doc.bufferedPageRange().count;
  const imageFromPage = options.imageFromPage ?? 1;
  for (let index = 0; index < totalPages; index++) {
    doc.switchToPage(index);
    if (index < imageFromPage) drawPdfFooter(doc, { page: index + 1, totalPages, reference: options.reference, rtl: options.rtl });
    else drawPdfImageFooter(doc, { reference: options.reference, page: index + 1, totalPages, rtl: options.rtl });
  }
}
