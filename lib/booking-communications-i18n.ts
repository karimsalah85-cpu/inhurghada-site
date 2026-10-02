import { referralNotificationCopy } from "@/lib/referral-notification-copy";
import { referralCopy, referralProgramCopy } from "@/lib/referral-i18n";
import { isLocale, localePath, type Locale } from "@/lib/i18n";
import { emailButton, emailDetails, emailHeading, emailIntro, emailPanel, emailParagraph, emailRow, emailSignoff, emailSite, emailTheme, emailWhatsappLabel, escapeHtml, renderEmail, safeEmailUrl, type EmailDetailRow } from "@/lib/email/layout";

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

export type ConfirmationTicket = { label: string; url: string; imageSrc: string };

const ticketCopy: Record<Locale, { eyebrow: string; heading: string; ticket: string; ticketIntro: string; openTicket: string }> = {
  en: { eyebrow: "Booking received", heading: "You're booked. See you on the Red Sea.", ticket: "Trip ticket", ticketIntro: "Show this QR code to your guide or driver on the day. Each trip has its own ticket.", openTicket: "Open ticket" },
  de: { eyebrow: "Buchung erhalten", heading: "Du bist gebucht. Wir sehen uns am Roten Meer.", ticket: "Ausflugsticket", ticketIntro: "Zeige diesen QR-Code am Tag des Ausflugs deinem Guide oder Fahrer. Jeder Ausflug hat ein eigenes Ticket.", openTicket: "Ticket öffnen" },
  ru: { eyebrow: "Бронирование получено", heading: "Вы забронировали. До встречи на Красном море.", ticket: "Билет на поездку", ticketIntro: "Покажите этот QR-код гиду или водителю в день поездки. У каждой поездки свой билет.", openTicket: "Открыть билет" },
  ar: { eyebrow: "تم استلام الحجز", heading: "تم حجزك. نراك على البحر الأحمر.", ticket: "تذكرة الرحلة", ticketIntro: "أظهر رمز QR هذا للمرشد أو السائق في يوم الرحلة. لكل رحلة تذكرة خاصة بها.", openTicket: "فتح التذكرة" },
  pl: { eyebrow: "Rezerwacja przyjęta", heading: "Masz rezerwację. Do zobaczenia nad Morzem Czerwonym.", ticket: "Bilet na wycieczkę", ticketIntro: "Pokaż ten kod QR przewodnikowi lub kierowcy w dniu wycieczki. Każda wycieczka ma własny bilet.", openTicket: "Otwórz bilet" },
  zh: { eyebrow: "已收到预订", heading: "预订成功，红海见。", ticket: "行程票券", ticketIntro: "请在行程当天向导游或司机出示此二维码。每个行程都有独立票券。", openTicket: "打开票券" },
};

export function buildCustomerConfirmationEmail(input: { locale?: string | null; customerName: string; reference: string; itemName?: string; date?: string; time?: string; travelers?: string; pickup?: string; amount?: number; currency?: string; tickets?: ConfirmationTicket[]; whatsappUrl?: string }) {
  const locale = bookingLocale(input.locale);
  const t = copy[locale];
  return {
    subject: `${t.confirmationSubject}: ${input.reference}`,
    html: buildConfirmationHtml(input, locale, t),
  };
}

/**
 * The booking-confirmation ("ticket") email. Its look is the house style for
 * every Daily Red Sea email, so it is assembled from lib/email/layout.ts — the
 * same pieces the status, referral, supplier and staff emails use. Only the
 * trip-ticket card with its QR code is specific to this message.
 */
function buildConfirmationHtml(input: Parameters<typeof buildCustomerConfirmationEmail>[0], locale: Locale, t: EmailCopy) {
  const k = ticketCopy[locale];
  const theme = emailTheme(locale);
  const { palette, font, rtl, tracking, arrow } = theme;
  const rows: EmailDetailRow[] = [
    { label: t.reference, value: input.reference, ltr: true },
    ...([
      [t.experience, input.itemName], [t.date, input.date], [t.time, input.time],
      [t.travelers, input.travelers], [t.meetingPoint, input.pickup],
    ].filter((row): row is [string, string] => Boolean(row[1])).map(([label, value]) => ({ label, value }))),
  ];
  let money = "";
  if (input.amount !== undefined && input.currency) {
    try { money = new Intl.NumberFormat(locale, { style: "currency", currency: input.currency.toUpperCase() }).format(input.amount); } catch { money = `${input.amount.toFixed(2)} ${input.currency.toUpperCase()}`; }
  }
  const tickets = (input.tickets || []).filter((ticket) => safeEmailUrl(ticket.url) && safeEmailUrl(ticket.imageSrc));
  const ticketHtml = tickets.map((ticket, index) => `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 14px;background:${palette.tint};border-radius:14px;"><tr>
      <td class="stack ticket-text" valign="middle" style="padding:20px 22px;">
        <p style="margin:0 0 6px;font-size:10px;line-height:16px;font-weight:bold;letter-spacing:${tracking};text-transform:uppercase;color:${palette.accent};">${escapeHtml(k.ticket)}${tickets.length > 1 ? ` ${index + 1} / ${tickets.length}` : ""}</p>
        <p style="margin:0 0 10px;font-family:${font};font-size:18px;line-height:25px;font-weight:800;color:${palette.ink};">${escapeHtml(ticket.label)}</p>
        <p dir="ltr" style="margin:0 0 14px;font-size:12px;line-height:18px;color:${palette.body};${rtl ? "text-align:right;" : ""}">${escapeHtml(input.reference)}</p>
        <a href="${escapeHtml(ticket.url)}" style="color:${palette.ink};font-size:12px;line-height:20px;font-weight:bold;text-decoration:underline;">${escapeHtml(k.openTicket)} &nbsp;${arrow}</a>
      </td>
      <td class="stack ticket-qr" width="150" valign="middle" align="center" style="width:150px;padding:16px;"><a href="${escapeHtml(ticket.url)}"><img src="${escapeHtml(ticket.imageSrc)}" width="132" height="132" alt="${escapeHtml(`${k.ticket} ${input.reference}`)}" style="display:block;width:132px;height:132px;border:6px solid #FFFFFF;border-radius:6px;background:#FFFFFF;"></a></td>
    </tr></table>`).join("");
  const whatsapp = safeEmailUrl(input.whatsappUrl);
  return renderEmail(theme, {
    title: t.confirmationSubject,
    preheader: `${input.itemName ? `${input.itemName} · ` : ""}${input.reference}`,
    mastheadNote: { text: input.reference, ltr: true },
    mobileCss: `.ticket-qr{padding:0 22px 22px!important;text-align:${rtl ? "right" : "left"}!important}`,
    rows: [
      emailIntro(theme, {
        eyebrow: k.eyebrow,
        headline: k.heading,
        body: [
          emailParagraph(theme, `${t.greeting} ${input.customerName},`, { strong: true }),
          emailParagraph(theme, t.confirmationIntro, { last: true }),
        ],
      }),
      ticketHtml ? emailRow(`<p style="margin:0 0 14px;font-size:13px;line-height:21px;color:${palette.body};">${escapeHtml(k.ticketIntro)}</p>${ticketHtml}`, "0 42px 22px") : "",
      emailRow(`${emailHeading(theme, t.details)}
          ${emailDetails(theme, rows, money ? { label: t.total, value: money } : undefined)}`, "16px 42px 30px", { section: true }),
      emailRow(emailPanel(theme, { lead: t.pickup, body: `${t.attachment} ${t.support}`, button: whatsapp ? { label: emailWhatsappLabel(locale), href: whatsapp } : undefined }), "0 42px 30px"),
    ],
    signoff: emailSignoff(locale, "warm"),
    footerNote: referralProgramCopy[locale].locked,
  });
}

/**
 * Short thank-you without trip context. The full post-trip message with
 * reviews, referral panel and recommendations is in lib/referral-messages.ts.
 */
export function buildThankYouEmail(input: { locale?: string | null; customerName: string; reference: string; tourName?: string | null }) {
  const locale = bookingLocale(input.locale);
  const t = copy[locale];
  const theme = emailTheme(locale);
  const reviewUrl = `${emailSite}/reviews?lang=${locale}&ref=${encodeURIComponent(input.reference)}`;
  return {
    subject: `${t.thankYouSubject} · ${input.reference}`,
    html: renderEmail(theme, {
      title: t.thankYouSubject,
      preheader: `${input.tourName ? `${input.tourName} · ` : ""}${input.reference}`,
      mastheadNote: { text: input.reference, ltr: true },
      rows: [
        emailIntro(theme, {
          eyebrow: input.tourName || undefined,
          headline: t.thankYouSubject,
          body: [
            emailParagraph(theme, `${t.greeting} ${input.customerName},`, { strong: true }),
            emailParagraph(theme, t.thankYouMessage),
            emailParagraph(theme, { html: emailButton(theme, referralNotificationCopy[locale].review, reviewUrl) }, { last: true }),
          ],
        }),
        emailRow(emailPanel(theme, { eyebrow: referralCopy[locale].heading, lead: referralCopy[locale].tagline, button: { label: referralProgramCopy[locale].viewRewards, href: `${emailSite}${localePath(locale, "/referrals")}` } }), "0 42px 30px"),
      ],
      signoff: t.closing,
    }),
  };
}
