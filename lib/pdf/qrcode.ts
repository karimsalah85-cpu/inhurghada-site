import QRCode from "qrcode";
import { pdfColors } from "@/lib/pdf/theme";

/**
 * Renders a QR code as a PNG buffer PDFKit can embed with `doc.image()`.
 * Deterministic for the same input, so re-generating the same document
 * produces byte-identical output (see lib/pdf/components.ts QrCodeBlock).
 */
export function renderQrCodePng(value: string, sizePx = 240): Promise<Buffer> {
  return QRCode.toBuffer(value, {
    type: "png",
    width: sizePx,
    margin: 1,
    color: { dark: pdfColors.navy, light: "#ffffff" },
    errorCorrectionLevel: "M",
  });
}
