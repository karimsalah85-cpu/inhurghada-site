import { getCancellationPolicyParagraphs } from "@/lib/pdf-policy";
import { bookingLocale } from "@/lib/booking-communications-i18n";
import PDFDocument from "pdfkit";
import path from "node:path";

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
  pickup?: string;
  amount: number;
  currency: string;
  bookingStatus: string;
  paymentStatus: string;
  assignedPersonName?: string;
  assignedPersonRole?: "guide" | "driver";
  locale?: string;
};

type Color = [number, number, number];

const navy: Color = [15, 23, 42];
const blue: Color = [37, 99, 235];
const cyan: Color = [6, 182, 212];
const slate: Color = [71, 85, 105];
const muted: Color = [100, 116, 139];
const light: Color = [241, 245, 249];
const white: Color = [255, 255, 255];

const pdfCopy = {
  en: { confirmation: "BOOKING CONFIRMATION", issued: "Issued", cash: "CASH ON ARRIVAL", reference: "BOOKING REFERENCE", guest: "GUEST DETAILS", guestName: "Guest name", pending: "To be confirmed", experience: "EXPERIENCE DETAILS", date: "Experience date", time: "Departure time", travelers: "Travelers", pickup: "Pickup", total: "TOTAL TO PAY", next: "WHAT HAPPENS NEXT", statusUpdate: "BOOKING STATUS UPDATE", updated: "Updated", current: "CURRENT STATUS", booking: "BOOKING", payment: "PAYMENT", bookingDetails: "BOOKING DETAILS", help: "NEED HELP?" },
  de: { confirmation: "BUCHUNGSBESTAETIGUNG", issued: "Ausgestellt", cash: "BARZAHLUNG VOR ORT", reference: "BUCHUNGSNUMMER", guest: "GASTDATEN", guestName: "Name", pending: "Wird noch bestaetigt", experience: "ERLEBNISDETAILS", date: "Datum", time: "Abfahrtszeit", travelers: "Reisende", pickup: "Abholung", total: "GESAMTBETRAG", next: "WIE GEHT ES WEITER", statusUpdate: "BUCHUNGSSTATUS", updated: "Aktualisiert", current: "AKTUELLER STATUS", booking: "BUCHUNG", payment: "ZAHLUNG", bookingDetails: "BUCHUNGSDETAILS", help: "BRAUCHEN SIE HILFE?" },
  pl: { confirmation: "POTWIERDZENIE REZERWACJI", issued: "Wystawiono", cash: "PLATNOSC GOTOWKA", reference: "NUMER REZERWACJI", guest: "DANE GOSCIA", guestName: "Imie i nazwisko", pending: "Do potwierdzenia", experience: "SZCZEGOLY WYCIECZKI", date: "Data", time: "Godzina wyjazdu", travelers: "Uczestnicy", pickup: "Odbior", total: "DO ZAPLATY", next: "CO DALEJ", statusUpdate: "STATUS REZERWACJI", updated: "Zaktualizowano", current: "AKTUALNY STATUS", booking: "REZERWACJA", payment: "PLATNOSC", bookingDetails: "SZCZEGOLY REZERWACJI", help: "POTRZEBUJESZ POMOCY?" },
  ru: { confirmation: "PODTVERZHDENIE BRONIROVANIYA", issued: "Vydano", cash: "OPLATA NALICHNYMI", reference: "NOMER BRONIROVANIYA", guest: "DANNYE GOSTYA", guestName: "Imya gosta", pending: "Budet podtverzhdeno", experience: "DETALI POEZDKI", date: "Data", time: "Vremya otpravleniya", travelers: "Uchastniki", pickup: "Transfer", total: "K OPLATE", next: "CHTO DAL'SHE", statusUpdate: "STATUS BRONIROVANIYA", updated: "Obnovleno", current: "TEKUSHCHIY STATUS", booking: "BRONIROVANIE", payment: "OPLATA", bookingDetails: "DETALI BRONIROVANIYA", help: "NUZHNA POMOSHCH?" },
  ar: { confirmation: "TA'KID AL-HAJZ", issued: "Sudira fi", cash: "AL-DAF' NAQDAN", reference: "RAQM AL-HAJZ", guest: "BAYANAT AL-DAYF", guestName: "Ism al-dayf", pending: "Sayutam al-ta'kid", experience: "TAFASIL AL-RIHLA", date: "Tarikh al-rihla", time: "Waqt al-mughadara", travelers: "Al-musafirun", pickup: "Al-istilam", total: "AL-IJMALI", next: "AL-KHUTWAT AL-TALIYA", statusUpdate: "TAHDITH HALAT AL-HAJZ", updated: "Tamma al-tahdith", current: "AL-HALA AL-HALIYA", booking: "AL-HAJZ", payment: "AL-DAF'", bookingDetails: "TAFASIL AL-HAJZ", help: "TAHTAJ MUSA'ADA?" },
  zh: { confirmation: "YUDING QUEREN", issued: "Qianfa riqi", cash: "DAOCHANG XIANJIN ZHIFU", reference: "YUDING BIANHAO", guest: "KEHU XINXI", guestName: "Kehu xingming", pending: "Dai queren", experience: "XINGCHENG XIANGQING", date: "Xingcheng riqi", time: "Chufa shijian", travelers: "Renshu", pickup: "Jiesong", total: "YINGFU ZONGE", next: "XIAYIBU", statusUpdate: "YUDING ZHUANGTAI", updated: "Gengxin", current: "DANGQIAN ZHUANGTAI", booking: "YUDING", payment: "FUKUAN", bookingDetails: "YUDING XIANGQING", help: "XUYAO BANGZHU?" },
} as const;

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
      "Es gelten die Stornierungsbedingungen auf der Seite der gebuchten Aktivität. Wenn dort keine andere Frist angegeben ist, storniere mindestens 24 Stunden vor der geplanten Abholzeit, um eine vollständige Erstattung zu erhalten. Bei Barzahlung vor Ort fällt dann keine Gebühr an.",
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
      "К бронированию применяются условия отмены, указанные на странице выбранной экскурсии. Если другой срок не указан, отмените бронирование не менее чем за 24 часа до запланированного времени трансфера, чтобы получить полный возврат. При оплате наличными на месте плата не взимается.",
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
      "تسري شروط الإلغاء الموضحة في صفحة النشاط على هذا الحجز. إذا لم تذكر الصفحة مهلة مختلفة، يرجى الإلغاء قبل موعد الاستلام المحدد بـ 24 ساعة على الأقل لاسترداد المبلغ بالكامل، أو لتجنب أي رسوم في الحجوزات التي يتم دفعها نقداً عند الوصول.",
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
      "Do rezerwacji mają zastosowanie zasady anulowania podane na stronie wybranej atrakcji. Jeśli nie wskazano innego terminu, anuluj co najmniej 24 godziny przed planowanym odbiorem, aby otrzymać pełny zwrot. W przypadku płatności gotówką na miejscu opłata nie zostanie pobrana.",
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
      "本预订适用活动页面所列的取消条款。如页面未注明其他时限，请至少在计划接送时间前 24 小时取消，以获得全额退款；到场现金支付的预订不会产生费用。",
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
  const font = path.join(process.cwd(), "assets/fonts", locale === "ar" ? "NotoSansArabic.ttf" : locale === "zh" ? "NotoSansSC.ttf" : "NotoSans.ttf");

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 0, autoFirstPage: false, info: { Title: `${t.confirmation} - ${invoice.reference}`, Author: "Daily Red Sea" } });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.registerFont("Noto", font);

    const write = (value: string, x: number, y: number, width: number, size = 10, color = "#0d3b78", align: "left" | "right" | "center" = rtl ? "right" : "left") => {
      const renderedValue = rtl
        ? (/\p{Script=Arabic}/u.test(value) ? value.replace(/[0-9][0-9:./-]*/g, (part) => [...part].reverse().join("")) : value).replaceAll(" ", "\u00a0")
        : value;
      doc.font("Noto").fontSize(size).fillColor(color).text(renderedValue, x, y, { width, align, lineGap: 2 });
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
    write("DAILY RED SEA", 48, 36, 499, 22, "#ffffff", rtl ? "right" : "left");
    write("dailyredsea.com", 48, 67, 499, 10, "#dbeafe", rtl ? "right" : "left");
    write(t.confirmation, 48, 99, 320, 18, "#ffffff", rtl ? "right" : "left");
    write(`${t.issued}: ${issuedDate}`, 48, 128, 320, 9, "#dbeafe", rtl ? "right" : "left");
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

    card(48, 411, 499, 190);
    write(t.experience, 64, 428, 467, 10, "#0d3b78");
    write(invoice.itemName || "Daily Red Sea", 64, 457, 467, 14, "#0f172a");
    if (invoice.tripLines?.length) {
      write(invoice.tripLines.slice(0, 4).join("\n"), 64, 486, 467, 8.5, "#475569");
    } else {
      labelValue(t.date, invoice.date || t.pending, 64, 505, 210);
      labelValue(t.time, invoice.time || t.pending, 300, 505, 230);
    }
    labelValue(t.travelers, invoice.travelerSummary || `${quantity}`, 64, 554, 210);
    labelValue(t.pickup, invoice.hotel || t.pending, 300, 554, 230);

    doc.roundedRect(48, 621, 499, 76, 10).fill("#e2380f");
    write(t.total, 64, 638, 210, 9, "#ffebe6");
    write(money, 64, 657, 210, 22, "#ffffff");
    write(t.paymentNote, 295, 646, 235, 9, "#ffffff");

    card(48, 717, 499, 73);
    write(t.next, 64, 732, 467, 9, "#0d3b78");
    write(t.steps, 64, 751, 467, 8.5, "#475569");
    write(`Daily Red Sea | ${invoice.reference} | dailyredsea.com`, 48, 810, 310, 8, "#64748b", "left");
    write(t.thanks, 340, 810, 207, 8, "#64748b");

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

export function createBookingStatusPdf(booking: BookingStatusPdfData): Promise<Buffer> {
  const locale = bookingLocale(booking.locale);
  const t = pdfCopy[locale];
  const generatedDate = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(booking.generatedAt);
  const bookingState = displayStatus(booking.bookingStatus);
  const paymentState = displayStatus(booking.paymentStatus);
  const bookingTone = statusTone(booking.bookingStatus);
  const paymentTone = statusTone(booking.paymentStatus);
  const commands: string[] = [];

  rect(commands, 0, 0, 612, 792, light);
  rect(commands, 0, 644, 612, 148, navy);
  rect(commands, 0, 638, 612, 6, cyan);
  circle(commands, 78, 722, 27, blue);
  text(commands, "DR", 66, 714, 15, true, white);
  text(commands, "DAILY RED SEA", 122, 735, 22, true, white);
  text(commands, "TOURS AND TRANSFERS - HURGHADA, EGYPT", 122, 715, 8.5, false, [203, 213, 225]);
  text(commands, t.statusUpdate, 50, 670, 17, true, white);
  text(commands, `${t.updated} ${generatedDate}`, 50, 654, 9, false, [203, 213, 225]);

  roundedRect(commands, 50, 584, 512, 46, 8, white);
  text(commands, t.reference, 66, 610, 8, true, muted);
  text(commands, booking.reference, 66, 592, 14, true, navy);
  text(commands, "Your latest booking and payment information", 320, 600, 9, false, slate);

  sectionCard(commands, 50, 463, 512, 101, t.current);
  roundedRect(commands, 68, 487, 214, 44, 8, bookingTone.background);
  text(commands, t.booking, 82, 514, 7.5, true, bookingTone.foreground);
  text(commands, bookingState, 82, 495, 13, true, bookingTone.foreground);
  roundedRect(commands, 310, 487, 234, 44, 8, paymentTone.background);
  text(commands, t.payment, 324, 514, 7.5, true, paymentTone.foreground);
  text(commands, paymentState, 324, 495, 13, true, paymentTone.foreground);

  sectionCard(commands, 50, 340, 512, 103, t.guest);
  detail(commands, t.guestName, booking.customerName || "Guest", 68, 402, 215);
  detail(commands, "WhatsApp", booking.customerPhone || t.pending, 310, 402, 220);
  detail(commands, "Email", booking.customerEmail || t.pending, 68, 363, 430);

  sectionCard(commands, 50, 191, 512, 129, t.bookingDetails);
  const itemLines = wrap(booking.itemName || "Daily Red Sea booking", 53);
  text(commands, itemLines[0], 68, 278, 13, true, navy);
  if (itemLines[1]) text(commands, itemLines[1], 68, 262, 13, true, navy);
  detail(commands, t.date, booking.date || t.pending, 68, 235, 205);
  detail(commands, t.travelers, booking.travelers || t.pending, 310, 235, 195);
  detail(commands, t.pickup, booking.pickup || t.pending, 68, 204, 280);
  if (booking.assignedPersonName) detail(commands, `Assigned ${booking.assignedPersonRole || "guide/driver"}`, booking.assignedPersonName, 365, 204, 175);

  roundedRect(commands, 50, 103, 512, 68, 10, blue);
  text(commands, t.total, 68, 143, 8.5, true, [219, 234, 254]);
  text(commands, formatMoney(booking.amount, booking.currency), 68, 117, 23, true, white);
  text(commands, paymentMessage(booking.paymentStatus), 300, 128, 8.8, false, [219, 234, 254]);

  text(commands, t.help, 50, 73, 8.5, true, blue);
  text(commands, "Reply to the email that included this PDF or contact us on WhatsApp.", 50, 57, 8.5, false, slate);
  text(commands, "Cancellation policy: dailyredsea.com/terms-conditions", 50, 42, 8.5, false, slate);
  text(commands, `Daily Red Sea  |  ${booking.reference}`, 390, 42, 8, false, muted);

  return Promise.resolve(buildPdf(commands.join("\n")));
}

function displayStatus(value: string) {
  if (value === "new") return "Received";
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1).toLowerCase()}` : "To be confirmed";
}

function statusTone(value: string): { background: Color; foreground: Color } {
  if (["confirmed", "completed", "paid"].includes(value)) return { background: [220, 252, 231], foreground: [20, 83, 45] };
  if (value === "cancelled") return { background: [254, 226, 226], foreground: [153, 27, 27] };
  if (value === "unpaid") return { background: [254, 243, 199], foreground: [146, 64, 14] };
  return { background: [219, 234, 254], foreground: [30, 64, 175] };
}

function paymentMessage(status: string) {
  if (status === "paid") return "Payment received - thank you.";
  if (status === "refunded") return "Payment recorded as refunded.";
  return "Payment due in cash on arrival unless agreed otherwise.";
}

function sectionCard(commands: string[], x: number, y: number, width: number, height: number, title: string) {
  roundedRect(commands, x, y, width, height, 10, white);
  text(commands, title, x + 18, y + height - 24, 9, true, blue);
}

function detail(commands: string[], label: string, value: string, x: number, y: number, width: number) {
  text(commands, label.toUpperCase(), x, y, 7.5, true, muted);
  const lines = wrap(value, Math.max(20, Math.floor(width / 5.7))).slice(0, 2);
  lines.forEach((line, index) => text(commands, line, x, y - 15 - index * 12, 9.5, false, navy));
}

function text(commands: string[], value: string, x: number, y: number, size: number, bold: boolean, color: Color, align?: "right", width?: number) {
  const escaped = escapePdf(value);
  if (align === "right" && width) {
    commands.push("BT", `/${bold ? "F2" : "F1"} ${size} Tf`, colorCommand(color), `1 0 0 1 ${x + width} ${y} Tm`, `(${escaped}) Tj`, "ET");
    return;
  }
  commands.push("BT", `/${bold ? "F2" : "F1"} ${size} Tf`, colorCommand(color), `1 0 0 1 ${x} ${y} Tm`, `(${escaped}) Tj`, "ET");
}

function rect(commands: string[], x: number, y: number, width: number, height: number, color: Color) {
  commands.push(colorCommand(color), `${x} ${y} ${width} ${height} re f`);
}

function roundedRect(commands: string[], x: number, y: number, width: number, height: number, radius: number, color: Color) {
  const k = 0.5522847498;
  const r = radius;
  commands.push(colorCommand(color), `${x + r} ${y} m`, `${x + width - r} ${y} l`, `${x + width - r + k * r} ${y} ${x + width} ${y + r - k * r} ${x + width} ${y + r} c`, `${x + width} ${y + height - r} l`, `${x + width} ${y + height - r + k * r} ${x + width - r + k * r} ${y + height} ${x + width - r} ${y + height} c`, `${x + r} ${y + height} l`, `${x + r - k * r} ${y + height} ${x} ${y + height - r + k * r} ${x} ${y + height - r} c`, `${x} ${y + r} l`, `${x} ${y + r - k * r} ${x + r - k * r} ${y} ${x + r} ${y} c h f`);
}

function circle(commands: string[], x: number, y: number, radius: number, color: Color) {
  const k = 0.5522847498 * radius;
  commands.push(colorCommand(color), `${x + radius} ${y} m`, `${x + radius} ${y + k} ${x + k} ${y + radius} ${x} ${y + radius} c`, `${x - k} ${y + radius} ${x - radius} ${y + k} ${x - radius} ${y} c`, `${x - radius} ${y - k} ${x - k} ${y - radius} ${x} ${y - radius} c`, `${x + k} ${y - radius} ${x + radius} ${y - k} ${x + radius} ${y} c h f`);
}

function colorCommand([red, green, blueValue]: Color) { return `${(red / 255).toFixed(3)} ${(green / 255).toFixed(3)} ${(blueValue / 255).toFixed(3)} rg`; }
function wrap(value: string, maxChars: number) { const words = escapePdf(value).split(" "); const lines: string[] = []; let line = ""; for (const word of words) { if (`${line} ${word}`.trim().length > maxChars && line) { lines.push(line); line = word; } else line = `${line} ${word}`.trim(); } if (line) lines.push(line); return lines; }
// WinAnsiEncoding (declared on the fonts below) maps the euro sign to byte 0x80
// and matches Unicode code points 1:1 for the U+00A0-U+00FF range (£, ¥, etc.),
// so those survive; anything else outside printable ASCII still falls back to "?".
function escapePdf(value: string) {
  return value
    .replace(/\u20AC/g, String.fromCharCode(0x80))
    .replace(/[^\x20-\x7E\x80\xA0-\xFF]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function buildPdf(input: string | string[]) {
  const streams = Array.isArray(input) ? input : [input];
  const fontRegularId = 3 + streams.length * 2;
  const fontBoldId = fontRegularId + 1;
  const pageIds = streams.map((_, index) => 3 + index * 2);
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${streams.length} >>`,
  ];

  streams.forEach((stream, index) => {
    const contentId = pageIds[index] + 1;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`,
      `<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`,
    );
  });

  objects.push(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
  );

  let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n"; const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(pdf, "binary")); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xrefOffset = Buffer.byteLength(pdf, "binary");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, "binary");
}

function formatMoney(amount: number, currency: string, locale = "en") { try { return new Intl.NumberFormat(locale, { style: "currency", currency: currency.toUpperCase() }).format(amount); } catch { return `${amount.toFixed(2)} ${currency.toUpperCase()}`; } }
