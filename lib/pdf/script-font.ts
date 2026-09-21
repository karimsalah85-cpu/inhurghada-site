/**
 * Script-aware font selection for documents that may contain arbitrary
 * customer-entered text in more than one script at once (e.g. the admin
 * situation report, where trip/customer names come from real bookings and
 * aren't limited to one booking locale like the confirmation/status PDFs
 * are). `registerAllScripts` registers every embedded face under fixed
 * names; `pickScriptFont` picks the right one for a given string, and
 * `pdfWrite` (lib/pdf/components.ts) falls back to the default face if the
 * picked one isn't registered on that particular document, so single-locale
 * documents (which only register "Noto") are unaffected.
 */
import path from "node:path";
import { pdfFonts } from "@/lib/pdf/theme";

export const scriptFontNames = { latin: pdfFonts.name, arabic: "NotoArabic", cjk: "NotoCJK" } as const;

const isArabic = (value: string) => /\p{Script=Arabic}/u.test(value);
const isCjk = (value: string) => /[㐀-䶿一-鿿豈-﫿]/u.test(value);

export function pickScriptFont(value: string): string {
  if (isArabic(value)) return scriptFontNames.arabic;
  if (isCjk(value)) return scriptFontNames.cjk;
  return scriptFontNames.latin;
}

/** Registers Latin/Cyrillic, Arabic and CJK embedded faces on one document, for multi-script content. */
export function registerAllScriptFonts(doc: PDFKit.PDFDocument) {
  const fontsDir = path.join(process.cwd(), "assets/fonts");
  doc.registerFont(scriptFontNames.latin, path.join(fontsDir, "NotoSans.ttf"));
  doc.registerFont(scriptFontNames.arabic, path.join(fontsDir, "NotoSansArabic.ttf"));
  doc.registerFont(scriptFontNames.cjk, path.join(fontsDir, "NotoSansSC.ttf"));
}
