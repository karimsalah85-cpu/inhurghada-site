/**
 * Single source of brand truth for every generated PDF. Every generator
 * (booking confirmation, status voucher, admin report, and any future
 * document) reads colors, spacing and fonts from here instead of hardcoding
 * its own hex values — this is what `app/globals.css`'s `--color-*` tokens
 * are for the live site. Values are deliberately the same hex codes as the
 * site's `--color-primary` / `--color-cta` / `--color-ocean` / `--color-sand`
 * tokens (see app/globals.css) so a PDF and the page that produced it always
 * read as the same brand, not a slightly-off lookalike.
 */

export const pdfColors = {
  /** Deep ocean navy — headers, primary text, ticket accents. */
  navy: "#073b4c",
  navyDark: "#063443",
  /** Coral/orange — the single "act now / total due" accent. Use sparingly. */
  coral: "#cb4133",
  coralDark: "#a83a2c",
  /** Aqua/turquoise — secondary accent, links, dividers. */
  aqua: "#087e8b",
  aquaDark: "#076c78",
  /** Warm ivory/sand — page and card backgrounds. */
  sand: "#f7f3ec",
  white: "#ffffff",
  ink: "#17252b",
  muted: "#5a6a71",
  border: "#e2e8e8",
  /** Status tones. Green is reserved for positive/paid/confirmed states. */
  status: {
    positive: { bg: "#dcfce7", fg: "#166534" },
    negative: { bg: "#fee2e2", fg: "#991b1b" },
    warning: { bg: "#fef3c7", fg: "#92400e" },
    neutral: { bg: "#dbeafe", fg: "#1e40af" },
  },
} as const;

export const pdfFonts = {
  /** Registered PDFKit font name; the actual embedded face is chosen per
   * locale by `lib/pdf/locale-font.ts` (Latin/Cyrillic, Arabic, or CJK). */
  name: "Noto",
} as const;

export const pdfPage = {
  /** A4 at 72dpi, matching every generator today. */
  width: 595.28,
  height: 841.89,
  margin: 48,
} as const;

export const pdfRadius = {
  card: 10,
  badge: 8,
  chip: 7,
} as const;

export const pdfSpacing = {
  sectionGap: 24,
  cardGap: 12,
} as const;
