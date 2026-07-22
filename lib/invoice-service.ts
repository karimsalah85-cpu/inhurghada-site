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

/**
 * Creates a small, standards-compliant one-page PDF without depending on
 * runtime font files. This is important on serverless hosts where PDFKit's
 * built-in Helvetica AFM file is not always bundled with the function.
 */
export function createInvoicePdf(invoice: InvoiceData): Promise<Buffer> {
  const money = formatMoney(invoice.amount, invoice.currency);
  const quantity = Math.max(Number(invoice.quantity) || 1, 1);
  const unitMoney = formatMoney(invoice.amount / quantity, invoice.currency);
  const issuedDate = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(invoice.issuedAt);
  const lines = [
    ["DAILY RED SEA", 26, true],
    ["Tours, transfers and Red Sea experiences · Hurghada, Egypt", 10, false],
    ["", 12, false],
    ["BOOKING CONFIRMATION", 19, true],
    [`Reference: ${invoice.reference}`, 11, true],
    [`Issued: ${issuedDate}`, 10, false],
    [`Payment: ${invoice.paymentMethod || "Cash on arrival"}`, 10, false],
    ["", 10, false],
    ["Guest details", 13, true],
    [`Name: ${invoice.customerName || "Guest"}`, 10, false],
    invoice.customerEmail ? `Email: ${invoice.customerEmail}` : "",
    invoice.customerPhone ? `WhatsApp: ${invoice.customerPhone}` : "",
    ["", 10, false],
    ["Booking summary", 13, true],
    [`Experience: ${invoice.itemName}`, 10, false],
    invoice.date ? `Date: ${invoice.date}` : "",
    invoice.hotel ? `Pickup: ${invoice.hotel}` : "",
    [`Travelers: ${quantity}`, 10, false],
    [`Unit price: ${unitMoney}`, 10, false],
    [`TOTAL: ${money}`, 15, true],
    ["", 10, false],
    ["No tax has been charged. Daily Red Sea is not currently VAT registered.", 9, false],
    ["Please keep this confirmation and show your reference if requested.", 9, false],
    ["We will confirm your pickup details on WhatsApp before the experience.", 9, false],
  ]
    .filter(Boolean)
    .map((line) => Array.isArray(line) ? line : [line, 10, false]) as Array<[string, number, boolean]>;

  const commands: string[] = ["BT", "50 790 Td"];
  for (const [value, size, bold] of lines) {
    commands.push(`/${bold ? "F2" : "F1"} ${size} Tf`, `(${escapePdf(value)}) Tj`, `0 -${Math.max(size + 7, 16)} Td`);
  }
  commands.push("ET");

  const stream = commands.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "binary"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, "binary");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Promise.resolve(Buffer.from(pdf, "binary"));
}

function escapePdf(value: string) {
  return value
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency: currency.toUpperCase() }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency.toUpperCase()}`;
  }
}
