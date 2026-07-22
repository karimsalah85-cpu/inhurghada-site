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
};

type Color = [number, number, number];

const navy: Color = [15, 23, 42];
const blue: Color = [37, 99, 235];
const cyan: Color = [6, 182, 212];
const slate: Color = [71, 85, 105];
const muted: Color = [100, 116, 139];
const light: Color = [241, 245, 249];
const white: Color = [255, 255, 255];

/**
 * A self-contained, branded PDF voucher. It only uses the PDF core Helvetica
 * fonts, so it works reliably inside Vercel serverless functions.
 */
export function createInvoicePdf(invoice: InvoiceData): Promise<Buffer> {
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
  text(commands, "BOOKING CONFIRMATION", 50, 670, 17, true, white);
  text(commands, `Issued ${issuedDate}`, 50, 654, 9, false, [203, 213, 225]);
  roundedRect(commands, 413, 684, 149, 32, 8, [20, 83, 45]);
  text(commands, "CASH ON ARRIVAL", 428, 695, 10, true, [220, 252, 231]);

  roundedRect(commands, 50, 588, 512, 42, 8, white);
  text(commands, "BOOKING REFERENCE", 66, 609, 8.5, true, muted);
  text(commands, invoice.reference, 66, 594, 14, true, navy);
  text(commands, "Keep this reference for support and pickup confirmation", 265, 602, 9, false, slate);

  sectionCard(commands, 50, 450, 512, 118, "GUEST DETAILS");
  detail(commands, "Guest name", invoice.customerName || "Guest", 68, 518, 215);
  detail(commands, "WhatsApp", invoice.customerPhone || "To be confirmed", 310, 518, 220);
  detail(commands, "Email", invoice.customerEmail || "To be confirmed", 68, 476, 430);

  sectionCard(commands, 50, 267, 512, 163, "EXPERIENCE DETAILS");
  const itemLines = wrap(invoice.itemName || "Daily Red Sea booking", 48);
  text(commands, itemLines[0], 68, 380, 14, true, navy);
  if (itemLines[1]) text(commands, itemLines[1], 68, 363, 14, true, navy);
  detail(commands, "Experience date", invoice.date || "To be confirmed", 68, 334, 205);
  detail(commands, "Departure time", invoice.time || "To be confirmed", 310, 334, 195);
  detail(commands, "Travelers", invoice.travelerSummary || `${quantity} traveler${quantity === 1 ? "" : "s"}`, 68, 292, 205);
  detail(commands, "Pickup", invoice.hotel || "We will confirm via WhatsApp", 310, 292, 215);

  roundedRect(commands, 50, 180, 512, 67, 10, blue);
  text(commands, "TOTAL TO PAY", 68, 218, 9, true, [219, 234, 254]);
  text(commands, money, 68, 192, 24, true, white);
  text(commands, "Pay in cash when you arrive - no online payment collected", 285, 205, 9, false, [219, 234, 254]);

  roundedRect(commands, 50, 83, 512, 76, 10, white);
  text(commands, "WHAT HAPPENS NEXT", 68, 137, 9, true, blue);
  text(commands, "1. Keep this confirmation.  2. We confirm pickup by WhatsApp.  3. Show your reference when requested.", 68, 116, 8.8, false, slate);
  text(commands, "Daily Red Sea is not currently VAT registered. No tax has been charged.", 68, 96, 8.3, false, muted);
  text(commands, `Daily Red Sea  |  ${invoice.reference}  |  dailyredsea.com`, 50, 43, 8.5, false, muted);
  text(commands, "Thank you for choosing a Red Sea experience.", 310, 43, 8.5, false, muted);

  return Promise.resolve(buildPdf(commands.join("\n")));
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
function escapePdf(value: string) { return value.replace(/[^\x20-\x7E]/g, "?").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)"); }

function buildPdf(stream: string) {
  const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>", `<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`];
  let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n"; const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(pdf, "binary")); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xrefOffset = Buffer.byteLength(pdf, "binary");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, "binary");
}

function formatMoney(amount: number, currency: string) { try { return new Intl.NumberFormat("en", { style: "currency", currency: currency.toUpperCase() }).format(amount); } catch { return `${amount.toFixed(2)} ${currency.toUpperCase()}`; } }
