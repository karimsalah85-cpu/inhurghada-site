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
};

const copy: Record<Locale, EmailCopy> = {
  en: { direction: "ltr", confirmationSubject: "Your booking confirmation", confirmationIntro: "Your booking summary is attached. Payment is cash on arrival.", reference: "Reference", pickup: "We will confirm pickup details by WhatsApp.", greeting: "Hello", thankYouSubject: "Thank you for travelling with Daily Red Sea", thankYouMessage: "We hope you enjoyed your experience with us.", review: "We would love to hear about your trip. You can reply to this email with your feedback.", closing: "Thank you for choosing Daily Red Sea." },
  de: { direction: "ltr", confirmationSubject: "Deine Buchungsbestätigung", confirmationIntro: "Deine Buchungsübersicht ist als PDF angehängt. Die Zahlung erfolgt bar bei Ankunft.", reference: "Buchungsnummer", pickup: "Wir bestätigen die Abholdetails per WhatsApp.", greeting: "Hallo", thankYouSubject: "Danke, dass du mit Daily Red Sea unterwegs warst", thankYouMessage: "Wir hoffen, dass dir dein Erlebnis mit uns gefallen hat.", review: "Wir freuen uns über dein Feedback. Antworte einfach auf diese E-Mail.", closing: "Vielen Dank, dass du Daily Red Sea gewählt hast." },
  ru: { direction: "ltr", confirmationSubject: "Подтверждение бронирования", confirmationIntro: "К письму приложена сводка вашего бронирования в формате PDF. Оплата производится наличными по прибытии.", reference: "Номер бронирования", pickup: "Детали трансфера мы подтвердим в WhatsApp.", greeting: "Здравствуйте", thankYouSubject: "Спасибо, что выбрали Daily Red Sea", thankYouMessage: "Надеемся, вам понравилась поездка с нами.", review: "Будем рады вашему отзыву — просто ответьте на это письмо.", closing: "Спасибо, что путешествовали с Daily Red Sea." },
  ar: { direction: "rtl", confirmationSubject: "تأكيد الحجز", confirmationIntro: "ملخص حجزك مرفق بصيغة PDF. يتم الدفع نقداً عند الوصول.", reference: "رقم الحجز", pickup: "سنؤكد تفاصيل الاستلام عبر واتساب.", greeting: "مرحباً", thankYouSubject: "شكراً لاختيارك ديلي رد سي", thankYouMessage: "نأمل أن تكون قد استمتعت برحلتك معنا.", review: "يسعدنا معرفة رأيك. يمكنك الرد مباشرة على هذا البريد الإلكتروني.", closing: "شكراً لاختيارك ديلي رد سي." },
  pl: { direction: "ltr", confirmationSubject: "Potwierdzenie rezerwacji", confirmationIntro: "Podsumowanie rezerwacji znajduje się w załączonym pliku PDF. Płatność gotówką po przyjeździe.", reference: "Numer rezerwacji", pickup: "Szczegóły odbioru potwierdzimy przez WhatsApp.", greeting: "Dzień dobry", thankYouSubject: "Dziękujemy za podróż z Daily Red Sea", thankYouMessage: "Mamy nadzieję, że wycieczka z nami była udana.", review: "Chętnie poznamy Twoją opinię. Wystarczy odpowiedzieć na tę wiadomość.", closing: "Dziękujemy za wybranie Daily Red Sea." },
  zh: { direction: "ltr", confirmationSubject: "您的预订确认", confirmationIntro: "随信附上您的预订摘要 PDF。费用于抵达时以现金支付。", reference: "预订编号", pickup: "我们将通过 WhatsApp 确认接送详情。", greeting: "您好", thankYouSubject: "感谢您选择 Daily Red Sea", thankYouMessage: "希望您享受了这次旅程。", review: "我们很乐意听取您的意见，您可以直接回复此邮件。", closing: "感谢您选择 Daily Red Sea。" },
};

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] || character);

export function buildCustomerConfirmationEmail(input: { locale?: string | null; customerName: string; reference: string }) {
  const locale = bookingLocale(input.locale);
  const t = copy[locale];
  return {
    subject: `${t.confirmationSubject}: ${input.reference}`,
    html: `<div dir="${t.direction}" lang="${locale}"><p>${t.greeting} ${escapeHtml(input.customerName)},</p><p>${t.confirmationIntro}</p><p>${t.reference}: ${escapeHtml(input.reference)}</p><p>${t.pickup}</p></div>`,
  };
}

export function buildThankYouEmail(input: { locale?: string | null; customerName: string; reference: string; tourName?: string | null }) {
  const locale = bookingLocale(input.locale);
  const t = copy[locale];
  return {
    subject: `${t.thankYouSubject} · ${input.reference}`,
    html: `<div dir="${t.direction}" lang="${locale}"><p>${t.greeting} ${escapeHtml(input.customerName)},</p><p>${t.thankYouMessage}</p>${input.tourName ? `<p>${escapeHtml(input.tourName)}</p>` : ""}<p>${t.review}</p><p>${t.closing}</p></div>`,
  };
}
