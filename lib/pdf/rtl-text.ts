/**
 * Arabic-script text handling shared by every PDF component that writes
 * customer-facing copy. PDFKit shapes Arabic correctly but does not reorder
 * embedded Latin digits/dates within an RTL run, so callers must do that
 * themselves before handing text to `doc.text()`.
 */

const isArabicScript = (value: string) => /\p{Script=Arabic}/u.test(value);

/** Reverses digit/date/time runs (e.g. "12:30" or "2026-08-02") inside Arabic text
 * so they read left-to-right within the right-to-left sentence, as Arabic readers expect. */
export function reverseArabicDigitRuns(value: string, rtl: boolean) {
  return rtl && isArabicScript(value) ? value.replace(/[0-9][0-9:./-]*/g, (part) => [...part].reverse().join("")) : value;
}

/**
 * Non-breaking spaces keep short RTL labels/values from wrapping mid-phrase,
 * but they also disable word-wrap entirely, so long free text (like a pickup
 * address) must use `rtlWrappableText` below instead.
 */
export function rtlLabelText(value: string, rtl: boolean) {
  return rtl ? reverseArabicDigitRuns(value, rtl).replaceAll(" ", " ") : value;
}

/** For long free text that must still be able to wrap across lines. */
export function rtlWrappableText(value: string, rtl: boolean) {
  return rtl ? reverseArabicDigitRuns(value, rtl) : value;
}

/**
 * Word-wraps Arabic paragraph text at `width` using the document's current
 * font/size, substituting non-breaking spaces so PDFKit keeps each wrapped
 * line as one shaping run (ordinary spaces split PDFKit's RTL runs).
 */
export function wrapArabicParagraph(doc: PDFKit.PDFDocument, value: string, width: number, fontSize: number, rtl: boolean) {
  if (!rtl || !isArabicScript(value)) return value;
  const words = reverseArabicDigitRuns(value, rtl).split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && doc.widthOfString(candidate) > width) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.join("\n");
}
