/**
 * Single source of brand truth for every generated PDF. Every generator
 * (booking confirmation, status voucher, admin report, and any future
 * document) reads colors, spacing and fonts from here instead of hardcoding
 * its own hex values.
 */

export const pdfColors = {
  navy: "#073B5C",
  navyDark: "#052C45",
  coral: "#F15A37",
  aqua: "#1CA6B8",
  sand: "#F8F4ED",
  white: "#ffffff",
  text: "#153047",
  muted: "#6D7D89",
  border: "#D9E1E6",
  green: "#28A963",
  /** Status tones. Green is reserved for positive/paid/confirmed states. */
  status: {
    positive: { bg: "#E4F6EC", fg: "#1E7B49" },
    negative: { bg: "#FBE7E3", fg: "#B23A21" },
    warning: { bg: "#FBF0DC", fg: "#92400e" },
    neutral: { bg: "#E4EFF5", fg: "#0F4C75" },
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
  margin: 40,
} as const;

export const pdfRadius = {
  card: 14,
  ticket: 18,
  badge: 8,
  chip: 999,
} as const;
