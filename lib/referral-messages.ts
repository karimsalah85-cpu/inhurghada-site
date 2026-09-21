import { bookingLocale } from "@/lib/booking-communications-i18n";
import { localePath } from "@/lib/i18n";
import { referralCopy, referralProgramCopy } from "@/lib/referral-i18n";
import { referralNotificationCopy } from "@/lib/referral-notification-copy";
import { referralLink } from "@/lib/referral";
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Deliberately no price or PDF input: this is a post-trip thank-you, not a receipt. */
export function buildReferralMessage(input: { event: "trip_completed" | "activated" | "reward_earned"; locale?: string | null; customerName: string; qualified: boolean; referralCode?: string | null; balanceUnits?: number }) {
  const locale = bookingLocale(input.locale);
  const copy = referralCopy[locale], program = referralProgramCopy[locale], note = referralNotificationCopy[locale];
  const subject = input.event === "trip_completed" ? note.thanks : input.event === "activated" ? note.unlocked : note.earned;
  const site = "https://dailyredsea.com";
  const personal = input.qualified && input.referralCode ? new URL(referralLink(site, input.referralCode)) : null;
  if (personal) personal.pathname = localePath(locale, "/");
  const personalUrl = personal?.toString();
  const reviewUrl = new URL(localePath(locale, "/reviews"), site).toString();
  const accountUrl = new URL(localePath(locale, "/referrals"), site).toString();
  const whatsapp = personalUrl ? `https://wa.me/?text=${encodeURIComponent(`${copy.whatsappMessage} ${personalUrl}`)}` : null;
  const lines = [input.customerName, subject, ...(input.event === "trip_completed" ? [note.enjoyed, `${note.review}: ${reviewUrl}`] : []), ...(input.event === "reward_earned" ? [note.balance(Math.max(0, input.balanceUnits || 0) * 5)] : []), copy.heading, input.qualified ? copy.tagline : program.locked, program.terms, ...(personalUrl ? [`${copy.copyLink}: ${personalUrl}`, `${copy.shareWhatsapp}: ${whatsapp}`] : []), `${program.viewRewards}: ${accountUrl}`];
  const html = `<div dir="${locale === "ar" ? "rtl" : "ltr"}" lang="${locale}"><p>${escapeHtml(input.customerName)}</p><h2>${escapeHtml(subject)}</h2>${input.event === "trip_completed" ? `<p>${escapeHtml(note.enjoyed)}</p><p><a href="${reviewUrl}">${escapeHtml(note.review)}</a></p>` : ""}${input.event === "reward_earned" ? `<p>${escapeHtml(note.balance(Math.max(0, input.balanceUnits || 0) * 5))}</p>` : ""}<h3>${escapeHtml(copy.heading)}</h3><p>${escapeHtml(input.qualified ? copy.tagline : program.locked)}</p><p>${escapeHtml(program.terms)}</p>${personalUrl ? `<p><a href="${escapeHtml(whatsapp!)}">${escapeHtml(copy.shareWhatsapp)}</a></p><p>${escapeHtml(copy.copyLink)}: <a href="${escapeHtml(personalUrl)}">${escapeHtml(personalUrl)}</a></p>` : ""}<p><a href="${accountUrl}">${escapeHtml(program.viewRewards)}</a></p></div>`;
  return { subject, html, text: lines.join("\n\n") };
}
