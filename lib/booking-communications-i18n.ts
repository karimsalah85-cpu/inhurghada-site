import { referralNotificationCopy } from "@/lib/referral-notification-copy";
import { referralCopy, referralProgramCopy } from "@/lib/referral-i18n";
import { isLocale, localePath, type Locale } from "@/lib/i18n";

export function bookingLocale(value?: string | null): Locale {
  return value && isLocale(value) ? value : "en";
}

type EmailCopy = {
  direction: "ltr" | "rtl";
  confirmationSubject: string;
  confirmationIntro: string;
  reference: string;
  pickup: string;
  greeting: string;
  thankYouSubject: string;
  thankYouMessage: string;
  review: string;
  closing: string;
  details: string;
  experience: string;
  date: string;
  time: string;
  travelers: string;
  meetingPoint: string;
  total: string;
  attachment: string;
  support: string;
};

const copy: Record<Locale, EmailCopy> = {
  en: { direction: "ltr", confirmationSubject: "Your booking confirmation", confirmationIntro: "We received your booking. Payment is cash on arrival; no online payment was collected.", reference: "Reference", pickup: "We will confirm the final pickup or meeting-point details by WhatsApp.", greeting: "Hello", thankYouSubject: "Thank you for travelling with Daily Red Sea", thankYouMessage: "We hope you enjoyed your experience with us.", review: "We would love to hear about your trip. You can reply to this email with your feedback.", closing: "Thank you for choosing Daily Red Sea.", details: "Booking details", experience: "Experience", date: "Date", time: "Departure time", travelers: "Travelers", meetingPoint: "Pickup / meeting point", total: "Total to pay", attachment: "Your complete booking confirmation and cancellation policy are attached as a PDF.", support: "Need help? Reply to this email or contact us on WhatsApp." },
  de: { direction: "ltr", confirmationSubject: "Deine Buchungsbestätigung", confirmationIntro: "Wir haben deine Buchung erhalten. Die Zahlung erfolgt bar vor Ort; es wurde keine Online-Zahlung eingezogen.", reference: "Buchungsnummer", pickup: "Wir bestätigen die endgültigen Abhol- oder Treffpunktdetails per WhatsApp.", greeting: "Hallo", thankYouSubject: "Danke, dass du mit Daily Red Sea unterwegs warst", thankYouMessage: "Wir hoffen, dass dir dein Erlebnis mit uns gefallen hat.", review: "Wir freuen uns über dein Feedback. Antworte einfach auf diese E-Mail.", closing: "Vielen Dank, dass du Daily Red Sea gewählt hast.", details: "Buchungsdetails", experience: "Erlebnis", date: "Datum", time: "Abfahrtszeit", travelers: "Reisende", meetingPoint: "Abholung / Treffpunkt", total: "Gesamtbetrag", attachment: "Die vollständige Buchungsbestätigung und die Stornierungsbedingungen findest du im angehängten PDF.", support: "Du brauchst Hilfe? Antworte auf diese E-Mail oder kontaktiere uns über WhatsApp." },
  ru: { direction: "ltr", confirmationSubject: "Подтверждение бронирования", confirmationIntro: "Мы получили ваше бронирование. Оплата производится наличными на месте; онлайн-оплата не взималась.", reference: "Номер бронирования", pickup: "Окончательные детали трансфера или места встречи мы подтвердим в WhatsApp.", greeting: "Здравствуйте", thankYouSubject: "Спасибо, что выбрали Daily Red Sea", thankYouMessage: "Надеемся, вам понравилась поездка с нами.", review: "Будем рады вашему отзыву — просто ответьте на это письмо.", closing: "Спасибо, что путешествовали с Daily Red Sea.", details: "Детали бронирования", experience: "Поездка", date: "Дата", time: "Время отправления", travelers: "Участники", meetingPoint: "Трансфер / место встречи", total: "Итого к оплате", attachment: "Полное подтверждение и условия отмены находятся в приложенном PDF.", support: "Нужна помощь? Ответьте на это письмо или свяжитесь с нами в WhatsApp." },
  ar: { direction: "rtl", confirmationSubject: "تأكيد الحجز", confirmationIntro: "تم استلام حجزك. يتم الدفع نقداً عند الوصول، ولم يتم تحصيل أي دفعة عبر الإنترنت.", reference: "رقم الحجز", pickup: "سنؤكد تفاصيل الاستلام أو نقطة التجمع النهائية عبر واتساب.", greeting: "مرحباً", thankYouSubject: "شكراً لاختيارك ديلي رد سي", thankYouMessage: "نأمل أن تكون قد استمتعت برحلتك معنا.", review: "يسعدنا معرفة رأيك. يمكنك الرد مباشرة على هذا البريد الإلكتروني.", closing: "شكراً لاختيارك ديلي رد سي.", details: "تفاصيل الحجز", experience: "الرحلة", date: "التاريخ", time: "وقت المغادرة", travelers: "المسافرون", meetingPoint: "الاستلام / نقطة التجمع", total: "إجمالي المبلغ", attachment: "ستجد تأكيد الحجز الكامل وسياسة الإلغاء في ملف PDF المرفق.", support: "هل تحتاج إلى مساعدة؟ رد على هذا البريد أو تواصل معنا عبر واتساب." },
  pl: { direction: "ltr", confirmationSubject: "Potwierdzenie rezerwacji", confirmationIntro: "Otrzymaliśmy Twoją rezerwację. Płatność gotówką na miejscu; nie pobrano płatności online.", reference: "Numer rezerwacji", pickup: "Ostateczne szczegóły odbioru lub miejsca spotkania potwierdzimy przez WhatsApp.", greeting: "Dzień dobry", thankYouSubject: "Dziękujemy za podróż z Daily Red Sea", thankYouMessage: "Mamy nadzieję, że wycieczka z nami była udana.", review: "Chętnie poznamy Twoją opinię. Wystarczy odpowiedzieć na tę wiadomość.", closing: "Dziękujemy za wybranie Daily Red Sea.", details: "Szczegóły rezerwacji", experience: "Wycieczka", date: "Data", time: "Godzina wyjazdu", travelers: "Uczestnicy", meetingPoint: "Odbiór / miejsce spotkania", total: "Do zapłaty", attachment: "Pełne potwierdzenie oraz zasady anulowania znajdują się w załączonym pliku PDF.", support: "Potrzebujesz pomocy? Odpowiedz na tę wiadomość lub skontaktuj się z nami przez WhatsApp." },
  zh: { direction: "ltr", confirmationSubject: "您的预订确认", confirmationIntro: "我们已收到您的预订。费用于到场时以现金支付，未收取在线付款。", reference: "预订编号", pickup: "我们将通过 WhatsApp 确认最终接送或集合地点详情。", greeting: "您好", thankYouSubject: "感谢您选择 Daily Red Sea", thankYouMessage: "希望您享受了这次旅程。", review: "我们很乐意听取您的意见，您可以直接回复此邮件。", closing: "感谢您选择 Daily Red Sea。", details: "预订详情", experience: "行程", date: "日期", time: "出发时间", travelers: "出行人数", meetingPoint: "接送 / 集合地点", total: "应付总额", attachment: "完整预订确认及取消政策请见随附 PDF。", support: "需要帮助？请回复此邮件或通过 WhatsApp 联系我们。" },
};

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] || character);

export type ConfirmationTicket = { label: string; url: string; imageSrc: string };

const ticketCopy: Record<Locale, { eyebrow: string; heading: string; ticket: string; ticketIntro: string; openTicket: string; whatsapp: string; signoff: string }> = {
  en: { eyebrow: "Booking received", heading: "You're booked. See you on the Red Sea.", ticket: "Trip ticket", ticketIntro: "Show this QR code to your guide or driver on the day. Each trip has its own ticket.", openTicket: "Open ticket", whatsapp: "Chat on WhatsApp", signoff: "See you soon,\nThe Daily Red Sea team" },
  de: { eyebrow: "Buchung erhalten", heading: "Du bist gebucht. Wir sehen uns am Roten Meer.", ticket: "Ausflugsticket", ticketIntro: "Zeige diesen QR-Code am Tag des Ausflugs deinem Guide oder Fahrer. Jeder Ausflug hat ein eigenes Ticket.", openTicket: "Ticket öffnen", whatsapp: "Auf WhatsApp schreiben", signoff: "Bis bald,\ndein Daily Red Sea Team" },
  ru: { eyebrow: "Бронирование получено", heading: "Вы забронировали. До встречи на Красном море.", ticket: "Билет на поездку", ticketIntro: "Покажите этот QR-код гиду или водителю в день поездки. У каждой поездки свой билет.", openTicket: "Открыть билет", whatsapp: "Написать в WhatsApp", signoff: "До скорой встречи,\nкоманда Daily Red Sea" },
  ar: { eyebrow: "تم استلام الحجز", heading: "تم حجزك. نراك على البحر الأحمر.", ticket: "تذكرة الرحلة", ticketIntro: "أظهر رمز QR هذا للمرشد أو السائق في يوم الرحلة. لكل رحلة تذكرة خاصة بها.", openTicket: "فتح التذكرة", whatsapp: "تواصل عبر واتساب", signoff: "نراك قريباً،\nفريق ديلي رد سي" },
  pl: { eyebrow: "Rezerwacja przyjęta", heading: "Masz rezerwację. Do zobaczenia nad Morzem Czerwonym.", ticket: "Bilet na wycieczkę", ticketIntro: "Pokaż ten kod QR przewodnikowi lub kierowcy w dniu wycieczki. Każda wycieczka ma własny bilet.", openTicket: "Otwórz bilet", whatsapp: "Napisz na WhatsApp", signoff: "Do zobaczenia,\nzespół Daily Red Sea" },
  zh: { eyebrow: "已收到预订", heading: "预订成功，红海见。", ticket: "行程票券", ticketIntro: "请在行程当天向导游或司机出示此二维码。每个行程都有独立票券。", openTicket: "打开票券", whatsapp: "通过 WhatsApp 联系", signoff: "期待与您相见，\nDaily Red Sea 团队" },
};

export function buildCustomerConfirmationEmail(input: { locale?: string | null; customerName: string; reference: string; itemName?: string; date?: string; time?: string; travelers?: string; pickup?: string; amount?: number; currency?: string; tickets?: ConfirmationTicket[]; whatsappUrl?: string }) {
  const locale = bookingLocale(input.locale);
  const t = copy[locale];
  return {
    subject: `${t.confirmationSubject}: ${input.reference}`,
    html: buildConfirmationHtml(input, locale, t),
  };
}

/** Same editorial theme as the post-trip thank-you email (lib/referral-messages.ts). */
function buildConfirmationHtml(input: Parameters<typeof buildCustomerConfirmationEmail>[0], locale: Locale, t: EmailCopy) {
  const k = ticketCopy[locale];
  const site = "https://dailyredsea.com";
  const rtl = t.direction === "rtl";
  const palette = { ink: "#123E47", accent: "#167580", tint: "#E7F1EF", light: "#9ED6CF", line: "#DEDCD5", body: "#596467" };
  const font = rtl ? "'Noto Kufi Arabic',Tahoma,Arial,sans-serif" : "Manrope,'Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif";
  const arrow = rtl ? "&larr;" : "&rarr;";
  const spacing = rtl || locale === "zh" ? "0" : "1.8px";
  const eyebrow = `margin:0 0 12px;font-size:10px;line-height:16px;font-weight:bold;letter-spacing:${spacing};text-transform:uppercase;color:${palette.accent}`;
  const paragraph = `margin:0 0 16px;font-size:15px;line-height:25px;color:${palette.body};`;
  const safeUrl = (value: string | undefined) => { if (!value) return ""; try { const url = new URL(value, site); return ["https:", "cid:"].includes(url.protocol) ? value : ""; } catch { return value.startsWith("cid:") ? value : ""; } };
  const rows = [
    [t.experience, input.itemName], [t.date, input.date], [t.time, input.time],
    [t.travelers, input.travelers], [t.meetingPoint, input.pickup],
  ].filter((row): row is [string, string] => Boolean(row[1]));
  let money = "";
  if (input.amount !== undefined && input.currency) {
    try { money = new Intl.NumberFormat(locale, { style: "currency", currency: input.currency.toUpperCase() }).format(input.amount); } catch { money = `${input.amount.toFixed(2)} ${input.currency.toUpperCase()}`; }
  }
  const rowHtml = rows.map(([label, value]) => `<tr><td style="padding:12px 0;border-bottom:1px solid ${palette.line};font-size:12px;line-height:18px;color:#747A78;width:38%;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:12px 0;border-bottom:1px solid ${palette.line};font-size:15px;line-height:22px;font-weight:bold;color:${palette.ink};vertical-align:top;">${escapeHtml(value)}</td></tr>`).join("");
  const tickets = (input.tickets || []).filter((ticket) => safeUrl(ticket.url) && safeUrl(ticket.imageSrc));
  const ticketHtml = tickets.map((ticket, index) => `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 14px;background:${palette.tint};border-radius:14px;"><tr>
      <td class="stack ticket-text" valign="middle" style="padding:20px 22px;">
        <p style="margin:0 0 6px;font-size:10px;line-height:16px;font-weight:bold;letter-spacing:${spacing};text-transform:uppercase;color:${palette.accent};">${escapeHtml(k.ticket)}${tickets.length > 1 ? ` ${index + 1} / ${tickets.length}` : ""}</p>
        <p style="margin:0 0 10px;font-family:${font};font-size:18px;line-height:25px;font-weight:800;color:${palette.ink};">${escapeHtml(ticket.label)}</p>
        <p dir="ltr" style="margin:0 0 14px;font-size:12px;line-height:18px;color:${palette.body};${rtl ? "text-align:right;" : ""}">${escapeHtml(input.reference)}</p>
        <a href="${escapeHtml(ticket.url)}" style="color:${palette.ink};font-size:12px;line-height:20px;font-weight:bold;text-decoration:underline;">${escapeHtml(k.openTicket)} &nbsp;${arrow}</a>
      </td>
      <td class="stack ticket-qr" width="150" valign="middle" align="center" style="width:150px;padding:16px;"><a href="${escapeHtml(ticket.url)}"><img src="${escapeHtml(ticket.imageSrc)}" width="132" height="132" alt="${escapeHtml(`${k.ticket} ${input.reference}`)}" style="display:block;width:132px;height:132px;border:6px solid #FFFFFF;border-radius:6px;background:#FFFFFF;"></a></td>
    </tr></table>`).join("");
  const whatsapp = safeUrl(input.whatsappUrl);
  return `<!doctype html><html lang="${locale}" dir="${t.direction}"><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;800&family=Noto+Kufi+Arabic:wght@400;700&display=swap" rel="stylesheet"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeHtml(t.confirmationSubject)}</title><style>body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}img{-ms-interpolation-mode:bicubic}a{word-wrap:break-word}@media screen and (max-width:520px){.outer{padding:0!important}.gutter{padding-left:25px!important;padding-right:25px!important}.headline{font-size:34px!important;line-height:40px!important}.stack{display:block!important;width:100%!important;box-sizing:border-box!important}.ticket-qr{padding:0 22px 22px!important;text-align:${rtl ? "right" : "left"}!important}.masthead img{width:160px!important}.section{padding-top:30px!important;padding-bottom:30px!important}}</style></head><body data-drs-complete-email="true" style="margin:0;padding:0;background:#FFFFFF;font-family:${font};color:${palette.ink};">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(`${input.itemName ? `${input.itemName} · ` : ""}${input.reference}`)}</div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FFFFFF;"><tr><td class="outer" align="center" style="padding:32px 12px;">
      <!--[if mso]><table role="presentation" width="640" align="center"><tr><td><![endif]-->
      <table role="presentation" width="640" cellspacing="0" cellpadding="0" dir="${t.direction}" style="width:100%;max-width:640px;background:#FFFFFF;">
        <tr><td class="gutter" style="padding:24px 42px;border-top:4px solid ${palette.accent};"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td><a class="masthead" href="${site}${localePath(locale, "/")}" style="text-decoration:none;"><img src="${site}/brand/dailyredsea-wordmark-email.png" width="190" height="29" alt="dailyredsea.com" style="display:block;width:190px;max-width:100%;height:auto;border:0;"></a></td><td align="${rtl ? "left" : "right"}" dir="ltr" style="font-size:10px;line-height:16px;color:#767975;">${escapeHtml(input.reference)}</td></tr></table></td></tr>
        <tr><td class="gutter section" style="padding:30px 42px 30px;">
          <p style="${eyebrow}">${escapeHtml(k.eyebrow)} &nbsp; / &nbsp; DAILY RED SEA</p>
          <h1 class="headline" style="margin:0 0 22px;max-width:540px;font-family:${font};font-weight:800;font-size:40px;line-height:46px;letter-spacing:${rtl ? "0" : "-1.2px"};color:${palette.ink};">${escapeHtml(k.heading)}</h1>
          <p style="${paragraph}color:${palette.ink};">${escapeHtml(t.greeting)} ${escapeHtml(input.customerName)},</p>
          <p style="${paragraph}margin-bottom:0;">${escapeHtml(t.confirmationIntro)}</p>
        </td></tr>
        ${ticketHtml ? `<tr><td class="gutter" style="padding:0 42px 22px;"><p style="margin:0 0 14px;font-size:13px;line-height:21px;color:${palette.body};">${escapeHtml(k.ticketIntro)}</p>${ticketHtml}</td></tr>` : ""}
        <tr><td class="gutter section" style="padding:16px 42px 30px;"><h2 style="margin:0 0 6px;font-family:${font};font-weight:800;font-size:24px;line-height:32px;letter-spacing:${rtl ? "0" : "-0.5px"};color:${palette.ink};">${escapeHtml(t.details)}</h2>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
            <tr><td style="padding:12px 0;border-bottom:1px solid ${palette.line};font-size:12px;line-height:18px;color:#747A78;width:38%;">${escapeHtml(t.reference)}</td><td dir="ltr" style="padding:12px 0;border-bottom:1px solid ${palette.line};font-size:15px;line-height:22px;font-weight:bold;color:${palette.ink};${rtl ? "text-align:right;" : ""}">${escapeHtml(input.reference)}</td></tr>
            ${rowHtml}
            ${money ? `<tr><td style="padding:16px 0 4px;font-size:12px;line-height:18px;color:#747A78;">${escapeHtml(t.total)}</td><td style="padding:16px 0 4px;font-family:${font};font-size:26px;line-height:32px;font-weight:800;color:${palette.ink};">${escapeHtml(money)}</td></tr>` : ""}
          </table>
        </td></tr>
        <tr><td class="gutter" style="padding:0 42px 30px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#142D3B;border-radius:14px;"><tr><td style="padding:24px 26px 22px;color:#FFFFFF;">
          <p style="margin:0 0 10px;font-size:14px;line-height:23px;color:#D2DDD9;">${escapeHtml(t.pickup)}</p>
          <p style="margin:0 0 ${whatsapp ? "18px" : "0"};font-size:12px;line-height:20px;color:#B6C8CB;">${escapeHtml(t.attachment)} ${escapeHtml(t.support)}</p>
          ${whatsapp ? `<a href="${escapeHtml(whatsapp)}" style="display:inline-block;padding:13px 19px;background:#F5E9D7;border:1px solid #F5E9D7;color:#142D3B;text-decoration:none;font-size:13px;font-weight:bold;line-height:20px;border-radius:999px;">${escapeHtml(k.whatsapp)} &nbsp;${arrow}</a>` : ""}
        </td></tr></table></td></tr>
        <tr><td class="gutter" style="padding:26px 42px 32px;border-top:1px solid ${palette.line};"><p style="margin:0 0 14px;font-family:${font};font-weight:600;font-size:17px;line-height:27px;color:${palette.ink};">${escapeHtml(k.signoff).replace(/\n/g, "<br>")}</p><p style="margin:0 0 16px;font-size:11px;line-height:18px;color:#747A78;">${escapeHtml(referralProgramCopy[locale].locked)}</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td><a href="${site}${localePath(locale, "/")}" style="color:#6C7977;font-size:11px;letter-spacing:1px;text-decoration:none;">dailyredsea.com</a> &nbsp;·&nbsp; <a href="mailto:info@dailyredsea.com" style="color:#6C7977;font-size:11px;text-decoration:none;">info@dailyredsea.com</a></td><td align="${rtl ? "left" : "right"}" style="color:${palette.accent};font-size:23px;">&#10038;</td></tr></table></td></tr>
      </table><!--[if mso]></td></tr></table><![endif]--></td></tr></table></body></html>`;
}

export function buildThankYouEmail(input: { locale?: string | null; customerName: string; reference: string; tourName?: string | null }) {
  const locale = bookingLocale(input.locale);
  const t = copy[locale];
  return {
    subject: `${t.thankYouSubject} · ${input.reference}`,
    html: `<div dir="${t.direction}" lang="${locale}"><p>${t.greeting} ${escapeHtml(input.customerName)},</p><p>${t.thankYouMessage}</p>${input.tourName ? `<p>${escapeHtml(input.tourName)}</p>` : ""}<p><a href="https://dailyredsea.com/reviews?lang=${locale}&amp;ref=${encodeURIComponent(input.reference)}">${escapeHtml(referralNotificationCopy[locale].review)}</a></p><h3>${escapeHtml(referralCopy[locale].heading)}</h3><p>${escapeHtml(referralCopy[locale].tagline)}</p><p><a href="https://dailyredsea.com${localePath(locale, "/referrals")}">${escapeHtml(referralProgramCopy[locale].viewRewards)}</a></p><p>${t.closing}</p></div>`,
  };
}
