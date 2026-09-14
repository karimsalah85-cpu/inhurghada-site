import { getCancellationPolicyParagraphs } from "@/lib/pdf-policy";
import { bookingLocale } from "@/lib/booking-communications-i18n";
import { drawPdfBrandMark } from "@/lib/pdf-logo";
import type { Locale } from "@/lib/i18n";
import PDFDocument from "pdfkit";
import { historicalTripParticipants, readPricingSnapshot, validParticipantCounts } from "@/lib/booking-pricing-snapshot";
import { statusPricingCopy } from "@/lib/status-pdf-pricing-copy";
import path from "node:path";

const notoFontPath = (locale: Locale) =>
  path.join(process.cwd(), "assets/fonts", locale === "ar" ? "NotoSansArabic.ttf" : locale === "zh" ? "NotoSansSC.ttf" : "NotoSans.ttf");

export type InvoiceData = {
  reference: string;
  issuedAt: Date;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  itemName: string;
  quantity: number;
  travelerSummary?: string;
  amount: number;
  currency: string;
  paymentMethod?: string;
  paymentId?: string;
  date?: string;
  time?: string;
  hotel?: string;
  tripLines?: string[];
  locale?: string;
};

export type BookingStatusPdfData = {
  reference: string;
  generatedAt: Date;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  itemName: string;
  date?: string;
  travelers?: string;
  guests?: number | null;
  participants?: unknown;
  pricingSnapshot?: unknown;
  subtotal?: number | null;
  discountAmount?: number | null;
  promoCode?: string | null;
  historicalNotes?: string | null;
  pickup?: string;
  amount: number;
  currency: string;
  bookingStatus: string;
  paymentStatus: string;
  assignedPersonName?: string;
  assignedPersonRole?: "guide" | "driver";
  locale?: string;
};

const confirmationCopy = {
  en: {
    confirmation: "Booking confirmation", issued: "Issued", cash: "Cash on arrival", reference: "Booking reference",
    keepReference: "Keep this reference for support.", guest: "Guest details", guestName: "Guest name", pending: "To be confirmed",
    experience: "Experience details", date: "Experience date", time: "Departure time", travelers: "Travelers", pickup: "Pickup / meeting point",
    total: "Total to pay", paymentNote: "Pay in cash on arrival. No online payment was collected.", next: "What happens next",
    steps: "Keep this confirmation. We will confirm final availability and meeting or pickup details by WhatsApp. Show your booking reference when requested.",
    thanks: "Thank you for choosing Daily Red Sea.", policy: "Cancellation and refund policy",
    policyParagraphs: getCancellationPolicyParagraphs(),
  },
  de: {
    confirmation: "Buchungsbestätigung", issued: "Ausgestellt", cash: "Barzahlung vor Ort", reference: "Buchungsnummer",
    keepReference: "Bewahre diese Nummer für Rückfragen auf.", guest: "Gastdaten", guestName: "Name", pending: "Wird noch bestätigt",
    experience: "Erlebnisdetails", date: "Datum", time: "Abfahrtszeit", travelers: "Reisende", pickup: "Abholung / Treffpunkt",
    total: "Gesamtbetrag", paymentNote: "Zahlung in bar vor Ort. Es wurde keine Online-Zahlung eingezogen.", next: "Wie geht es weiter?",
    steps: "Bewahre diese Bestätigung auf. Wir bestätigen die endgültige Verfügbarkeit und die Abhol- oder Treffpunktdetails per WhatsApp. Zeige bei Rückfragen deine Buchungsnummer.",
    thanks: "Vielen Dank, dass du Daily Red Sea gewählt hast.", policy: "Stornierungs- und Erstattungsbedingungen",
    policyParagraphs: [
      "Es gelten die Stornierungsbedingungen auf der Seite der gebuchten Aktivität. Wenn dort keine andere Frist angegeben ist, storniere mindestens 48 Stunden vor der geplanten Abholzeit, um eine vollständige Erstattung zu erhalten. Bei Barzahlung vor Ort fällt dann keine Gebühr an.",
      "Bei späteren Stornierungen, Verspätung oder Nichterscheinen besteht kein Erstattungsanspruch, da lokale Anbieter Plätze reservieren und Kosten tragen. Für private Touren, Boote mit begrenzter Kapazität und Erlebnisse von Drittanbietern können längere Fristen oder besondere Bedingungen gelten, wenn diese vor der Buchung angegeben wurden.",
      "Wenn Daily Red Sea oder der lokale Anbieter wegen Wetter, Sicherheit, zu geringer Teilnehmerzahl oder betrieblichen Gründen storniert, kannst du zwischen einer vollständigen Erstattung und einem verfügbaren Ersatztermin oder einer alternativen Aktivität wählen.",
      "Für eine Stornierung oder Änderung kontaktiere Daily Red Sea so früh wie möglich per WhatsApp und gib deine Buchungsnummer an. Genehmigte Karten- oder Online-Erstattungen erfolgen über die ursprüngliche Zahlungsmethode; Buchungen mit Barzahlung vor Ort werden nicht belastet.",
    ],
  },
  ru: {
    confirmation: "Подтверждение бронирования", issued: "Дата выдачи", cash: "Оплата наличными на месте", reference: "Номер бронирования",
    keepReference: "Сохраните этот номер для связи с поддержкой.", guest: "Данные гостя", guestName: "Имя гостя", pending: "Будет подтверждено",
    experience: "Детали поездки", date: "Дата", time: "Время отправления", travelers: "Участники", pickup: "Трансфер / место встречи",
    total: "Итого к оплате", paymentNote: "Оплата наличными на месте. Онлайн-оплата не взималась.", next: "Что дальше?",
    steps: "Сохраните это подтверждение. Мы подтвердим наличие мест и детали трансфера или места встречи в WhatsApp. При обращении назовите номер бронирования.",
    thanks: "Спасибо, что выбрали Daily Red Sea.", policy: "Условия отмены и возврата",
    policyParagraphs: [
      "К бронированию применяются условия отмены, указанные на странице выбранной экскурсии. Если другой срок не указан, отмените бронирование не менее чем за 48 часов до запланированного времени трансфера, чтобы получить полный возврат. При оплате наличными на месте плата не взимается.",
      "При поздней отмене, опоздании или неявке возврат не производится, поскольку местные поставщики резервируют места и несут расходы. Для частных туров, судов с ограниченной вместимостью и услуг сторонних операторов могут действовать более длительные сроки или особые условия, если они были указаны до бронирования.",
      "Если Daily Red Sea или местный поставщик отменяет поездку из-за погоды, безопасности, недостаточного числа участников или операционных причин, вы можете выбрать полный возврат либо доступную альтернативную дату или экскурсию.",
      "Для отмены или изменения как можно раньше свяжитесь с Daily Red Sea в WhatsApp и укажите номер бронирования. Одобренные возвраты по карте или онлайн-платежу выполняются тем же способом; бронирования с оплатой наличными на месте не списываются.",
    ],
  },
  ar: {
    confirmation: "تأكيد الحجز", issued: "تاريخ الإصدار", cash: "الدفع نقداً عند الوصول", reference: "رقم الحجز",
    keepReference: "احتفظ بهذا الرقم عند التواصل مع الدعم.", guest: "بيانات الضيف", guestName: "اسم الضيف", pending: "سيتم التأكيد",
    experience: "تفاصيل الرحلة", date: "تاريخ الرحلة", time: "وقت المغادرة", travelers: "المسافرون", pickup: "الاستلام / نقطة التجمع",
    total: "إجمالي المبلغ", paymentNote: "يتم الدفع نقداً عند الوصول. لم يتم تحصيل أي دفعة عبر الإنترنت.", next: "ما الخطوة التالية؟",
    steps: "احتفظ بهذا التأكيد. سنؤكد التوفر النهائي وتفاصيل الاستلام أو نقطة التجمع عبر واتساب. أظهر رقم الحجز عند الطلب.",
    thanks: "شكراً لاختيارك ديلي رد سي.", policy: "سياسة الإلغاء واسترداد المبلغ",
    policyParagraphs: [
      "تسري شروط الإلغاء الموضحة في صفحة النشاط على هذا الحجز. إذا لم تذكر الصفحة مهلة مختلفة، يرجى الإلغاء قبل موعد الاستلام المحدد بـ 48 ساعة على الأقل لاسترداد المبلغ بالكامل، أو لتجنب أي رسوم في الحجوزات التي يتم دفعها نقداً عند الوصول.",
      "لا يمكن استرداد المبلغ عند الإلغاء بعد انتهاء المهلة المحددة أو التأخر أو عدم الحضور، لأن مقدمي الخدمة المحليين يحجزون السعة ويتحملون التكاليف. قد تتطلب الجولات الخاصة والقوارب محدودة السعة وتجارب الجهات الخارجية مهلة أطول أو تكون غير قابلة للاسترداد إذا تم توضيح ذلك قبل الحجز.",
      "إذا ألغت ديلي رد سي أو الجهة المحلية الرحلة بسبب الطقس أو السلامة أو عدم اكتمال العدد أو أسباب تشغيلية، يمكنك اختيار استرداد المبلغ بالكامل أو اختيار موعد أو نشاط بديل متاح.",
      "لطلب الإلغاء أو التعديل، تواصل مع ديلي رد سي عبر واتساب في أقرب وقت ممكن واذكر رقم الحجز. تتم إعادة المبالغ المعتمدة للبطاقات أو المدفوعات الإلكترونية إلى وسيلة الدفع الأصلية، ولا يتم تحصيل رسوم الحجوزات المدفوعة نقداً عند الوصول.",
    ],
  },
  pl: {
    confirmation: "Potwierdzenie rezerwacji", issued: "Wystawiono", cash: "Płatność gotówką na miejscu", reference: "Numer rezerwacji",
    keepReference: "Zachowaj ten numer do kontaktu z obsługą.", guest: "Dane gościa", guestName: "Imię i nazwisko", pending: "Do potwierdzenia",
    experience: "Szczegóły wycieczki", date: "Data", time: "Godzina wyjazdu", travelers: "Uczestnicy", pickup: "Odbiór / miejsce spotkania",
    total: "Do zapłaty", paymentNote: "Płatność gotówką na miejscu. Nie pobrano płatności online.", next: "Co dalej?",
    steps: "Zachowaj to potwierdzenie. Ostateczną dostępność oraz szczegóły odbioru lub miejsca spotkania potwierdzimy przez WhatsApp. Przy kontakcie podaj numer rezerwacji.",
    thanks: "Dziękujemy za wybranie Daily Red Sea.", policy: "Zasady anulowania i zwrotów",
    policyParagraphs: [
      "Do rezerwacji mają zastosowanie zasady anulowania podane na stronie wybranej atrakcji. Jeśli nie wskazano innego terminu, anuluj co najmniej 48 godzin przed planowanym odbiorem, aby otrzymać pełny zwrot. W przypadku płatności gotówką na miejscu opłata nie zostanie pobrana.",
      "Anulowanie po wymaganym terminie, spóźnienie lub niepojawienie się nie podlega zwrotowi, ponieważ lokalni dostawcy rezerwują miejsca i ponoszą koszty. Prywatne wycieczki, łodzie z ograniczoną liczbą miejsc i usługi firm trzecich mogą wymagać dłuższego terminu lub mieć szczególne warunki, jeśli podano je przed rezerwacją.",
      "Jeśli Daily Red Sea lub lokalny dostawca odwoła wycieczkę z powodu pogody, bezpieczeństwa, niewystarczającej liczby uczestników lub przyczyn operacyjnych, możesz wybrać pełny zwrot albo dostępny termin lub atrakcję zastępczą.",
      "Aby anulować lub zmienić rezerwację, skontaktuj się z Daily Red Sea przez WhatsApp jak najwcześniej i podaj numer rezerwacji. Zatwierdzone zwroty kartą lub płatności online są realizowane pierwotną metodą; rezerwacje płatne gotówką na miejscu nie są obciążane.",
    ],
  },
  zh: {
    confirmation: "预订确认单", issued: "签发日期", cash: "到场现金支付", reference: "预订编号",
    keepReference: "联系客服时请保留此编号。", guest: "客人信息", guestName: "客人姓名", pending: "待确认",
    experience: "行程详情", date: "行程日期", time: "出发时间", travelers: "出行人数", pickup: "接送 / 集合地点",
    total: "应付总额", paymentNote: "请于到场时以现金支付。未收取任何在线付款。", next: "下一步",
    steps: "请保留此确认单。我们会通过 WhatsApp 确认最终名额以及接送或集合地点详情。需要时请出示预订编号。",
    thanks: "感谢您选择 Daily Red Sea。", policy: "取消与退款政策",
    policyParagraphs: [
      "本预订适用活动页面所列的取消条款。如页面未注明其他时限，请至少在计划接送时间前 48 小时取消，以获得全额退款；到场现金支付的预订不会产生费用。",
      "超过适用时限后取消、迟到或未到场均不予退款，因为当地供应商已预留名额并产生成本。私人行程、名额有限的船只及第三方体验可能需要更长的提前通知，或适用预订前已明确说明的特殊条款。",
      "若 Daily Red Sea 或当地供应商因天气、安全、人数不足或运营原因取消，您可选择全额退款，或选择可用的替代日期或活动。",
      "如需取消或更改，请尽早通过 WhatsApp 联系 Daily Red Sea 并提供预订编号。已批准的银行卡或在线付款退款将退回原支付方式；到场现金支付的预订不会被扣款。",
    ],
  },
} as const;

/**
 * A self-contained, branded PDF voucher with embedded Unicode fonts so the
 * customer's booking language and entered details survive intact.
 */
export function createInvoicePdf(invoice: InvoiceData): Promise<Buffer> {
  const locale = bookingLocale(invoice.locale);
  const t = confirmationCopy[locale];
  const money = locale === "ar"
    ? `${invoice.amount.toFixed(2)} ${invoice.currency.toUpperCase()}`
    : formatMoney(invoice.amount, invoice.currency, locale);
  const quantity = Math.max(Number(invoice.quantity) || 1, 1);
  const issuedDate = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : locale, { day: "2-digit", month: "short", year: "numeric" }).format(invoice.issuedAt);
  const rtl = locale === "ar";
  const font = notoFontPath(locale);

  return new Promise((resolve, reject) => {
    // font: "" stops PDFKit's constructor from eagerly loading its built-in
    // Helvetica AFM through the "#standard-fonts/*" subpath import, which is not
    // resolvable once the route is bundled for serverless. Every text run below
    // sets the embedded "Noto" face explicitly, so no default font is needed.
    const doc = new PDFDocument({ size: "A4", margin: 0, autoFirstPage: false, font: "", info: { Title: `${t.confirmation} - ${invoice.reference}`, Author: "Daily Red Sea" } });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.registerFont("Noto", font);

    const rtlDigits = (value: string) => /\p{Script=Arabic}/u.test(value) ? value.replace(/[0-9][0-9:./-]*/g, (part) => [...part].reverse().join("")) : value;
    // Non-breaking spaces keep short RTL labels/values from wrapping mid-phrase, but
    // they also disable word-wrap entirely, so long free text (like a pickup address)
    // must skip this and use rtlWrappableText below instead.
    const rtlText = (value: string) => rtl ? rtlDigits(value).replaceAll(" ", "\u00a0") : value;
    const rtlWrappableText = (value: string) => rtl ? rtlDigits(value) : value;
    const write = (value: string, x: number, y: number, width: number, size = 10, color = "#0d3b78", align: "left" | "right" | "center" = rtl ? "right" : "left") => {
      doc.font("Noto").fontSize(size).fillColor(color).text(rtlText(value), x, y, { width, align, lineGap: 2 });
    };
    const labelValue = (label: string, value: string, x: number, y: number, width: number) => {
      write(label, x, y, width, 8, "#64748b");
      write(value, x, y + 15, width, 10, "#0f172a");
    };
    const card = (x: number, y: number, width: number, height: number) => doc.roundedRect(x, y, width, height, 10).fill("#ffffff");
    const addBackground = () => doc.rect(0, 0, 595.28, 841.89).fill("#f1f5f9");

    doc.addPage();
    addBackground();
    doc.rect(0, 0, 595.28, 158).fill("#0d3b78");
    doc.rect(0, 158, 595.28, 5).fill("#ff3300");
    drawPdfBrandMark(doc, { pageWidth: 595.28, margin: 48, y: 32, width: 170, rtl });
    write(t.confirmation, 48, 76, 320, 18, "#ffffff", rtl ? "right" : "left");
    write(`${t.issued}: ${issuedDate}`, 48, 104, 320, 9, "#dbeafe", rtl ? "right" : "left");
    doc.roundedRect(405, 95, 142, 38, 8).fill("#166534");
    write(t.cash, 417, 106, 118, 9, "#dcfce7", "center");

    card(48, 183, 499, 62);
    labelValue(t.reference, invoice.reference, 64, 198, 220);
    write(t.keepReference, 300, 207, 230, 9, "#475569");

    card(48, 265, 499, 126);
    write(t.guest, 64, 282, 467, 10, "#0d3b78");
    labelValue(t.guestName, invoice.customerName || t.pending, 64, 312, 210);
    labelValue("WhatsApp", invoice.customerPhone || t.pending, 300, 312, 230);
    labelValue("Email", invoice.customerEmail || t.pending, 64, 350, 467);

    // The pickup / meeting-point field is free text and can run long, so its
    // height is measured and the experience card (and everything stacked below
    // it) grows to fit, up to a safety cap enforced with an ellipsis, so long
    // text can never bleed into the orange total block below.
    const experienceCardTop = 411;
    const pickupLabel = t.pickup;
    const pickupValue = invoice.hotel || t.pending;
    const pickupX = 300;
    const pickupWidth = 247;
    const pickupValueY = experienceCardTop + 143 + 15;
    const pickupBaselineBudget = 601 - pickupValueY; // vertical room the original fixed-height design allotted
    const pickupMaxExtra = 40;
    const pickupFullHeight = doc.font("Noto").fontSize(10).heightOfString(rtlWrappableText(pickupValue), { width: pickupWidth, lineGap: 2 });
    const pickupExtra = Math.min(Math.max(0, pickupFullHeight - pickupBaselineBudget), pickupMaxExtra);
    const experienceCardHeight = 190 + pickupExtra;

    card(48, experienceCardTop, 499, experienceCardHeight);
    write(t.experience, 64, experienceCardTop + 17, 467, 10, "#0d3b78");
    write(invoice.itemName || "Daily Red Sea", 64, experienceCardTop + 46, 467, 14, "#0f172a");
    if (invoice.tripLines?.length) {
      write(invoice.tripLines.slice(0, 4).join("\n"), 64, experienceCardTop + 75, 467, 8.5, "#475569");
    } else {
      labelValue(t.date, invoice.date || t.pending, 64, experienceCardTop + 94, 210);
      labelValue(t.time, invoice.time || t.pending, 300, experienceCardTop + 94, 230);
    }
    labelValue(t.travelers, invoice.travelerSummary || `${quantity}`, 64, experienceCardTop + 143, 210);
    write(pickupLabel, pickupX, experienceCardTop + 143, pickupWidth, 8, "#64748b");
    doc.font("Noto").fontSize(10).fillColor("#0f172a").text(rtlWrappableText(pickupValue), pickupX, pickupValueY, {
      width: pickupWidth, align: rtl ? "right" : "left", lineGap: 2,
      height: pickupBaselineBudget + pickupExtra, ellipsis: true,
    });

    const totalBoxY = experienceCardTop + experienceCardHeight + 12;
    doc.roundedRect(48, totalBoxY, 499, 76, 10).fill("#e2380f");
    write(t.total, 64, totalBoxY + 17, 210, 9, "#ffebe6");
    write(money, 64, totalBoxY + 36, 210, 22, "#ffffff");
    write(t.paymentNote, 295, totalBoxY + 25, 235, 9, "#ffffff");

    const nextCardY = totalBoxY + 76 + 12;
    card(48, nextCardY, 499, 73);
    write(t.next, 64, nextCardY + 15, 467, 9, "#0d3b78");
    write(t.steps, 64, nextCardY + 34, 467, 8.5, "#475569");
    const footerY = nextCardY + 73 + 10;
    write(`Daily Red Sea | ${invoice.reference} | dailyredsea.com`, 48, footerY, 310, 8, "#64748b", "left");
    write(t.thanks, 340, footerY, 207, 8, "#64748b");

    doc.addPage();
    addBackground();
    card(48, 60, 499, 720);
    write(t.policy, 68, 86, 459, 14, "#0d3b78");
    let policyY = 125;
    const policyParagraphs = locale === "en" ? getCancellationPolicyParagraphs() : t.policyParagraphs;
    for (const paragraph of policyParagraphs) {
      const height = doc.font("Noto").fontSize(9.5).heightOfString(paragraph, { width: 459, lineGap: 4 });
      if (policyY + height > 740) {
        doc.addPage();
        addBackground();
        card(48, 60, 499, 720);
        write(t.policy, 68, 86, 459, 14, "#0d3b78");
        policyY = 125;
      }
      write(paragraph, 68, policyY, 459, 9.5, "#475569");
      policyY += height + 18;
    }
    write(`Daily Red Sea | ${invoice.reference} | dailyredsea.com`, 48, 810, 499, 8, "#64748b", "left");
    doc.end();
  });
}

type StatusPdfCopy = {
  statusUpdate: string; generated: string; reference: string; subtitle: string; current: string;
  booking: string; payment: string; guest: string; guestName: string; pending: string;
  bookingDetails: string; date: string; travelers: string; pickup: string;
  assignedGuide: string; assignedDriver: string; total: string; help: string; helpBody: string; policyLine: string;
  statusLabel: Record<string, string>; paymentLabel: Record<string, string>;
  paymentNote: { paid: string; refunded: string; default: string };
};

const statusPdfCopy: Record<Locale, StatusPdfCopy> = {
  en: {
    statusUpdate: "Booking status update", generated: "Updated", reference: "Booking reference",
    subtitle: "Your latest booking and payment information", current: "Current status", booking: "Booking", payment: "Payment",
    guest: "Guest details", guestName: "Guest name", pending: "To be confirmed", bookingDetails: "Booking details",
    date: "Date", travelers: "Travelers", pickup: "Pickup / meeting point",
    assignedGuide: "Assigned guide", assignedDriver: "Assigned driver", total: "Booking total",
    help: "Need help?", helpBody: "Reply to the email that included this PDF or contact us on WhatsApp.",
    policyLine: "Cancellation and refund policy",
    statusLabel: { new: "Received", confirmed: "Confirmed", completed: "Completed", cancelled: "Cancelled" },
    paymentLabel: { unpaid: "Unpaid", paid: "Paid", refunded: "Refunded" },
    paymentNote: { paid: "Payment received - thank you.", refunded: "Payment recorded as refunded.", default: "Payment due in cash on arrival unless agreed otherwise." },
  },
  de: {
    statusUpdate: "Aktualisierung des Buchungsstatus", generated: "Aktualisiert", reference: "Buchungsnummer",
    subtitle: "Deine aktuellen Buchungs- und Zahlungsinformationen", current: "Aktueller Status", booking: "Buchung", payment: "Zahlung",
    guest: "Gastdaten", guestName: "Name", pending: "Wird noch bestätigt", bookingDetails: "Buchungsdetails",
    date: "Datum", travelers: "Reisende", pickup: "Abholung / Treffpunkt",
    assignedGuide: "Zugewiesener Guide", assignedDriver: "Zugewiesener Fahrer", total: "Gesamtbetrag",
    help: "Brauchst du Hilfe?", helpBody: "Antworte auf die E-Mail mit diesem PDF oder kontaktiere uns über WhatsApp.",
    policyLine: "Stornierungs- und Erstattungsbedingungen",
    statusLabel: { new: "Eingegangen", confirmed: "Bestätigt", completed: "Abgeschlossen", cancelled: "Storniert" },
    paymentLabel: { unpaid: "Offen", paid: "Bezahlt", refunded: "Erstattet" },
    paymentNote: { paid: "Zahlung erhalten - vielen Dank.", refunded: "Zahlung als erstattet vermerkt.", default: "Zahlung in bar bei Ankunft, sofern nicht anders vereinbart." },
  },
  ru: {
    statusUpdate: "Обновление статуса бронирования", generated: "Обновлено", reference: "Номер бронирования",
    subtitle: "Актуальная информация о бронировании и оплате", current: "Текущий статус", booking: "Бронирование", payment: "Оплата",
    guest: "Данные гостя", guestName: "Имя гостя", pending: "Будет подтверждено", bookingDetails: "Детали бронирования",
    date: "Дата", travelers: "Участники", pickup: "Трансфер / место встречи",
    assignedGuide: "Назначенный гид", assignedDriver: "Назначенный водитель", total: "Итого по бронированию",
    help: "Нужна помощь?", helpBody: "Ответьте на письмо с этим PDF или свяжитесь с нами в WhatsApp.",
    policyLine: "Условия отмены и возврата",
    statusLabel: { new: "Принято", confirmed: "Подтверждено", completed: "Завершено", cancelled: "Отменено" },
    paymentLabel: { unpaid: "Не оплачено", paid: "Оплачено", refunded: "Возвращено" },
    paymentNote: { paid: "Оплата получена - спасибо.", refunded: "Оплата отмечена как возвращённая.", default: "Оплата наличными по прибытии, если не согласовано иное." },
  },
  ar: {
    statusUpdate: "تحديث حالة الحجز", generated: "آخر تحديث", reference: "رقم الحجز",
    subtitle: "أحدث معلومات الحجز والدفع", current: "الحالة الحالية", booking: "الحجز", payment: "الدفع",
    guest: "بيانات الضيف", guestName: "اسم الضيف", pending: "سيتم التأكيد", bookingDetails: "تفاصيل الحجز",
    date: "التاريخ", travelers: "المسافرون", pickup: "الاستلام / نقطة التجمع",
    assignedGuide: "المرشد المعيَّن", assignedDriver: "السائق المعيَّن", total: "إجمالي الحجز",
    help: "تحتاج مساعدة؟", helpBody: "يرجى الرد على البريد الذي تضمّن هذا الملف أو التواصل معنا عبر واتساب.",
    policyLine: "سياسة الإلغاء واسترداد المبلغ",
    statusLabel: { new: "تم الاستلام", confirmed: "مؤكَّد", completed: "مكتمل", cancelled: "ملغى" },
    paymentLabel: { unpaid: "غير مدفوع", paid: "مدفوع", refunded: "مسترد" },
    paymentNote: { paid: "تم استلام الدفع - شكراً لك.", refunded: "تم تسجيل الدفع كمبلغ مسترد.", default: "الدفع نقداً عند الوصول ما لم يُتفق على خلاف ذلك." },
  },
  pl: {
    statusUpdate: "Aktualizacja statusu rezerwacji", generated: "Zaktualizowano", reference: "Numer rezerwacji",
    subtitle: "Najnowsze informacje o rezerwacji i płatności", current: "Aktualny status", booking: "Rezerwacja", payment: "Płatność",
    guest: "Dane gościa", guestName: "Imię i nazwisko", pending: "Do potwierdzenia", bookingDetails: "Szczegóły rezerwacji",
    date: "Data", travelers: "Uczestnicy", pickup: "Odbiór / miejsce spotkania",
    assignedGuide: "Przydzielony przewodnik", assignedDriver: "Przydzielony kierowca", total: "Łączna kwota",
    help: "Potrzebujesz pomocy?", helpBody: "Odpowiedz na wiadomość e-mail z tym plikiem PDF lub skontaktuj się z nami przez WhatsApp.",
    policyLine: "Zasady anulowania i zwrotów",
    statusLabel: { new: "Przyjęto", confirmed: "Potwierdzona", completed: "Zakończona", cancelled: "Anulowana" },
    paymentLabel: { unpaid: "Nieopłacona", paid: "Opłacona", refunded: "Zwrócona" },
    paymentNote: { paid: "Płatność otrzymana - dziękujemy.", refunded: "Płatność oznaczona jako zwrócona.", default: "Płatność gotówką na miejscu, o ile nie uzgodniono inaczej." },
  },
  zh: {
    statusUpdate: "预订状态更新", generated: "更新时间", reference: "预订编号",
    subtitle: "您最新的预订与付款信息", current: "当前状态", booking: "预订", payment: "付款",
    guest: "客人信息", guestName: "客人姓名", pending: "待确认", bookingDetails: "预订详情",
    date: "日期", travelers: "出行人数", pickup: "接送 / 集合地点",
    assignedGuide: "指定导游", assignedDriver: "指定司机", total: "预订总额",
    help: "需要帮助？", helpBody: "请回复包含此 PDF 的邮件，或通过 WhatsApp 联系我们。",
    policyLine: "取消与退款政策",
    statusLabel: { new: "已收到", confirmed: "已确认", completed: "已完成", cancelled: "已取消" },
    paymentLabel: { unpaid: "未付款", paid: "已付款", refunded: "已退款" },
    paymentNote: { paid: "已收到付款 - 谢谢。", refunded: "付款已记录为退款。", default: "除非另有约定，请于到场时以现金支付。" },
  },
};

function statusTone(value: string): { bg: string; fg: string } {
  if (["confirmed", "completed", "paid"].includes(value)) return { bg: "#dcfce7", fg: "#166534" };
  if (value === "cancelled") return { bg: "#fee2e2", fg: "#991b1b" };
  if (value === "unpaid") return { bg: "#fef3c7", fg: "#92400e" };
  return { bg: "#dbeafe", fg: "#1e40af" };
}

/**
 * A branded status voucher rendered with the embedded Noto family so the
 * customer's booking language survives in its native script (Cyrillic, Arabic
 * and CJK included), matching createInvoicePdf.
 */
export function createBookingStatusPdf(booking: BookingStatusPdfData): Promise<Buffer> {
  const locale = bookingLocale(booking.locale);
  const t = statusPdfCopy[locale];
  const p = statusPricingCopy[locale];
  const rtl = locale === "ar";
  const subtotal = booking.subtotal != null && Number.isFinite(booking.subtotal) ? booking.subtotal : null;
  const discount = booking.discountAmount != null && Number.isFinite(booking.discountAmount) ? booking.discountAmount : null;
  const snapshot = readPricingSnapshot(booking.pricingSnapshot, booking.currency, subtotal);
  const historicalTrips = !snapshot && booking.itemName.startsWith("Multi-trip booking:") ? historicalTripParticipants(booking.historicalNotes) : [];
  const money = (amount: number) => rtl ? `${amount.toFixed(2)} ${booking.currency.toUpperCase()}` : formatMoney(amount, booking.currency, locale);
  const generatedDate = rtl ? booking.generatedAt.toISOString().slice(0, 10) : new Intl.DateTimeFormat(locale === "en" ? "en-GB" : locale, { day: "2-digit", month: "short", year: "numeric" }).format(booking.generatedAt);
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 0, autoFirstPage: false, font: "", info: { Title: `${t.statusUpdate} - ${booking.reference}`, Author: "Daily Red Sea", CreationDate: booking.generatedAt } });
    const chunks: Buffer[] = [];
    doc.on("data", chunk => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.registerFont("Noto", notoFontPath(locale));
    // PDFKit shapes Arabic; reverse numeric runs inside Arabic text to preserve their visual order.
    const text = (value: string, width: number, size: number) => {
      if (!rtl || !/\p{Script=Arabic}/u.test(value)) return value;
      // Keep each Arabic line in one shaping run. Ordinary spaces split PDFKit's
      // RTL runs; wrap explicitly before substituting non-breaking spaces.
      const words = value.replace(/[0-9][0-9:./-]*/g, part => [...part].reverse().join("")).split(/\s+/);
      const lines: string[] = [];
      let line = "";
      for (const word of words) {
        const candidate = line ? `${line}\u00a0${word}` : word;
        if (line && doc.font("Noto").fontSize(size).widthOfString(candidate) > width) { lines.push(line); line = word; }
        else line = candidate;
      }
      if (line) lines.push(line);
      return lines.join("\n");
    };
    const write = (value: string, x: number, y: number, width: number, size = 10, color = "#0f172a", align: "left" | "right" | "center" = rtl ? "right" : "left") => {
      doc.font("Noto").fontSize(size).fillColor(color).text(text(value, width, size), x, y, { width, align, lineGap: 3 });
    };
    const height = (value: string, width: number, size: number) => doc.font("Noto").fontSize(size).heightOfString(text(value, width, size), { width, lineGap: 3 });
    let y = 0;
    let page = 0;
    const addPage = () => {
      doc.addPage(); page++;
      doc.rect(0, 0, 595.28, 841.89).fill("#f1f5f9");
      doc.rect(0, 0, 595.28, 130).fill("#0d3b78");
      doc.rect(0, 130, 595.28, 4).fill("#ff3300");
      drawPdfBrandMark(doc, { pageWidth: 595.28, margin: 48, y: 24, width: 155, rtl });
      write(t.statusUpdate, 48, 67, 499, 17, "#ffffff");
      write(`${booking.reference} | ${generatedDate}`, 48, 101, 499, 9, "#dbeafe", "left");
      write(`${booking.reference} | ${page} | dailyredsea.com/terms-conditions`, 48, 808, 499, 8, "#64748b", "left");
      y = 152;
    };
    const ensure = (space: number) => { if (y + space > 785) addPage(); };
    const paragraph = (value: string, size = 10, color = "#0f172a") => {
      const h = height(value, 467, size);
      ensure(h + 12);
      write(value, 64, y, 467, size, color); y += h + 10;
    };
    const heading = (value: string) => { ensure(70); paragraph(value, 12, "#0d3b78"); };
    const detail = (label: string, value: string) => {
      if (!rtl) { paragraph(`${label}: ${value}`); return; }
      const h = Math.max(height(label, 190, 10), height(value, 260, 10));
      ensure(h + 12);
      write(label, 341, y, 190, 10, "#64748b");
      write(value, 64, y, 260, 10); y += h + 10;
    };
    const participants = (counts: unknown, guests?: number | null) => {
      if (validParticipantCounts(counts, guests)) {
        paragraph(`${p.adults}: ${counts.adults} | ${p.youth}: ${counts.youth} | ${p.infants}: ${counts.infants}`);
      } else {
        paragraph(`${guests == null ? "" : `${p.guests}: ${guests}. `}${p.unknownParticipants}`, 9, "#64748b");
      }
    };
    addPage();
    heading(t.current);
    for (const [label, value, status] of [
      [t.booking, t.statusLabel[booking.bookingStatus] || t.pending, booking.bookingStatus],
      [t.payment, t.paymentLabel[booking.paymentStatus] || t.pending, booking.paymentStatus],
    ]) {
      const tone = statusTone(status);
      const h = height(`${label}: ${value}`, 467, 11) + 18;
      ensure(h + 8);
      doc.roundedRect(48, y - 4, 499, h, 7).fill(tone.bg);
      write(`${label}: ${value}`, 64, y + 3, 467, 11, tone.fg); y += h + 8;
    }
    heading(t.guest);
    detail(t.guestName, booking.customerName || t.pending);
    if (booking.customerPhone) detail("WhatsApp", booking.customerPhone);
    if (booking.customerEmail) detail("Email", booking.customerEmail);
    heading(t.bookingDetails);
    // Snapshot trips below contain the full names, dates and participant categories.
    if (!snapshot) paragraph(booking.itemName || "Daily Red Sea", 11);
    detail(t.date, booking.date || t.pending);
    if (!snapshot && !historicalTrips.length) participants(booking.participants, booking.guests);
    for (const trip of historicalTrips) {
      paragraph(`${trip.name} | ${trip.date} | ${trip.time}`, 10, "#0d3b78");
      participants(trip.participants);
    }
    detail(t.pickup, booking.pickup || t.pending);
    if (booking.assignedPersonName) detail(booking.assignedPersonRole === "driver" ? t.assignedDriver : t.assignedGuide, booking.assignedPersonName);
    heading(rtl ? p.pricing : `${p.pricing} (${booking.currency.toUpperCase()})`);
    const widths = [222, 55, 95, 95];
    const positions = rtl ? [309, 254, 159, 64] : [64, 286, 341, 436];
    const tableRow = (values: string[], header = false) => {
      const h = Math.max(...values.map((v, i) => height(v, widths[i] - 10, 9))) + 16;
      ensure(h);
      doc.rect(48, y - 4, 499, h).fill(header ? "#dbeafe" : "#ffffff");
      values.forEach((v, i) => write(v, positions[i], y + 3, widths[i] - 10, 9, header ? "#0d3b78" : "#0f172a", rtl ? "right" : i === 0 ? "left" : "right"));
      y += h;
    };
    const tableHeader = () => tableRow([p.item, p.quantity, p.unit, p.lineTotal], true);
    if (snapshot) {
      for (const trip of snapshot.trips) {
        ensure(150);
        paragraph(trip.name, 11, "#0d3b78");
        if (trip.date) paragraph(`${trip.date}${trip.time ? ` | ${trip.time}` : ""}`, 9);
        participants(trip.participants, trip.guests);
        if (snapshot.pending) { paragraph(p.pending); continue; }
        tableHeader();
        for (const line of trip.lines) {
          const label = `${p[line.kind]}${line.label ? ` - ${line.label}` : ""}`;
          const values = [label, String(line.quantity), money(line.unitPrice), money(line.total)];
          const needed = Math.max(...values.map((v, i) => height(v, widths[i] - 10, 9))) + 16;
          if (y + needed > 785) { addPage(); paragraph(trip.name, 11, "#0d3b78"); tableHeader(); }
          tableRow(values);
        }
        y += 14;
      }
    } else paragraph(p.unknownPrices, 10, "#64748b");
    ensure(180);
    if (!snapshot?.pending) {
      detail(p.subtotal, subtotal === null ? t.pending : money(subtotal));
      if (booking.promoCode) detail(p.promo, booking.promoCode);
      else paragraph(subtotal !== null && discount === 0 ? p.noPromo : p.unknownPromo);
      detail(p.discount, discount === null ? t.pending : money(discount));
      if (subtotal !== null && discount !== null && Math.abs(subtotal - discount - booking.amount) > 0.011) paragraph(p.inconsistent, 9, "#92400e");
    }
    const total = snapshot?.pending ? p.pending : money(booking.amount);
    const totalHeight = Math.max(height(t.total, 220, 12), height(total, 230, 17)) + 28;
    ensure(totalHeight + 12);
    doc.roundedRect(48, y, 499, totalHeight, 9).fill("#0d3b78");
    write(t.total, rtl ? 311 : 64, y + 12, 220, 12, "#ffffff");
    write(total, rtl ? 64 : 301, y + 12, 230, 17, "#ffffff"); y += totalHeight + 16;
    if (!snapshot?.pending) paragraph(t.paymentNote[booking.paymentStatus === "paid" ? "paid" : booking.paymentStatus === "refunded" ? "refunded" : "default"], 9, "#475569");
    ensure(100);
    heading(t.help);
    paragraph(t.helpBody, 9, "#475569");
    paragraph(t.policyLine, 8, "#64748b");
    doc.end();
  });
}

function formatMoney(amount: number, currency: string, locale = "en") { try { return new Intl.NumberFormat(locale, { style: "currency", currency: currency.toUpperCase() }).format(amount); } catch { return `${amount.toFixed(2)} ${currency.toUpperCase()}`; } }
