import { localePath, type Locale } from "@/lib/i18n";

/**
 * The one email design every Daily Red Sea message shares. It is the layout
 * of the booking-confirmation ("ticket") email, lifted out so the status
 * update, referral, supplier, staff and internal emails are built from the
 * same masthead, headline, detail rows, dark panel, buttons and footer
 * instead of each hand-writing its own HTML.
 *
 * Email clients only honour inline styles and table layout, so every helper
 * returns a string of table rows/cells; `renderEmail` wraps them in the
 * document shell. `data-drs-complete-email` on the body tells
 * `withCustomerEmailSignature` (lib/booking-service.ts) not to append the
 * fallback signature, because the footer already carries the brand.
 */

export const emailSite = "https://dailyredsea.com";

export type EmailPalette = { ink: string; accent: string; tint: string; light: string; line: string; body: string; muted: string; panel: string; cream: string };

export const emailPalette: EmailPalette = {
  ink: "#123E47",
  accent: "#167580",
  tint: "#E7F1EF",
  light: "#9ED6CF",
  line: "#DEDCD5",
  body: "#596467",
  muted: "#747A78",
  panel: "#142D3B",
  cream: "#F5E9D7",
};

export const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] || character);

/** Only https (and inline cid images) may reach an href/src; anything else is dropped. */
export function safeEmailUrl(value: string | undefined | null) {
  if (!value) return "";
  if (value.startsWith("cid:")) return value;
  try { return new URL(value, emailSite).protocol === "https:" ? value : ""; } catch { return ""; }
}

export type EmailTheme = {
  locale: Locale;
  rtl: boolean;
  dir: "ltr" | "rtl";
  font: string;
  /** Points "forward" in the reading direction. */
  arrow: string;
  /** Letter-spacing for small-caps labels; 0 where the script has no capitals. */
  tracking: string;
  palette: EmailPalette;
};

export function emailTheme(locale: Locale, palette: Partial<EmailPalette> = {}): EmailTheme {
  const rtl = locale === "ar";
  return {
    locale,
    rtl,
    dir: rtl ? "rtl" : "ltr",
    font: rtl ? "'Noto Kufi Arabic',Tahoma,Arial,sans-serif" : "Manrope,'Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif",
    arrow: rtl ? "&larr;" : "&rarr;",
    tracking: rtl || locale === "zh" ? "0" : "1.8px",
    palette: { ...emailPalette, ...palette },
  };
}

const eyebrowStyle = (theme: EmailTheme, color = theme.palette.accent) => `font-size:10px;line-height:16px;font-weight:bold;letter-spacing:${theme.tracking};text-transform:uppercase;color:${color}`;
const paragraphStyle = (theme: EmailTheme) => `margin:0 0 16px;font-size:15px;line-height:25px;color:${theme.palette.body};`;

/** Small-caps label above a headline or a card title. */
export function emailEyebrow(theme: EmailTheme, text: string, options: { brand?: boolean; margin?: string } = {}) {
  return `<p style="margin:${options.margin ?? "0 0 12px"};${eyebrowStyle(theme)}">${escapeHtml(text)}${options.brand === false ? "" : " &nbsp; / &nbsp; DAILY RED SEA"}</p>`;
}

/** Body paragraph. `html` is trusted markup; `text` is escaped (newlines become line breaks). */
export function emailParagraph(theme: EmailTheme, content: string | { html: string }, options: { strong?: boolean; last?: boolean; small?: boolean; dir?: "ltr" | "rtl" } = {}) {
  const inner = typeof content === "string" ? escapeHtml(content).replace(/\n/g, "<br>") : content.html;
  const size = options.small ? "font-size:12px;line-height:20px;" : "";
  return `<p${options.dir ? ` dir="${options.dir}"` : ""} style="${paragraphStyle(theme)}${size}${options.strong ? `color:${theme.palette.ink};` : ""}${options.last ? "margin-bottom:0;" : ""}">${inner}</p>`;
}

/** Section heading (the "Booking details" level). */
export function emailHeading(theme: EmailTheme, text: string, margin = "0 0 6px") {
  return `<h2 style="margin:${margin};font-family:${theme.font};font-weight:800;font-size:24px;line-height:32px;letter-spacing:${theme.rtl ? "0" : "-0.5px"};color:${theme.palette.ink};">${escapeHtml(text)}</h2>`;
}

/** One full-width row of the 640px column; `section` rows get roomier vertical padding on phones. */
export function emailRow(html: string, padding: string, options: { section?: boolean; style?: string } = {}) {
  return `<tr><td class="gutter${options.section ? " section" : ""}" style="padding:${padding};${options.style ?? ""}">${html}</td></tr>`;
}

/**
 * The opening block: eyebrow, large headline, then greeting/intro paragraphs.
 * Long headlines (a supplier subject line, an admin-written automation
 * subject) step down a size so they do not run to five lines.
 */
export function emailIntro(theme: EmailTheme, options: { eyebrow?: string; brand?: boolean; headline: string; body?: string[]; padding?: string }) {
  const long = options.headline.length > 56;
  const body = options.body ?? [];
  const headlineMargin = body.length ? "0 0 22px" : "0";
  const headline = `<h1 class="${long ? "headline-sm" : "headline"}" style="margin:${headlineMargin};max-width:540px;font-family:${theme.font};font-weight:800;font-size:${long ? "30px" : "40px"};line-height:${long ? "37px" : "46px"};letter-spacing:${theme.rtl ? "0" : long ? "-0.8px" : "-1.2px"};color:${theme.palette.ink};">${escapeHtml(options.headline)}</h1>`;
  return emailRow(`
          ${options.eyebrow ? emailEyebrow(theme, options.eyebrow, { brand: options.brand }) : ""}
          ${headline}
          ${body.join("\n          ")}
        `, options.padding ?? "30px 42px 30px", { section: true });
}

export type EmailDetailRow = { label: string; value: string; /** Force left-to-right (references, phone numbers) inside an RTL email. */ ltr?: boolean };

/** Label/value rows separated by hairlines, with an optional large total — the "Booking details" table. */
export function emailDetails(theme: EmailTheme, rows: EmailDetailRow[], total?: { label: string; value: string }) {
  const { palette, rtl } = theme;
  const cell = `padding:12px 0;border-bottom:1px solid ${palette.line};vertical-align:top;`;
  const body = rows.map((row) => `<tr><td style="${cell}font-size:12px;line-height:18px;color:${palette.muted};width:38%;">${escapeHtml(row.label)}</td><td${row.ltr ? ' dir="ltr"' : ""} style="${cell}font-size:15px;line-height:22px;font-weight:bold;color:${palette.ink};${row.ltr && rtl ? "text-align:right;" : ""}">${escapeHtml(row.value).replace(/\n/g, "<br>")}</td></tr>`).join("\n            ");
  const totalRow = total ? `<tr><td style="padding:16px 0 4px;font-size:12px;line-height:18px;color:${palette.muted};">${escapeHtml(total.label)}</td><td style="padding:16px 0 4px;font-family:${theme.font};font-size:26px;line-height:32px;font-weight:800;color:${palette.ink};">${escapeHtml(total.value)}</td></tr>` : "";
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
            ${body}
            ${totalRow}
          </table>`;
}

/** Pill button. `cream` sits on the dark panel, `ink` on the white page. */
export function emailButton(theme: EmailTheme, label: string, href: string, variant: "ink" | "cream" = "ink") {
  const background = variant === "cream" ? theme.palette.cream : theme.palette.ink;
  const color = variant === "cream" ? theme.palette.panel : "#FFFFFF";
  return `<a href="${escapeHtml(href)}" style="display:inline-block;padding:13px 19px;background:${background};border:1px solid ${background};color:${color};text-decoration:none;font-size:13px;font-weight:bold;line-height:20px;border-radius:999px;">${escapeHtml(label)} &nbsp;${theme.arrow}</a>`;
}

/** Underlined text link with the forward arrow, as used under the ticket QR. */
export function emailLink(theme: EmailTheme, label: string, href: string, color = theme.palette.ink) {
  return `<a href="${escapeHtml(href)}" style="color:${color};font-size:12px;line-height:20px;font-weight:bold;text-decoration:underline;">${escapeHtml(label)} &nbsp;${theme.arrow}</a>`;
}

/** The rounded tinted card the trip ticket sits on; also used for notices and one-time codes. */
export function emailCard(theme: EmailTheme, innerHtml: string, margin = "0 0 14px") {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:${margin};background:${theme.palette.tint};border-radius:14px;"><tr><td style="padding:20px 22px;">${innerHtml}</td></tr></table>`;
}

/** Card title in the ticket-label style: small-caps eyebrow, then a bold line. */
export function emailCardTitle(theme: EmailTheme, eyebrow: string, title?: string) {
  return `<p style="margin:0 0 ${title ? "6px" : "0"};${eyebrowStyle(theme)};">${escapeHtml(eyebrow)}</p>${title ? `<p style="margin:0;font-family:${theme.font};font-size:18px;line-height:25px;font-weight:800;color:${theme.palette.ink};">${escapeHtml(title).replace(/\n/g, "<br>")}</p>` : ""}`;
}

/**
 * The dark rounded panel that closes the ticket email: a lead line, a quieter
 * supporting line and one cream call-to-action.
 */
export function emailPanel(theme: EmailTheme, options: { eyebrow?: string; lead?: string; body?: string; button?: { label: string; href: string }; extraHtml?: string }) {
  const { palette } = theme;
  const parts = [
    options.eyebrow ? `<p style="margin:0 0 14px;${eyebrowStyle(theme, "#F1D4AB")};">${escapeHtml(options.eyebrow)}</p>` : "",
    options.lead ? `<p style="margin:0 0 10px;font-size:14px;line-height:23px;color:#D2DDD9;">${escapeHtml(options.lead)}</p>` : "",
    options.body ? `<p style="margin:0 0 ${options.button || options.extraHtml ? "18px" : "0"};font-size:12px;line-height:20px;color:#B6C8CB;">${escapeHtml(options.body)}</p>` : "",
    options.button ? emailButton(theme, options.button.label, options.button.href, "cream") : "",
    options.extraHtml ?? "",
  ].filter(Boolean);
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${palette.panel};border-radius:14px;"><tr><td class="panel" style="padding:24px 26px 22px;color:#FFFFFF;">
          ${parts.join("\n          ")}
        </td></tr></table>`;
}

export type EmailDocument = {
  /** <title>; normally the subject without the reference. */
  title: string;
  /** Hidden preview line shown next to the subject in the inbox list. */
  preheader?: string;
  /** Small text opposite the logo: a booking reference or a short label. */
  mastheadNote?: { text: string; ltr?: boolean };
  /** Table rows built with emailIntro/emailRow, in order. */
  rows: string[];
  /** Sign-off above the footer links; newlines become line breaks. Omit when the body already signs off. */
  signoff?: string;
  /** Small print between the sign-off and the footer links. */
  footerNote?: string;
  /** Extra rules for the phone breakpoint (max-width:520px), for layout-specific classes. */
  mobileCss?: string;
};

export function renderEmail(theme: EmailTheme, document: EmailDocument) {
  const { palette, font, dir, rtl, locale } = theme;
  const home = `${emailSite}${localePath(locale, "/")}`;
  const end = rtl ? "left" : "right";
  const note = document.mastheadNote;
  return `<!doctype html><html lang="${locale}" dir="${dir}"><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;800&family=Noto+Kufi+Arabic:wght@400;700&display=swap" rel="stylesheet"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeHtml(document.title)}</title><style>body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}img{-ms-interpolation-mode:bicubic}a{word-wrap:break-word}@media screen and (max-width:520px){.outer{padding:0!important}.gutter{padding-left:25px!important;padding-right:25px!important}.headline{font-size:34px!important;line-height:40px!important}.headline-sm{font-size:26px!important;line-height:33px!important}.stack{display:block!important;width:100%!important;box-sizing:border-box!important}.panel{padding:20px 20px 18px!important}.masthead img{width:160px!important}.section{padding-top:30px!important;padding-bottom:30px!important}${document.mobileCss ?? ""}}</style></head><body data-drs-complete-email="true" style="margin:0;padding:0;background:#FFFFFF;font-family:${font};color:${palette.ink};">
      ${document.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(document.preheader)}</div>` : ""}
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FFFFFF;"><tr><td class="outer" align="center" style="padding:32px 12px;">
      <!--[if mso]><table role="presentation" width="640" align="center"><tr><td><![endif]-->
      <table role="presentation" width="640" cellspacing="0" cellpadding="0" dir="${dir}" style="width:100%;max-width:640px;background:#FFFFFF;">
        <tr><td class="gutter" style="padding:24px 42px;border-top:4px solid ${palette.accent};"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td><a class="masthead" href="${home}" style="text-decoration:none;"><img src="${emailSite}/brand/dailyredsea-wordmark-email.png" width="190" height="29" alt="dailyredsea.com" style="display:block;width:190px;max-width:100%;height:auto;border:0;"></a></td>${note ? `<td align="${end}"${note.ltr ? ' dir="ltr"' : ""} style="font-size:10px;line-height:16px;color:#767975;">${escapeHtml(note.text)}</td>` : ""}</tr></table></td></tr>
        ${document.rows.filter(Boolean).join("\n        ")}
        <tr><td class="gutter" style="padding:26px 42px 32px;border-top:1px solid ${palette.line};">${document.signoff ? `<p style="margin:0 0 ${document.footerNote ? "14px" : "18px"};font-family:${font};font-weight:600;font-size:17px;line-height:27px;color:${palette.ink};">${escapeHtml(document.signoff).replace(/\n/g, "<br>")}</p>` : ""}${document.footerNote ? `<p style="margin:0 0 16px;font-size:11px;line-height:18px;color:${palette.muted};">${escapeHtml(document.footerNote)}</p>` : ""}<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td><a href="${home}" style="color:#6C7977;font-size:11px;letter-spacing:1px;text-decoration:none;">dailyredsea.com</a> &nbsp;·&nbsp; <a href="mailto:info@dailyredsea.com" style="color:#6C7977;font-size:11px;text-decoration:none;">info@dailyredsea.com</a></td><td align="${end}" style="color:${palette.accent};font-size:23px;">&#10038;</td></tr></table></td></tr>
      </table><!--[if mso]></td></tr></table><![endif]--></td></tr></table></body></html>`;
}

/** Sign-offs. `warm` closes messages about an upcoming trip; `team` is the neutral line for everything else. */
const signoffs: Record<Locale, { warm: string; team: string }> = {
  en: { warm: "See you soon,\nThe Daily Red Sea team", team: "The Daily Red Sea team" },
  de: { warm: "Bis bald,\ndein Daily Red Sea Team", team: "Dein Daily Red Sea Team" },
  ru: { warm: "До скорой встречи,\nкоманда Daily Red Sea", team: "Команда Daily Red Sea" },
  ar: { warm: "نراك قريباً،\nفريق ديلي رد سي", team: "فريق ديلي رد سي" },
  pl: { warm: "Do zobaczenia,\nzespół Daily Red Sea", team: "Zespół Daily Red Sea" },
  zh: { warm: "期待与您相见，\nDaily Red Sea 团队", team: "Daily Red Sea 团队" },
};

export const emailSignoff = (locale: Locale, tone: "warm" | "team" = "team") => signoffs[locale][tone];

const whatsappLabels: Record<Locale, string> = {
  en: "Chat on WhatsApp", de: "Auf WhatsApp schreiben", ru: "Написать в WhatsApp", ar: "تواصل عبر واتساب", pl: "Napisz na WhatsApp", zh: "通过 WhatsApp 联系",
};

export const emailWhatsappLabel = (locale: Locale) => whatsappLabels[locale];
