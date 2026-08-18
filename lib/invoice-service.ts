import { getCancellationPolicyParagraphs } from "@/lib/pdf-policy";
import { bookingLocale } from "@/lib/booking-communications-i18n";

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

/**
 * A self-contained, branded PDF voucher. It only uses the PDF core Helvetica
 * fonts, so it works reliably inside Vercel serverless functions.
 */
export function createInvoicePdf(invoice: InvoiceData): Promise<Buffer> {
  const locale = bookingLocale(invoice.locale);
  const t = pdfCopy[locale];
  const money = formatMoney(invoice.amount, invoice.currency);
  const quantity = Math.max(Number(invoice.quantity) || 1, 1);
  const issuedDate = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(invoice.issuedAt);
  const commands: string[] = [];

  rect(commands, 0, 0, 612, 792, light);
  rect(commands, 0, 644, 612, 148, navy);
  rect(commands, 0, 638, 612, 6, cyan);
  circle(commands, 78, 722, 27, blue);
  text(commands, "DR", 66, 714, 15, true, white);
  text(commands, "DAILY RED SEA", 122, 735, 22, true, white);
  text(commands, "TOURS AND TRANSFERS - HURGHADA, EGYPT", 122, 715, 8.5, false, [203, 213, 225]);
  text(commands, t.confirmation, 50, 670, 17, true, white);
  text(commands, `${t.issued} ${issuedDate}`, 50, 654, 9, false, [203, 213, 225]);
  roundedRect(commands, 413, 684, 149, 32, 8, [20, 83, 45]);
  text(commands, t.cash, 428, 695, 9, true, [220, 252, 231]);

  roundedRect(commands, 50, 588, 512, 42, 8, white);
  text(commands, t.reference, 66, 609, 8.5, true, muted);
  text(commands, invoice.reference, 66, 594, 14, true, navy);
  text(commands, "Keep this reference for support and pickup confirmation", 265, 602, 9, false, slate);

  sectionCard(commands, 50, 450, 512, 118, t.guest);
  detail(commands, t.guestName, invoice.customerName || "Guest", 68, 518, 215);
  detail(commands, "WhatsApp", invoice.customerPhone || t.pending, 310, 518, 220);
  detail(commands, "Email", invoice.customerEmail || t.pending, 68, 476, 430);

  sectionCard(commands, 50, 267, 512, 163, t.experience);
  const itemLines = wrap(invoice.itemName || "Daily Red Sea booking", 48);
  text(commands, itemLines[0], 68, 380, 14, true, navy);
  if (invoice.tripLines?.length) {
    invoice.tripLines.slice(0, 4).forEach((line, index) => text(commands, wrap(line, 82)[0], 68, 355 - index * 17, 9, false, slate));
    detail(commands, t.travelers, invoice.travelerSummary || `${quantity}`, 68, 292, 205);
    detail(commands, t.pickup, invoice.hotel || t.pending, 310, 292, 215);
  } else {
    if (itemLines[1]) text(commands, itemLines[1], 68, 363, 14, true, navy);
    detail(commands, t.date, invoice.date || t.pending, 68, 334, 205);
    detail(commands, t.time, invoice.time || t.pending, 310, 334, 195);
    detail(commands, t.travelers, invoice.travelerSummary || `${quantity}`, 68, 292, 205);
    detail(commands, t.pickup, invoice.hotel || t.pending, 310, 292, 215);
  }

  roundedRect(commands, 50, 180, 512, 67, 10, blue);
  text(commands, t.total, 68, 218, 9, true, [219, 234, 254]);
  text(commands, money, 68, 192, 24, true, white);
  text(commands, "Pay in cash when you arrive - no online payment collected", 285, 205, 9, false, [219, 234, 254]);

  roundedRect(commands, 50, 83, 512, 76, 10, white);
  text(commands, t.next, 68, 137, 9, true, blue);
  text(commands, "1. Keep this confirmation.  2. We confirm pickup by WhatsApp.  3. Show your reference when requested.", 68, 116, 8.8, false, slate);
  text(commands, "Daily Red Sea is not currently VAT registered. No tax has been charged.", 68, 96, 8.3, false, muted);
  text(commands, `Daily Red Sea  |  ${invoice.reference}  |  dailyredsea.com`, 50, 43, 8.5, false, muted);
  text(commands, "Thank you for choosing a Red Sea experience.", 310, 43, 8.5, false, muted);

  const pages = [commands.join("\n"), ...createPolicyPages(invoice.reference)];
  return Promise.resolve(buildPdf(pages));
}

function createPolicyPages(reference: string): string[] {
  const pages: string[][] = [];
  let commands: string[] = [];
  let cursorY = 650;

  const startPage = () => {
    commands = [];
    rect(commands, 0, 0, 612, 792, light);
    roundedRect(commands, 50, 80, 512, 632, 10, white);
    text(commands, "CANCELLATION & REFUND POLICY", 68, 678, 9, true, blue);
    cursorY = 650;
  };

  const finishPage = () => {
    text(
      commands,
      `Daily Red Sea  |  ${reference}  |  dailyredsea.com`,
      50,
      43,
      8.5,
      false,
      muted,
    );
    pages.push(commands);
  };

  startPage();

  for (const paragraph of getCancellationPolicyParagraphs()) {
    const lines = wrap(paragraph, 92);
    const paragraphHeight = lines.length * 14 + 12;

    // Keep each paragraph together; page breaks only occur between paragraphs.
    if (cursorY - paragraphHeight < 105) {
      finishPage();
      startPage();
    }

    lines.forEach((line, index) => {
      text(commands, line, 68, cursorY - index * 14, 9, false, slate);
    });
    cursorY -= paragraphHeight;
  }

  finishPage();
  return pages.map((page) => page.join("\n"));
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

function formatMoney(amount: number, currency: string) { try { return new Intl.NumberFormat("en", { style: "currency", currency: currency.toUpperCase() }).format(amount); } catch { return `${amount.toFixed(2)} ${currency.toUpperCase()}`; } }
