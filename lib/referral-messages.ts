import { bookingLocale } from "@/lib/booking-communications-i18n";
import { localePath } from "@/lib/i18n";
import { referralCopy, referralProgramCopy } from "@/lib/referral-i18n";
import { referralNotificationCopy } from "@/lib/referral-notification-copy";
import { referralLink } from "@/lib/referral";
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const inviteCopy = {
  en: "Invite your friends and family to join you in discovering the Red Sea. Participate in our referral program using the link below.",
  ar: "ادعُ أصدقاءك وعائلتك لاكتشاف البحر الأحمر. شارك في برنامج الإحالات عبر الرابط أدناه.",
  de: "Lade Freunde und Familie ein, das Rote Meer zu entdecken. Nimm über den Link unten an unserem Empfehlungsprogramm teil.",
  ru: "Пригласите друзей и семью открыть Красное море. Участвуйте в нашей реферальной программе по ссылке ниже.",
  pl: "Zaproś znajomych i rodzinę do odkrywania Morza Czerwonego. Dołącz do programu poleceń przez poniższy link.",
  zh: "邀请亲朋好友探索红海。通过下方链接参加我们的推荐计划。",
};
const buttonStyle = 'display:inline-block;padding:14px 20px;background:#0A2D57;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold';

/** Deliberately no price or PDF input: this is a post-trip thank-you, not a receipt. */
export function buildReferralMessage(input: { event: "trip_completed" | "activated" | "reward_earned"; locale?: string | null; customerName: string; qualified: boolean; referralCode?: string | null; balanceUnits?: number; bookingReference?: string }) {
  const locale = bookingLocale(input.locale);
  const copy = referralCopy[locale], program = referralProgramCopy[locale], note = referralNotificationCopy[locale];
  const subject = input.event === "trip_completed" ? note.thanks : input.event === "activated" ? note.unlocked : note.earned;
  const site = "https://dailyredsea.com";
  const personal = input.qualified && input.referralCode ? new URL(referralLink(site, input.referralCode)) : null;
  if (personal) personal.pathname = localePath(locale, "/");
  const personalUrl = personal?.toString();
  const review = new URL("/reviews", site);
  review.searchParams.set("lang", locale);
  if (input.bookingReference) review.searchParams.set("ref", input.bookingReference);
  const reviewUrl = review.toString();
  const accountUrl = new URL(localePath(locale, "/referrals"), site).toString();
  const whatsapp = personalUrl ? `https://wa.me/?text=${encodeURIComponent(`${copy.whatsappMessage} ${personalUrl}`)}` : null;
  const lines = [input.customerName, subject, ...(input.event === "trip_completed" ? [note.enjoyed, `${note.review}: ${reviewUrl}`] : []), ...(input.event === "reward_earned" ? [note.balance(Math.max(0, input.balanceUnits || 0) * 5)] : []), copy.heading, inviteCopy[locale], input.qualified ? copy.tagline : program.locked, program.terms, ...(personalUrl ? [`${copy.copyLink}: ${personalUrl}`, `${copy.shareWhatsapp}: ${whatsapp}`] : []), `${program.viewRewards}: ${accountUrl}`];
  const html = `<div dir="${locale === "ar" ? "rtl" : "ltr"}" lang="${locale}"><p>${escapeHtml(input.customerName)}</p><h2>${escapeHtml(subject)}</h2>${input.event === "trip_completed" ? `<p>${escapeHtml(note.enjoyed)}</p><p><a style="${buttonStyle}" href="${escapeHtml(reviewUrl)}">${escapeHtml(note.review)}</a></p>` : ""}${input.event === "reward_earned" ? `<p>${escapeHtml(note.balance(Math.max(0, input.balanceUnits || 0) * 5))}</p>` : ""}<h3>${escapeHtml(copy.heading)}</h3><p>${escapeHtml(inviteCopy[locale])}</p><p>${escapeHtml(input.qualified ? copy.tagline : program.locked)}</p><p>${escapeHtml(program.terms)}</p>${personalUrl ? `<p><a style="${buttonStyle}" href="${escapeHtml(whatsapp!)}">${escapeHtml(copy.shareWhatsapp)}</a></p><p>${escapeHtml(copy.copyLink)}: <a href="${escapeHtml(personalUrl)}">${escapeHtml(personalUrl)}</a></p>` : ""}<p><a style="${buttonStyle}" href="${accountUrl}">${escapeHtml(program.viewRewards)}</a></p></div>`;
  return { subject, html, text: lines.join("\n\n") };
}
