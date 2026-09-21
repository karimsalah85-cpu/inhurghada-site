import PDFDocument from "pdfkit";
import { notoFontPath } from "@/lib/pdf/locale-font";
import type { Locale } from "@/lib/i18n";

/**
 * Creates a PDFKit document with the settings every Daily Red Sea PDF needs:
 * A4, no default font (see the inline note below), and page buffering so
 * `PdfFlow.finishWithFooters()` can stamp "Page X of Y" once the final page
 * count is known. Registers the embedded Unicode face for `locale` under the
 * shared "Noto" font name used throughout lib/pdf/components.ts.
 */
export function createPdfDocument(options: { title: string; locale: Locale; createdAt?: Date }) {
  // font: "" stops PDFKit's constructor from eagerly loading its built-in
  // Helvetica AFM through the "#standard-fonts/*" subpath import, which is not
  // resolvable once the route is bundled for serverless. Every text-drawing
  // component sets the embedded "Noto" face explicitly, so no default font is needed.
  const doc = new PDFDocument({
    size: "A4",
    margin: 0,
    autoFirstPage: false,
    bufferPages: true,
    font: "",
    info: { Title: options.title, Author: "Daily Red Sea", ...(options.createdAt ? { CreationDate: options.createdAt } : {}) },
  });
  doc.registerFont("Noto", notoFontPath(options.locale));
  return doc;
}

/** Collects a PDFKit document's output stream into a single Buffer. Call `doc.end()` after this. */
export function renderPdfToBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}
