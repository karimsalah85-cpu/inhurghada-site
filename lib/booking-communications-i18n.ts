import { isLocale, type Locale } from "@/lib/i18n";

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

export function buildCustomerConfirmationEmail(input: { locale?: string | null; customerName: string; reference: string; itemName?: string; date?: string; time?: string; travelers?: string; pickup?: string; amount?: number; currency?: string }) {
  const locale = bookingLocale(input.locale);
  const t = copy[locale];
  return {
    subject: `${t.confirmationSubject}: ${input.reference}`,
    html: buildConfirmationHtml(input, locale, t),
  };
}

function buildConfirmationHtml(input: Parameters<typeof buildCustomerConfirmationEmail>[0], locale: Locale, t: EmailCopy) {
  const rows = [
    [t.experience, input.itemName], [t.date, input.date], [t.time, input.time],
    [t.travelers, input.travelers], [t.meetingPoint, input.pickup],
  ].filter((row): row is [string, string] => Boolean(row[1]));
  const money = input.amount !== undefined && input.currency
    ? new Intl.NumberFormat(locale, { style: "currency", currency: input.currency.toUpperCase() }).format(input.amount)
    : "";
  const rowHtml = rows.map(([label, value]) => `<tr><td style="padding:8px 12px;color:#64748b;font-size:13px;vertical-align:top">${escapeHtml(label)}</td><td style="padding:8px 12px;color:#0f172a;font-size:14px;font-weight:600;vertical-align:top">${escapeHtml(value)}</td></tr>`).join("");
  return `<div data-drs-complete-email="true" dir="${t.direction}" lang="${locale}" style="margin:0;background:#f1f5f9;padding:24px;font-family:Arial,sans-serif;color:#0f172a"><div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden"><div style="background:#0d3b78;border-bottom:5px solid #ff3300;padding:26px 30px;color:#ffffff"><div style="font-size:24px;font-weight:700">Daily Red Sea</div><div style="margin-top:8px;font-size:18px">${escapeHtml(t.confirmationSubject)}</div></div><div style="padding:28px 30px"><p style="margin:0 0 16px;font-size:16px">${t.greeting} ${escapeHtml(input.customerName)},</p><p style="margin:0 0 20px;line-height:1.6;color:#334155">${t.confirmationIntro}</p><div style="background:#eff6ff;border-radius:10px;padding:14px 16px;margin-bottom:20px"><span style="color:#64748b">${t.reference}: </span><strong style="color:#0d3b78">${escapeHtml(input.reference)}</strong></div><h2 style="font-size:17px;margin:0 0 10px;color:#0d3b78">${t.details}</h2><table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:10px">${rowHtml}${money ? `<tr><td style="padding:12px;color:#64748b;border-top:1px solid #e2e8f0">${t.total}</td><td style="padding:12px;color:#e2380f;font-size:20px;font-weight:700;border-top:1px solid #e2e8f0">${escapeHtml(money)}</td></tr>` : ""}</table><p style="margin:20px 0 8px;line-height:1.6;color:#334155">${t.pickup}</p><p style="margin:0 0 8px;line-height:1.6;color:#334155">${t.attachment}</p><p style="margin:0;line-height:1.6;color:#334155">${t.support}</p></div><div style="background:#f8fafc;padding:18px 30px;color:#64748b;font-size:13px"><strong style="color:#0d3b78">Daily Red Sea</strong><br><a href="https://dailyredsea.com" style="color:#0d3b78">dailyredsea.com</a> &nbsp;|&nbsp; <a href="mailto:info@dailyredsea.com" style="color:#0d3b78">info@dailyredsea.com</a></div></div></div>`;
}

export function buildThankYouEmail(input: { locale?: string | null; customerName: string; reference: string; tourName?: string | null }) {
  const locale = bookingLocale(input.locale);
  const t = copy[locale];
  return {
    subject: `${t.thankYouSubject} · ${input.reference}`,
    html: `<div dir="${t.direction}" lang="${locale}"><p>${t.greeting} ${escapeHtml(input.customerName)},</p><p>${t.thankYouMessage}</p>${input.tourName ? `<p>${escapeHtml(input.tourName)}</p>` : ""}<p>${t.review}</p><p>${t.closing}</p></div>`,
  };
}
