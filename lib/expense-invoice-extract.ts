/**
 * Browser-only invoice reader. Digital PDFs are read straight from their text
 * layer; images (and, as a fallback, nothing else) go through tesseract.js OCR.
 * All runtime assets are served same-origin from /vendor (see
 * scripts/vendor-ocr-assets.mjs) because the site CSP blocks third-party
 * script/worker/wasm hosts.
 */

export type InvoiceExtraction = {
  text: string;
  method: "pdf_text" | "ocr";
  confidence: number | null; // 0..100, OCR only
};

export type ExtractProgress = (stage: string, fraction: number) => void;

const TESSERACT_LANGS = "eng+ara";
const MIN_PDF_TEXT_CHARS = 40;

export function isSupportedInvoiceFile(file: File): boolean {
  return /^(application\/pdf|image\/(png|jpe?g|webp))$/i.test(file.type);
}

async function readPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/vendor/pdf/pdf.worker.min.mjs";

  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    isEvalSupported: false,
    disableFontFace: true,
  }).promise;

  const pageCount = Math.min(doc.numPages, 3);
  const chunks: string[] = [];
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    const line = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/[ \t]+/g, " ");
    chunks.push(line);
  }
  await doc.destroy();
  return chunks.join("\n");
}

async function runOcr(file: Blob, onProgress?: ExtractProgress): Promise<{ text: string; confidence: number }> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker(TESSERACT_LANGS, 1, {
    workerPath: "/vendor/tesseract/worker.min.js",
    corePath: "/vendor/tesseract/core",
    langPath: "/vendor/tesseract/lang",
    workerBlobURL: false,
    logger: (message: { status?: string; progress?: number }) => {
      if (onProgress && typeof message.progress === "number") {
        onProgress(message.status || "recognizing text", message.progress);
      }
    },
  });
  try {
    const { data } = await worker.recognize(file);
    return { text: data.text || "", confidence: Math.round(data.confidence ?? 0) };
  } finally {
    await worker.terminate();
  }
}

export async function extractInvoice(file: File, onProgress?: ExtractProgress): Promise<InvoiceExtraction> {
  if (!isSupportedInvoiceFile(file)) {
    throw new Error("Upload a PDF, PNG, JPEG, or WebP invoice.");
  }

  if (file.type === "application/pdf") {
    onProgress?.("reading pdf", 0.1);
    const text = await readPdfText(file);
    if (text.replace(/\s/g, "").length >= MIN_PDF_TEXT_CHARS) {
      onProgress?.("done", 1);
      return { text, method: "pdf_text", confidence: null };
    }
    throw new Error(
      "This PDF has no readable text layer (it looks scanned). Upload a photo or screenshot of the invoice instead.",
    );
  }

  onProgress?.("starting ocr", 0.05);
  const { text, confidence } = await runOcr(file, onProgress);
  onProgress?.("done", 1);
  return { text, method: "ocr", confidence };
}
