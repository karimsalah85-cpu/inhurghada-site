import { bookingLocale } from "@/lib/booking-communications-i18n";
import { localePath } from "@/lib/i18n";
import { referralCopy, referralProgramCopy } from "@/lib/referral-i18n";
import { referralNotificationCopy } from "@/lib/referral-notification-copy";
import { referralLink } from "@/lib/referral";
import { googleReviewUrl } from "@/lib/contact";
import { tripThankYouCopy } from "@/lib/trip-thank-you-copy";
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

export type ReferralMessageInput = { event: "trip_completed" | "activated" | "reward_earned"; locale?: string | null; customerName: string; qualified: boolean; referralCode?: string | null; balanceUnits?: number; bookingReference?: string; trip?: { theme?: "sea" | "desert" | "culture"; title: string; image?: string; destination: string; url: string; related: Array<{ title: string; image?: string; url: string }> } };

/** Deliberately no price or PDF input: this is a post-trip thank-you, not a receipt. */
export function buildReferralMessage(input: ReferralMessageInput) {
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
  if (input.event === "trip_completed") {
    const thanks = tripThankYouCopy[locale];
    const trip = input.trip;
    const safeUrl = (value: string | undefined) => {
      if (!value) return "";
      try { const url = new URL(value, site); return url.protocol === "https:" ? url.toString() : ""; } catch { return ""; }
    };
    const palette = trip?.theme === "desert"
      ? { ink: "#422F28", accent: "#AA532E", tint: "#F3E8DD", light: "#E5B98D" }
      : trip?.theme === "culture"
        ? { ink: "#363B30", accent: "#65724C", tint: "#EBEBDD", light: "#C5CCA7" }
        : { ink: "#123E47", accent: "#167580", tint: "#E7F1EF", light: "#9ED6CF" };
    const rtl = locale === "ar";
    const arrow = rtl ? "&larr;" : "&rarr;";
    const font = rtl ? "'Noto Kufi Arabic',Tahoma,Arial,sans-serif" : "Manrope,'Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif";
    const button = (label: string, href: string, light = false) => `<a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 19px;background:${light ? "#F5E9D7" : palette.ink};border:1px solid ${light ? "#F5E9D7" : palette.ink};color:${light ? "#142D3B" : "#ffffff"};text-decoration:none;font-size:13px;font-weight:bold;line-height:20px;border-radius:999px;mso-padding-alt:0;">${escapeHtml(label)} &nbsp;${arrow}</a>`;
    const related = (trip?.related || []).filter(item => safeUrl(item.url)).slice(0, 2);
    const hero = safeUrl(trip?.image);
    const tripUrl = safeUrl(trip?.url);
    const paragraph = "margin:0 0 18px;font-size:15px;line-height:25px;color:#596467;";
    const eyebrow = `margin:0 0 12px;font-size:10px;line-height:16px;font-weight:bold;letter-spacing:${rtl || locale === "zh" ? "0" : "1.8px"};text-transform:uppercase;color:${palette.accent}`;
    const reviewButton = (label: string, href: string, primary: boolean, index: number) => `<td class="stack review-cell" valign="top" style="padding-${rtl ? "left" : "right"}:${index === 0 ? "12px" : "0"};"><a href="${escapeHtml(href)}" style="display:block;padding:15px 22px;background:${primary ? palette.ink : "#FFFFFF"};border:1.5px solid ${palette.ink};border-radius:999px;color:${primary ? "#FFFFFF" : palette.ink};font-family:${font};font-size:14px;font-weight:bold;line-height:20px;text-align:center;text-decoration:none;white-space:nowrap;">${escapeHtml(label)} &nbsp;${arrow}</a></td>`;
    const html = `<!doctype html><html lang="${locale}" dir="${rtl ? "rtl" : "ltr"}"><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;800&family=Noto+Kufi+Arabic:wght@400;700&display=swap" rel="stylesheet"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeHtml(subject)}</title><style>body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}img{-ms-interpolation-mode:bicubic}a{word-wrap:break-word}@media screen and (max-width:520px){.outer{padding:0!important}.gutter{padding-left:25px!important;padding-right:25px!important}.headline{font-size:37px!important;line-height:42px!important}.hero{height:230px!important}.stack{display:block!important;width:100%!important;box-sizing:border-box!important}.review-cell{padding:0 0 12px!important}.review-cell a{white-space:normal!important}.recommendation{padding:0 0 28px!important}.recommendation img{width:100%!important;height:150px!important}.referral-box{padding:20px 20px 18px!important}.masthead img{width:160px!important}.section{padding-top:32px!important;padding-bottom:32px!important}}</style></head><body data-drs-complete-email="true" style="margin:0;padding:0;background:#FFFFFF;font-family:${font};color:${palette.ink};">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(trip ? `${trip.title} — ${thanks.heading}` : thanks.heading)}</div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FFFFFF;"><tr><td class="outer" align="center" style="padding:32px 12px;">
      <!--[if mso]><table role="presentation" width="640" align="center"><tr><td><![endif]-->
      <table role="presentation" width="640" cellspacing="0" cellpadding="0" dir="${rtl ? "rtl" : "ltr"}" style="width:100%;max-width:640px;background:#FFFFFF;">
        <tr><td class="gutter" style="padding:24px 42px;border-top:4px solid ${palette.accent};"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td><a class="masthead" href="${site}${localePath(locale, "/")}" style="text-decoration:none;"><img src="${site}/brand/dailyredsea-wordmark-email.png" width="190" height="29" alt="dailyredsea.com" style="display:block;width:190px;max-width:100%;height:auto;border:0;"></a></td><td align="${rtl ? "left" : "right"}" style="font-size:10px;line-height:16px;color:#767975;">${escapeHtml(thanks.memory)}</td></tr></table></td></tr>
        ${hero ? `<tr><td><a href="${escapeHtml(tripUrl || site)}" style="text-decoration:none;"><img class="hero" src="${escapeHtml(hero)}" width="640" height="310" alt="${escapeHtml(trip!.title)}" style="display:block;width:100%;max-width:640px;height:310px;object-fit:cover;border:0;"></a></td></tr>` : ""}
        <tr><td class="gutter section" style="padding:34px 42px 36px;">
          ${trip ? `<p style="${eyebrow}">${escapeHtml(trip.destination)} &nbsp; / &nbsp; DAILY RED SEA</p>` : ""}
          <h1 class="headline" style="margin:0 0 22px;max-width:520px;font-family:${font};font-weight:800;font-size:42px;line-height:48px;letter-spacing:${rtl ? "0" : "-1.2px"};color:${palette.ink};">${escapeHtml(thanks.heading)}</h1>
          ${trip ? `<p style="margin:0 0 27px;padding:0 0 23px;border-bottom:1px solid #DEDCD5;font-size:14px;line-height:23px;">${tripUrl ? `<a href="${escapeHtml(tripUrl)}" style="color:${palette.ink};text-decoration:none;">${escapeHtml(trip.title)}</a>` : escapeHtml(trip.title)}</p>` : ""}
          <p style="${paragraph}color:${palette.ink};">${escapeHtml(input.customerName)},</p><p style="${paragraph}margin-bottom:0;">${escapeHtml(thanks.intro)}</p>
        </td></tr>
        <tr><td class="gutter section" style="padding:0 42px 37px;"><h2 style="margin:0 0 12px;font-family:${font};font-weight:800;font-size:26px;line-height:34px;letter-spacing:${rtl ? "0" : "-0.5px"};color:${palette.ink};">${escapeHtml(thanks.reviews)}</h2><p style="${paragraph}margin-bottom:23px;">${escapeHtml(thanks.reviewIntro)}</p>
          <table role="presentation" cellspacing="0" cellpadding="0"><tr>${reviewButton(thanks.siteReview, reviewUrl, true, 0)}${reviewButton(thanks.googleReview, googleReviewUrl, false, 1)}</tr></table>
          <p style="margin:16px 0 0;font-size:11px;line-height:18px;color:#747A78;">${escapeHtml(thanks.independent)}</p>
        </td></tr>
        <tr><td class="gutter" style="padding:0 42px 8px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#142D3B;border-radius:14px;"><tr><td class="referral-box" style="padding:24px 26px 22px;color:#ffffff;">
          <h2 style="margin:0 0 14px;font-size:11px;line-height:20px;font-weight:bold;letter-spacing:${rtl || locale === "zh" ? "0" : "1.8px"};color:#F1D4AB;">${escapeHtml(copy.heading)}</h2>
          <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 14px;"><tr><td valign="top" style="padding-${rtl ? "left" : "right"}:18px;"><p class="referral-number" dir="ltr" style="margin:0;font-family:${font};font-size:40px;line-height:44px;font-weight:800;letter-spacing:-1.5px;color:#F5E9D7;">5<span style="font-size:24px;">%</span></p><p style="margin:2px 0 0;font-size:11px;line-height:17px;color:#D2DDD9;">${escapeHtml(thanks.give)}</p></td><td valign="top" style="padding:6px 18px 0;font-family:${font};font-size:22px;color:#6D8791;">+</td><td valign="top"><p class="referral-number" dir="ltr" style="margin:0;font-family:${font};font-size:40px;line-height:44px;font-weight:800;letter-spacing:-1.5px;color:${palette.light};">5<span style="font-size:24px;">%</span></p><p style="margin:2px 0 0;font-size:11px;line-height:17px;color:#D2DDD9;">${escapeHtml(thanks.earn)}</p></td></tr></table>
          <p style="margin:0 0 16px;font-size:13px;line-height:21px;color:#D2DDD9;">${escapeHtml(input.qualified ? copy.tagline : program.locked)}</p>
          ${personalUrl ? `<p style="margin:0 0 14px;">${button(copy.shareWhatsapp, whatsapp!, true)}</p><p style="margin:0 0 5px;font-size:11px;line-height:18px;color:#B6C8CB;">${escapeHtml(copy.copyLink)}</p><p dir="ltr" style="margin:0 0 14px;overflow-wrap:anywhere;word-break:break-all;"><a href="${escapeHtml(personalUrl)}" style="color:#FFFFFF;font-size:12px;line-height:20px;">${escapeHtml(personalUrl)}</a></p>` : ""}
          <p style="margin:0 0 14px;"><a href="${escapeHtml(accountUrl)}" style="color:#F5E9D7;font-weight:bold;font-size:12px;line-height:20px;">${escapeHtml(program.viewRewards)} &nbsp;${arrow}</a></p><p style="margin:0;padding-top:12px;border-top:1px solid #3C5360;font-size:10px;line-height:16px;color:#B6C8CB;">${escapeHtml(program.terms)}</p>
        </td></tr></table></td></tr>
        ${related.length ? `<tr><td class="gutter section" style="padding:38px 42px 14px;"><p style="${eyebrow}">${escapeHtml(trip!.destination)}</p><h2 style="margin:0 0 25px;font-family:${font};font-weight:800;font-size:26px;line-height:34px;letter-spacing:${rtl ? "0" : "-0.5px"};color:${palette.ink};">${escapeHtml(thanks.next(trip!.destination))}</h2><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="table-layout:fixed;"><tr>${related.map((item, index) => `<td class="stack recommendation" width="50%" valign="top" style="width:50%;padding:${index === 0 ? "0 9px 20px 0" : "0 0 20px 9px"};">${safeUrl(item.image) ? `<a href="${escapeHtml(safeUrl(item.url))}"><img src="${escapeHtml(safeUrl(item.image))}" alt="${escapeHtml(item.title)}" width="269" height="150" style="display:block;width:100%;height:150px;object-fit:cover;border:0;margin:0 0 16px;"></a>` : ""}<h3 style="margin:0 0 13px;font-family:${font};font-weight:bold;font-size:18px;line-height:25px;color:${palette.ink};">${escapeHtml(item.title)}</h3><a href="${escapeHtml(safeUrl(item.url))}" style="color:${palette.accent};font-size:12px;line-height:20px;font-weight:bold;text-decoration:underline;">${escapeHtml(thanks.explore)} &nbsp;${arrow}</a></td>`).join("")}</tr></table></td></tr>` : ""}
        <tr><td class="gutter" style="padding:28px 42px 32px;background:#FFFFFF;border-top:1px solid #DEDCD5;"><p style="margin:0 0 18px;font-family:${font};font-weight:600;font-size:17px;line-height:27px;color:${palette.ink};">${escapeHtml(thanks.signoff).replace(/\n/g, "<br>")}</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td><a href="${site}${localePath(locale, "/")}" style="color:#6C7977;font-size:11px;letter-spacing:1px;text-decoration:none;">dailyredsea.com</a></td><td align="${rtl ? "left" : "right"}" style="color:${palette.accent};font-size:23px;">&#10038;</td></tr></table></td></tr>
      </table><!--[if mso]></td></tr></table><![endif]--></td></tr></table></body></html>`;
    const lines = [input.customerName, subject, ...(trip ? [trip.title, trip.destination, ...(tripUrl ? [tripUrl] : [])] : []), thanks.intro, thanks.reviews, thanks.reviewIntro, `${thanks.siteReview}: ${reviewUrl}`, `${thanks.googleReview}: ${googleReviewUrl}`, thanks.independent, copy.heading, inviteCopy[locale], input.qualified ? copy.tagline : program.locked, program.terms, ...(personalUrl ? [`${copy.copyLink}: ${personalUrl}`, `${copy.shareWhatsapp}: ${whatsapp}`] : []), `${program.viewRewards}: ${accountUrl}`, ...(related.length ? [thanks.next(trip!.destination), ...related.map(item => `${item.title}: ${safeUrl(item.url)}`)] : []), thanks.signoff];
    return { subject, html, text: lines.join("\n\n") };
  }
  const lines = [input.customerName, subject, ...(input.event === "reward_earned" ? [note.balance(Math.max(0, input.balanceUnits || 0) * 5)] : []), copy.heading, inviteCopy[locale], input.qualified ? copy.tagline : program.locked, program.terms, ...(personalUrl ? [`${copy.copyLink}: ${personalUrl}`, `${copy.shareWhatsapp}: ${whatsapp}`] : []), `${program.viewRewards}: ${accountUrl}`];
  const html = `<div dir="${locale === "ar" ? "rtl" : "ltr"}" lang="${locale}"><p>${escapeHtml(input.customerName)}</p><h2>${escapeHtml(subject)}</h2>${input.event === "reward_earned" ? `<p>${escapeHtml(note.balance(Math.max(0, input.balanceUnits || 0) * 5))}</p>` : ""}<h3>${escapeHtml(copy.heading)}</h3><p>${escapeHtml(inviteCopy[locale])}</p><p>${escapeHtml(input.qualified ? copy.tagline : program.locked)}</p><p>${escapeHtml(program.terms)}</p>${personalUrl ? `<p><a style="${buttonStyle}" href="${escapeHtml(whatsapp!)}">${escapeHtml(copy.shareWhatsapp)}</a></p><p>${escapeHtml(copy.copyLink)}: <a href="${escapeHtml(personalUrl)}">${escapeHtml(personalUrl)}</a></p>` : ""}<p><a style="${buttonStyle}" href="${accountUrl}">${escapeHtml(program.viewRewards)}</a></p></div>`;
  return { subject, html, text: lines.join("\n\n") };
}
