import PDFDocument from "pdfkit";

export type InvoiceData = {
  reference: string;
  issuedAt: Date;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  itemName: string;
  quantity: number;
  amount: number;
  currency: string;
  paymentMethod?: string;
  paymentId?: string;
  date?: string;
  hotel?: string;
};

const pageWidth = 612;
const margin = 55;
const blue = "#2563eb";
const slate = "#0f172a";
const muted = "#64748b";
const panel = "#e2e8f0";

export function createInvoicePdf(invoice: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const document = new PDFDocument({ size: "LETTER", margin, info: { Title: `Invoice ${invoice.reference}`, Author: "Daily Red Sea" } });
    const chunks: Buffer[] = [];

    document.on("data", (chunk: Buffer) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);

    const money = formatMoney(invoice.amount, invoice.currency);
    const unitMoney = formatMoney(invoice.amount / Math.max(invoice.quantity, 1), invoice.currency);
    const issuedDate = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(invoice.issuedAt);
    const contentWidth = pageWidth - margin * 2;

    document.font("Helvetica-Bold").fontSize(38).fillColor(blue).text("DAILY", margin, 58, { continued: true }).text(" RED SEA", { fill: true });
    document.font("Helvetica").fontSize(12).fillColor(slate).text("Hurghada, Egypt", margin, 108);
    document.fontSize(10).fillColor(muted).text("Tours, transfers and Red Sea experiences", margin, 126);

    document.font("Helvetica-Bold").fontSize(24).fillColor(blue).text("Invoice", 390, 64, { width: 167, align: "right" });
    document.rect(340, 104, 217, 110).fill(panel);
    writeLabelValue(document, "Invoice number", invoice.reference, 352, 118);
    writeLabelValue(document, "Total", money, 352, 142);
    writeLabelValue(document, "Date", issuedDate, 352, 166);
    writeLabelValue(document, "Payment", invoice.paymentMethod || "Stripe", 352, 190);

    document.rect(margin, 238, contentWidth, 30).fill(panel);
    document.font("Helvetica-Bold").fontSize(12).fillColor(slate).text("Bill to", margin + 12, 247);
    document.font("Helvetica").fontSize(12).fillColor(slate).text(invoice.customerName || "Guest", margin + 12, 279);
    if (invoice.customerEmail) document.fillColor(slate).text(invoice.customerEmail, margin + 12, 298);
    if (invoice.customerPhone) document.fillColor(slate).text(invoice.customerPhone, margin + 12, invoice.customerEmail ? 317 : 298);

    document.font("Helvetica-Bold").fontSize(14).fillColor(blue).text("Payment details", margin + 12, 365);
    document.rect(margin, 390, contentWidth, 30).fill(panel);
    document.font("Helvetica-Bold").fontSize(11).fillColor(slate).text("Item", margin + 12, 399);
    document.text("Qty", 360, 399, { width: 45, align: "right" });
    document.text("Unit price", 410, 399, { width: 80, align: "right" });
    document.text("Amount", 490, 399, { width: 67, align: "right" });

    document.font("Helvetica-Bold").fontSize(12).fillColor(slate).text(invoice.itemName, margin + 12, 433, { width: 315 });
    document.font("Helvetica").fontSize(11).fillColor(muted).text(invoice.date ? `Experience date: ${invoice.date}` : "Daily Red Sea booking", margin + 12, 454, { width: 315 });
    if (invoice.hotel) document.text(`Pickup: ${invoice.hotel}`, margin + 12, 471, { width: 315 });
    document.fontSize(12).fillColor(slate).text(String(invoice.quantity), 360, 433, { width: 45, align: "right" });
    document.text(unitMoney, 410, 433, { width: 80, align: "right" });
    document.text(money, 490, 433, { width: 67, align: "right" });

    document.rect(margin, 515, contentWidth, 38).fill(panel);
    document.font("Helvetica-Bold").fontSize(13).fillColor(slate).text("Total invoice:", margin + 12, 527);
    document.text(money, 430, 527, { width: 127, align: "right" });

    document.font("Helvetica-Bold").fontSize(14).fillColor(blue).text("Invoice information", margin + 12, 604);
    document.font("Helvetica").fontSize(11).fillColor(slate).text("Daily Red Sea is not currently VAT registered. No tax has been charged.", margin + 12, 630, { width: contentWidth - 24 });
    document.fillColor(muted).text("Thank you for booking with Daily Red Sea.", margin + 12, 658);
    if (invoice.paymentId) document.fontSize(9).text(`Stripe payment ID: ${invoice.paymentId}`, margin + 12, 684);

    document.fontSize(9).fillColor(muted).text(`1 / 1  |  ${invoice.reference}`, margin, 748, { width: contentWidth, align: "center" });
    document.end();
  });
}

function writeLabelValue(document: PDFKit.PDFDocument, label: string, value: string, x: number, y: number) {
  document.font("Helvetica-Bold").fontSize(11).fillColor(slate).text(`${label}:`, x, y, { continued: true });
  document.font("Helvetica").text(` ${value}`);
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency: currency.toUpperCase() }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency.toUpperCase()}`;
  }
}
