import { getCancellationPolicyParagraphs } from "@/lib/pdf-policy";
import { bookingLocale } from "@/lib/booking-communications-i18n";
import type { Locale } from "@/lib/i18n";
import { historicalTripParticipants, readPricingSnapshot, validParticipantCounts } from "@/lib/booking-pricing-snapshot";
import { statusPricingCopy } from "@/lib/status-pdf-pricing-copy";
import { whatsappNumber } from "@/lib/contact";
import { buildWhatsAppLink } from "@/lib/booking-service";
import { pdfColors, pdfPage } from "@/lib/pdf/theme";
import { createPdfDocument, renderPdfToBuffer } from "@/lib/pdf/render";
import { renderQrCodePng } from "@/lib/pdf/qrcode";
import { resolveHeroImage } from "@/lib/pdf/hero-image";
import { PdfFlow, stampPdfFooters } from "@/lib/pdf/layout";
import {
  pdfPageBackground,
  drawPdfHero,
  drawExperienceTicket,
  drawPdfInfoItem,
  drawPdfGuestDetails,
  drawPdfWhatsAppPanel,
  drawPdfPolicyRow,
  drawPdfImageFooter,
  drawStatusBadge,
  drawPriceBlock,
  drawQrCodeBlock,
  pdfWrite,
  pdfTextHeight,
  pdfLabelValue,
  drawTableRow,
  statusToneFor,
  type TableColumn,
} from "@/lib/pdf/components";

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
  /** Selects the PDF hero photo (see lib/pdf/hero-image.ts); falls back to a generic destination photo when absent/unknown. */
  tourSlug?: string;
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
    policyHeadings: ["Cancellation", "Late arrival & no-show", "Operator changes", "Guest responsibility", "Diving requirements"],
    metaLabels: ["DATE", "DEPARTURE", "TRAVELERS", "MEETING POINT"],
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
    policyHeadings: ["Stornierung", "Verspätung & Nichterscheinen", "Änderungen durch den Anbieter", "So stornierst oder änderst du"],
    metaLabels: ["DATUM", "ABFAHRT", "REISENDE", "TREFFPUNKT"],
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
    policyHeadings: ["Отмена", "Опоздание и неявка", "Изменения от оператора", "Как отменить или изменить"],
    metaLabels: ["ДАТА", "ОТПРАВЛЕНИЕ", "УЧАСТНИКИ", "МЕСТО ВСТРЕЧИ"],
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
    policyHeadings: ["الإلغاء", "التأخر وعدم الحضور", "تغييرات المشغل", "كيفية الإلغاء أو التعديل"],
    metaLabels: ["التاريخ", "المغادرة", "المسافرون", "نقطة التجمع"],
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
    policyHeadings: ["Anulowanie", "Spóźnienie i brak stawiennictwa", "Zmiany operatora", "Jak anulować lub zmienić"],
    metaLabels: ["DATA", "WYJAZD", "UCZESTNICY", "MIEJSCE ZBIÓRKI"],
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
    policyHeadings: ["取消", "迟到和未到场", "运营商变更", "如何取消或更改"],
    metaLabels: ["日期", "出发时间", "出行人数", "集合地点"],
  },
} as const;

/**
 * A self-contained, branded PDF voucher with embedded Unicode fonts so the
 * customer's booking language and entered details survive intact. The
 * booking-reference card uses the ticket/boarding-pass motif (a QR code that
 * opens a pre-filled WhatsApp support chat) — see lib/pdf/components.ts.
 */
export async function createInvoicePdf(invoice: InvoiceData): Promise<Buffer> {
  const locale = bookingLocale(invoice.locale);
  const t = confirmationCopy[locale];
  const money = locale === "ar"
    ? `${invoice.amount.toFixed(2)} ${invoice.currency.toUpperCase()}`
    : formatMoney(invoice.amount, invoice.currency, locale);
  const quantity = Math.max(Number(invoice.quantity) || 1, 1);
  const issuedDate = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : locale, { day: "2-digit", month: "short", year: "numeric" }).format(invoice.issuedAt);
  const rtl = locale === "ar";
  const qrPng = await renderQrCodePng(buildWhatsAppLink(whatsappNumber, `Daily Red Sea booking ${invoice.reference}`));
  const heroImage = resolveHeroImage(invoice.tourSlug, invoice.itemName);

  const doc = createPdfDocument({ title: `${t.confirmation} - ${invoice.reference}`, locale, createdAt: invoice.issuedAt });
  const margin = pdfPage.margin;
  const contentWidth = pdfPage.width - margin * 2;

  // --- Page 1: photographic hero + one dominant ticket + two supporting blocks ---
  doc.addPage();
  pdfPageBackground(doc);
  const heroHeight = 235;
  drawPdfHero(doc, { image: heroImage, height: heroHeight, title: t.confirmation, subtitle: `${t.issued}: ${issuedDate}  ·  ${invoice.reference}`, rtl });

  const ticketY = heroHeight + 12;
  const ticketHeight = 300;
  const ticket = drawExperienceTicket(doc, { x: margin, y: ticketY, width: contentWidth, height: ticketHeight, rtl });
  const padLeft = 26;
  const infoX = ticket.leftX + padLeft;
  const infoWidth = ticket.leftWidth - padLeft * 2;

  pdfWrite(doc, "EXPERIENCE PASS", infoX, ticketY + 24, infoWidth, { size: 8.5, color: pdfColors.coral, rtl, bold: true, letterSpacing: 1.2 });
  pdfWrite(doc, destinationCue(invoice.itemName), infoX, ticketY + 38, infoWidth, { size: 8, color: pdfColors.muted, rtl, letterSpacing: 0.6 });
  const titleY = ticketY + 60;
  pdfWrite(doc, invoice.itemName || "Daily Red Sea", infoX, titleY, infoWidth, { size: 17, color: pdfColors.navy, rtl, bold: true, lineGap: 2 });
  const titleHeight = pdfTextHeight(doc, invoice.itemName || "Daily Red Sea", infoWidth, 17, rtl, 2);

  const metaY = titleY + titleHeight + 24;
  const metaGap = 14;
  const metaColWidth = invoice.tripLines?.length ? infoWidth : (infoWidth - metaGap * 3) / 4;
  const metaItems: { icon: "calendar" | "clock" | "people" | "pin"; label: string; value: string }[] = invoice.tripLines?.length
    ? [{ icon: "calendar", label: t.metaLabels[0], value: invoice.tripLines[0] || t.pending }]
    : [
      { icon: "calendar", label: t.metaLabels[0], value: invoice.date || t.pending },
      { icon: "clock", label: t.metaLabels[1], value: invoice.time || t.pending },
      { icon: "people", label: t.metaLabels[2], value: invoice.travelerSummary || `${quantity}` },
      { icon: "pin", label: t.metaLabels[3], value: invoice.hotel || t.pending },
    ];
  metaItems.forEach((item, index) => {
    const colX = rtl ? infoX + infoWidth - metaColWidth - index * (metaColWidth + metaGap) : infoX + index * (metaColWidth + metaGap);
    drawPdfInfoItem(doc, { ...item, x: colX, y: metaY, width: metaColWidth, rtl });
  });

  // Stub: reference, QR (opens a pre-filled WhatsApp chat), payment status, total.
  const stubPad = 18;
  const stubInnerX = ticket.stubX + stubPad;
  const stubInnerWidth = ticket.stubWidth - stubPad * 2;
  let stubY = ticket.top + 24;
  pdfLabelValue(doc, t.reference, invoice.reference, stubInnerX, stubY, stubInnerWidth, { rtl, labelColor: "#9FC3D6", valueColor: pdfColors.white });
  stubY += 34;
  const qrSize = Math.min(76, stubInnerWidth);
  drawQrCodeBlock(doc, qrPng, stubInnerX + (stubInnerWidth - qrSize) / 2, stubY, qrSize);
  stubY += qrSize + 16;
  drawStatusBadge(doc, t.cash, stubInnerX, stubY, stubInnerWidth, 22, "positive", rtl);
  stubY += 34;
  pdfWrite(doc, t.total, stubInnerX, stubY, stubInnerWidth, { size: 8, color: "#9FC3D6", rtl, letterSpacing: 0.3 });
  pdfWrite(doc, money, stubInnerX, stubY + 12, stubInnerWidth, { size: 19, color: pdfColors.white, rtl, bold: true });
  pdfWrite(doc, t.paymentNote, stubInnerX, stubY + 36, stubInnerWidth, { size: 7, color: "#cfe3ee", rtl, wrap: true, lineGap: 2 });

  // Two supporting blocks only — everything else lives inside the ticket.
  const guestY = ticketY + ticketHeight + 20;
  const guestWidth = contentWidth * 0.42;
  const supportWidth = contentWidth - guestWidth - 12;
  const cardHeight = 188;
  const guestX = rtl ? margin + contentWidth - guestWidth : margin;
  const supportX = rtl ? margin : margin + guestWidth + 12;
  drawPdfGuestDetails(doc, {
    title: t.guest, name: invoice.customerName || t.pending, whatsapp: invoice.customerPhone || t.pending, email: invoice.customerEmail || t.pending,
    x: guestX, y: guestY, width: guestWidth, height: cardHeight, rtl,
  });
  drawPdfWhatsAppPanel(doc, { title: t.next, body: t.steps, cta: ({ en: "Chat with us on WhatsApp", de: "Schreib uns auf WhatsApp", ru: "Напишите нам в WhatsApp", ar: "تواصل معنا عبر واتساب", pl: "Napisz do nas na WhatsApp", zh: "通过 WhatsApp 联系我们" })[locale], x: supportX, y: guestY, width: supportWidth, height: cardHeight, rtl });
  doc.link(supportX, guestY, supportWidth, cardHeight, buildWhatsAppLink(whatsappNumber, `Daily Red Sea booking ${invoice.reference}`));
  pdfWrite(doc, t.thanks, margin, guestY + cardHeight + 16, contentWidth, { size: 8, color: pdfColors.muted, align: "center", rtl });

  // Preserve every itinerary entry from multi-trip bookings on flow-managed pages.
  if (invoice.tripLines && invoice.tripLines.length > 1) {
    const itinerary = new PdfFlow(doc, { header: { variant: "policy", title: t.metaLabels[0], rtl }, bottomMargin: 88 });
    itinerary.newPage();
    for (const line of invoice.tripLines) {
      const height = pdfTextHeight(doc, line, contentWidth, 11, rtl, 3) + 20;
      itinerary.ensure(height);
      pdfWrite(doc, line, margin, itinerary.y, contentWidth, { size: 11, rtl, wrap: true, lineGap: 3 });
      itinerary.advance(height);
    }
  }

  // --- Page 2: compact header + five policy rows (not paragraphs) + branded footer ---
  const policy = new PdfFlow(doc, { header: { variant: "policy", title: t.policy, rtl }, bottomMargin: 88 });
  policy.newPage();
  const policyParagraphs = locale === "en" ? getCancellationPolicyParagraphs() : t.policyParagraphs;
  policyParagraphs.forEach((paragraph, index) => {
    const heading = t.policyHeadings[index] || t.policy;
    policy.ensure(pdfTextHeight(doc, paragraph, contentWidth - 206, 9.5, rtl, 3.5) + 30);
    const consumed = drawPdfPolicyRow(doc, { icon: index, heading, body: paragraph, x: margin, y: policy.y, width: contentWidth, rtl });
    policy.advance(consumed);
  });
  stampPdfFooters(doc, { reference: invoice.reference, rtl });
  const pageCount = doc.bufferedPageRange().count;
  for (let index = 1; index < pageCount; index++) {
    doc.switchToPage(index);
    drawPdfImageFooter(doc, { image: resolveHeroImage("full-day-diving"), reference: invoice.reference, page: index + 1, totalPages: pageCount, rtl });
  }

  doc.end();
  return renderPdfToBuffer(doc);
}

function destinationCue(itemName: string) {
  const name = (itemName || "").toLowerCase();
  if (name.includes("jeddah")) return "JEDDAH  /  RED SEA";
  if (name.includes("luxor") || name.includes("cairo") || name.includes("karnak")) return "HURGHADA  /  NILE VALLEY";
  if (name.includes("marsa")) return "MARSA ALAM  /  RED SEA";
  return "HURGHADA  /  RED SEA";
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

/**
 * A branded status voucher rendered with the embedded Noto family so the
 * customer's booking language survives in its native script (Cyrillic, Arabic
 * and CJK included), matching createInvoicePdf.
 */
export async function createBookingStatusPdf(booking: BookingStatusPdfData): Promise<Buffer> {
  const locale = bookingLocale(booking.locale);
  const t = statusPdfCopy[locale];
  const p = statusPricingCopy[locale];
  const rtl = locale === "ar";
  const margin = pdfPage.margin;
  const contentWidth = pdfPage.width - margin * 2;
  const subtotal = booking.subtotal != null && Number.isFinite(booking.subtotal) ? booking.subtotal : null;
  const discount = booking.discountAmount != null && Number.isFinite(booking.discountAmount) ? booking.discountAmount : null;
  const snapshot = readPricingSnapshot(booking.pricingSnapshot, booking.currency, subtotal);
  const historicalTrips = !snapshot && booking.itemName.startsWith("Multi-trip booking:") ? historicalTripParticipants(booking.historicalNotes) : [];
  const money = (amount: number) => rtl ? `${amount.toFixed(2)} ${booking.currency.toUpperCase()}` : formatMoney(amount, booking.currency, locale);
  const generatedDate = rtl ? booking.generatedAt.toISOString().slice(0, 10) : new Intl.DateTimeFormat(locale === "en" ? "en-GB" : locale, { day: "2-digit", month: "short", year: "numeric" }).format(booking.generatedAt);

  const doc = createPdfDocument({ title: `${t.statusUpdate} - ${booking.reference}`, locale, createdAt: booking.generatedAt });
  const flow = new PdfFlow(doc, { header: { variant: "compact", title: t.statusUpdate, subtitle: `${booking.reference} | ${generatedDate}`, rtl }, bottomMargin: 56 });

  const write = (value: string, width: number, x: number, size = 10, color: string = pdfColors.text) => pdfWrite(doc, value, x, flow.y, width, { size, color, rtl, wrap: true });
  const paragraphHeight = (value: string, width: number, size: number) => pdfTextHeight(doc, value, width, size, rtl, 3);
  const paragraph = (value: string, size = 10, color: string = pdfColors.text) => {
    const h = paragraphHeight(value, contentWidth, size);
    flow.ensure(h + 12);
    write(value, contentWidth, margin, size, color);
    flow.advance(h + 10);
  };
  const heading = (value: string) => { flow.ensure(70); paragraph(value, 12, pdfColors.navy); };
  const detail = (label: string, value: string) => {
    if (!rtl) { paragraph(`${label}: ${value}`); return; }
    const h = Math.max(paragraphHeight(label, 190, 10), paragraphHeight(value, 260, 10));
    flow.ensure(h + 12);
    pdfWrite(doc, label, margin + 293, flow.y, 190, { size: 10, color: pdfColors.muted, rtl });
    pdfWrite(doc, value, margin, flow.y, 260, { size: 10, color: pdfColors.text, rtl });
    flow.advance(h + 10);
  };
  const participants = (counts: unknown, guests?: number | null) => {
    if (validParticipantCounts(counts, guests)) {
      paragraph(`${p.adults}: ${counts.adults} | ${p.youth}: ${counts.youth} | ${p.infants}: ${counts.infants}`);
    } else {
      paragraph(`${guests == null ? "" : `${p.guests}: ${guests}. `}${p.unknownParticipants}`, 9, pdfColors.muted);
    }
  };

  flow.newPage();
  heading(t.current);
  for (const [label, value, status] of [
    [t.booking, t.statusLabel[booking.bookingStatus] || t.pending, booking.bookingStatus],
    [t.payment, t.paymentLabel[booking.paymentStatus] || t.pending, booking.paymentStatus],
  ]) {
    const h = paragraphHeight(`${label}: ${value}`, contentWidth, 11) + 18;
    flow.ensure(h + 8);
    drawStatusBadge(doc, `${label}: ${value}`, margin, flow.y - 4, contentWidth, h, statusToneFor(status), rtl);
    flow.advance(h + 8);
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
    paragraph(`${trip.name} | ${trip.date} | ${trip.time}`, 10, pdfColors.navy);
    participants(trip.participants);
  }
  detail(t.pickup, booking.pickup || t.pending);
  if (booking.assignedPersonName) detail(booking.assignedPersonRole === "driver" ? t.assignedDriver : t.assignedGuide, booking.assignedPersonName);
  heading(rtl ? p.pricing : `${p.pricing} (${booking.currency.toUpperCase()})`);
  const columns: TableColumn[] = rtl
    ? [{ label: p.item, width: 222, align: "right" }, { label: p.quantity, width: 55, align: "right" }, { label: p.unit, width: 95, align: "right" }, { label: p.lineTotal, width: 95, align: "right" }]
    : [{ label: p.item, width: 222, align: "left" }, { label: p.quantity, width: 55, align: "right" }, { label: p.unit, width: 95, align: "right" }, { label: p.lineTotal, width: 95, align: "right" }];
  const tableHeader = () => { const h = drawTableRow(doc, [p.item, p.quantity, p.unit, p.lineTotal], columns, margin, flow.y, { header: true, rtl }); flow.advance(h); };
  if (snapshot) {
    for (const trip of snapshot.trips) {
      flow.ensure(150);
      paragraph(trip.name, 11, pdfColors.navy);
      if (trip.date) paragraph(`${trip.date}${trip.time ? ` | ${trip.time}` : ""}`, 9);
      participants(trip.participants, trip.guests);
      if (snapshot.pending) { paragraph(p.pending); continue; }
      tableHeader();
      let zebra = false;
      for (const line of trip.lines) {
        const label = `${p[line.kind]}${line.label ? ` - ${line.label}` : ""}`;
        const values = [label, String(line.quantity), money(line.unitPrice), money(line.total)];
        const needed = Math.max(...values.map((v, i) => paragraphHeight(v, columns[i].width - 10, 9))) + 16;
        if (flow.y + needed > pdfPage.height - 56) { flow.newPage(); paragraph(trip.name, 11, pdfColors.navy); tableHeader(); }
        const h = drawTableRow(doc, values, columns, margin, flow.y, { zebra, rtl });
        flow.advance(h);
        zebra = !zebra;
      }
      flow.advance(14);
    }
  } else paragraph(p.unknownPrices, 10, pdfColors.muted);
  flow.ensure(180);
  if (!snapshot?.pending) {
    detail(p.subtotal, subtotal === null ? t.pending : money(subtotal));
    if (booking.promoCode) detail(p.promo, booking.promoCode);
    else paragraph(subtotal !== null && discount === 0 ? p.noPromo : p.unknownPromo);
    detail(p.discount, discount === null ? t.pending : money(discount));
    if (subtotal !== null && discount !== null && Math.abs(subtotal - discount - booking.amount) > 0.011) paragraph(p.inconsistent, 9, "#92400e");
  }
  const total = snapshot?.pending ? p.pending : money(booking.amount);
  const totalHeight = Math.max(paragraphHeight(t.total, 220, 12), paragraphHeight(total, 230, 17)) + 28;
  flow.ensure(totalHeight + 12);
  drawPriceBlock(doc, t.total, total, undefined, margin, flow.y, contentWidth, totalHeight, rtl);
  flow.advance(totalHeight + 16);
  if (!snapshot?.pending) paragraph(t.paymentNote[booking.paymentStatus === "paid" ? "paid" : booking.paymentStatus === "refunded" ? "refunded" : "default"], 9, pdfColors.muted);
  flow.ensure(100);
  heading(t.help);
  paragraph(t.helpBody, 9, pdfColors.muted);
  paragraph(t.policyLine, 8, pdfColors.muted);
  stampPdfFooters(doc, { reference: booking.reference, rtl });

  doc.end();
  return renderPdfToBuffer(doc);
}

function formatMoney(amount: number, currency: string, locale = "en") { try { return new Intl.NumberFormat(locale, { style: "currency", currency: currency.toUpperCase() }).format(amount); } catch { return `${amount.toFixed(2)} ${currency.toUpperCase()}`; } }
