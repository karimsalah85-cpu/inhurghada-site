import type { Locale } from "@/lib/i18n";
import { referralNotificationCopy } from "@/lib/referral-notification-copy";
import {
  emailButton, emailCard, emailDetails, emailHeading, emailIntro, emailParagraph, emailRow, emailSignoff, emailTheme,
  escapeHtml, renderEmail, type EmailDetailRow,
} from "@/lib/email/layout";

/**
 * The short transactional and internal emails, built on the shared layout
 * (lib/email/layout.ts) so they look like the booking-confirmation email
 * rather than unstyled HTML. The longer customer messages keep their own
 * modules: confirmation (lib/booking-communications-i18n.ts), status update
 * (lib/booking-status-notification.ts), referral (lib/referral-messages.ts)
 * and supplier requests (lib/supplier-dispatch.ts).
 */

export type OperatorBookingEmailInput = {
  bookingType?: string; reference?: string; customerName?: string; phone?: string; customerEmail?: string;
  date?: string; guests?: string; hotel?: string; tourName?: string; message?: string;
};

/** New-booking notice for the office inbox. */
export function buildOperatorBookingEmail(input: OperatorBookingEmailInput) {
  const theme = emailTheme("en");
  const rows: EmailDetailRow[] = ([
    ["Reference", input.reference], ["Type", input.bookingType], ["Customer", input.customerName],
    ["WhatsApp", input.phone], ["Email", input.customerEmail], ["Tour", input.tourName], ["Date", input.date],
    ["Guests", input.guests], ["Pickup / hotel", input.hotel], ["Notes", input.message],
  ] as [string, string | undefined][]).filter((row): row is [string, string] => Boolean(row[1])).map(([label, value]) => ({ label, value }));
  const subject = `New ${input.bookingType || "tour"} booking: ${input.reference || ""}`.trim();
  return {
    subject,
    html: renderEmail(theme, {
      title: subject,
      preheader: [input.customerName, input.tourName, input.date].filter(Boolean).join(" · "),
      mastheadNote: input.reference ? { text: input.reference, ltr: true } : undefined,
      rows: [
        emailIntro(theme, {
          eyebrow: `New ${input.bookingType || "tour"} booking`,
          headline: "New Daily Red Sea booking",
          body: [emailParagraph(theme, "The customer's confirmation PDF is attached.", { last: true })],
        }),
        emailRow(`${emailHeading(theme, "Booking details")}
          ${emailDetails(theme, rows)}`, "16px 42px 30px", { section: true }),
      ],
      signoff: "Daily Red Sea bookings",
    }),
  };
}

/** One-time code for the referral account sign-in. Never BCC'd. */
export function buildVerificationCodeEmail(input: { locale: Locale; code: string }) {
  const theme = emailTheme(input.locale);
  const copy = referralNotificationCopy[input.locale];
  return {
    subject: copy.otpSubject,
    html: renderEmail(theme, {
      title: copy.otpSubject,
      rows: [
        emailIntro(theme, { headline: copy.otpSubject, padding: "30px 42px 22px" }),
        emailRow(`${emailCard(theme, `<p dir="ltr" style="margin:0;font-family:${theme.font};font-size:34px;line-height:42px;font-weight:800;letter-spacing:8px;text-align:center;color:${theme.palette.ink};">${escapeHtml(input.code)}</p>`, "0 0 18px")}
          ${emailParagraph(theme, copy.otpBody, { last: true })}`, "0 42px 34px"),
      ],
      signoff: emailSignoff(input.locale),
    }),
  };
}

/** Admin invitation / renewed invitation with the personal sign-in link. */
export function buildStaffInvitationEmail(input: { displayName: string; url: string }) {
  const theme = emailTheme("en");
  return {
    subject: "Your Daily Red Sea admin invitation",
    html: renderEmail(theme, {
      title: "Your Daily Red Sea admin invitation",
      mastheadNote: { text: "Admin team" },
      rows: [
        emailIntro(theme, {
          eyebrow: "Admin invitation",
          headline: "Join the Daily Red Sea admin team",
          body: [
            emailParagraph(theme, `Hello ${input.displayName},`, { strong: true }),
            emailParagraph(theme, "Your invitation has been renewed. Use the button below to choose your password and access the admin area."),
            emailParagraph(theme, { html: emailButton(theme, "Accept invitation", input.url) }),
            emailParagraph(theme, "If you were not expecting this invitation, you can ignore this email.", { small: true, last: true }),
          ],
        }),
      ],
      signoff: emailSignoff("en"),
    }),
  };
}

/** Plain internal notice to the office inbox (a supplier answered, a payment was disputed, …). */
export function buildOfficeNoticeEmail(input: { subject: string; lines: string[] }) {
  const theme = emailTheme("en");
  const lines = input.lines.filter((line) => line.trim());
  return {
    subject: input.subject,
    html: renderEmail(theme, {
      title: input.subject,
      preheader: lines[0],
      mastheadNote: { text: "Office notice" },
      rows: [
        emailIntro(theme, {
          eyebrow: "Office notice",
          headline: input.subject,
          body: lines.map((line, index) => emailParagraph(theme, line, { last: index === lines.length - 1 })),
        }),
      ],
      signoff: "Daily Red Sea operations",
    }),
  };
}

/** Escapes plain text, keeps line breaks and turns bare https URLs into links. */
function linkify(text: string, color: string) {
  return escapeHtml(text).replace(/\n/g, "<br>").replace(/https:\/\/[^\s<]+[^\s<.,;:!?)]/g, (url) => `<a href="${url}" style="color:${color};font-weight:bold;text-decoration:underline;">${url}</a>`);
}

/**
 * Wraps an admin-written automation template (pickup reminder, review
 * request, …) in the shared layout. The body is plain text from the template
 * editor: blank lines separate paragraphs, single newlines stay line breaks,
 * and https links (review page, waiver form) become clickable. The template
 * carries its own sign-off, so the footer adds none.
 */
export function buildAutomationEmail(input: { subject: string; body: string; locale?: Locale; reference?: string | null }) {
  const theme = emailTheme(input.locale ?? "en");
  const paragraphs = input.body.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
  return {
    subject: input.subject,
    html: renderEmail(theme, {
      title: input.subject,
      preheader: paragraphs[0]?.replace(/\s+/g, " ").slice(0, 140),
      mastheadNote: input.reference ? { text: input.reference, ltr: true } : undefined,
      rows: [
        emailIntro(theme, {
          headline: input.subject,
          body: paragraphs.map((part, index) => emailParagraph(theme, { html: linkify(part, theme.palette.accent) }, { last: index === paragraphs.length - 1 })),
        }),
      ],
    }),
  };
}
