export type ReportPdfRow = {
  reference: string;
  trip: string;
  serviceDate: string;
  people: number;
  status: string;
  amount: number;
  currency: string;
};

type ReportPdfData = {
  from: string;
  to: string;
  trip: string;
  status: string;
  generatedAt: string;
  bookings: number;
  people: number;
  cancelled: number;
  revenue: number;
  rows: ReportPdfRow[];
};

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const ROWS_ON_FIRST_PAGE = 40;
const ROWS_ON_LATER_PAGES = 49;

export function createReportPdf(report: ReportPdfData): Buffer {
  const pages: string[][] = [];
  let rowIndex = 0;

  do {
    const firstPage = pages.length === 0;
    const commands: string[] = [];
    const rowsOnPage = firstPage ? ROWS_ON_FIRST_PAGE : ROWS_ON_LATER_PAGES;

    commands.push("0.059 0.090 0.165 rg", `0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT} re f`);
    commands.push("1 1 1 rg", `36 36 ${PAGE_WIDTH - 72} ${PAGE_HEIGHT - 72} re f`);
    writeText(commands, "DAILY RED SEA - SITUATION REPORT", 52, 735, 18, true, [15, 23, 42]);
    writeText(commands, `Period: ${report.from} to ${report.to}`, 52, 712, 9, false, [71, 85, 105]);
    writeText(commands, `Generated: ${report.generatedAt}`, 325, 712, 8, false, [71, 85, 105]);

    let tableTop = 680;
    if (firstPage) {
      writeText(commands, `Bookings: ${report.bookings}`, 52, 679, 10, true, [15, 23, 42]);
      writeText(commands, `People: ${report.people}`, 185, 679, 10, true, [15, 23, 42]);
      writeText(commands, `Cancelled: ${report.cancelled}`, 300, 679, 10, true, [15, 23, 42]);
      writeText(commands, `Revenue: ${report.revenue.toFixed(2)}`, 430, 679, 10, true, [15, 23, 42]);
      writeText(commands, `Filters - Trip: ${shorten(report.trip, 55)}; Status: ${shorten(report.status, 18)}`, 52, 657, 8.5, false, [71, 85, 105]);
      tableTop = 630;
    }

    commands.push("0.145 0.388 0.922 rg", `46 ${tableTop - 5} 520 22 re f`);
    writeText(commands, "#  REFERENCE     SERVICE DATE  PPL  STATUS       AMOUNT       TRIP", 53, tableTop + 2, 7.7, true, [255, 255, 255]);

    const pageRows = report.rows.slice(rowIndex, rowIndex + rowsOnPage);
    pageRows.forEach((row, pageRowIndex) => {
      const y = tableTop - 24 - pageRowIndex * 12;
      if (pageRowIndex % 2 === 0) commands.push("0.946 0.961 0.976 rg", `46 ${y - 3} 520 12 re f`);
      const line = `${pad(String(rowIndex + pageRowIndex + 1), 3)}${pad(shorten(row.reference, 13), 15)}${pad(shorten(row.serviceDate, 12), 14)}${pad(String(row.people), 5)}${pad(shorten(row.status, 11), 13)}${pad(`${row.amount.toFixed(2)} ${shorten(row.currency, 3)}`, 13)}${shorten(row.trip, 30)}`;
      writeText(commands, line, 52, y, 7.2, false, [30, 41, 59]);
    });

    if (!pageRows.length) writeText(commands, "No bookings match these filters.", 52, tableTop - 32, 10, false, [100, 116, 139]);
    pages.push(commands);
    rowIndex += pageRows.length;
  } while (rowIndex < report.rows.length);

  return buildPdf(pages);
}

function writeText(commands: string[], value: string, x: number, y: number, size: number, bold: boolean, color: [number, number, number]) {
  commands.push(
    "BT",
    `/${bold ? "F2" : "F1"} ${size} Tf`,
    `${(color[0] / 255).toFixed(3)} ${(color[1] / 255).toFixed(3)} ${(color[2] / 255).toFixed(3)} rg`,
    `1 0 0 1 ${x} ${y} Tm`,
    `(${escapePdf(value)}) Tj`,
    "ET",
  );
}

function shorten(value: string, length: number) {
  const clean = String(value ?? "").replace(/\s+/g, " ").trim();
  return clean.length <= length ? clean : `${clean.slice(0, Math.max(0, length - 3))}...`;
}

function pad(value: string, length: number) {
  return value.length >= length ? value : value + " ".repeat(length - value.length);
}

function escapePdf(value: string) {
  return String(value)
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function buildPdf(pages: string[][]) {
  const fontRegularId = 3 + pages.length * 2;
  const fontBoldId = fontRegularId + 1;
  const pageIds = pages.map((_, index) => 3 + index * 2);
  const objects: string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`,
  ];

  pages.forEach((commands, index) => {
    const content = commands.join("\n");
    const contentId = 4 + index * 2;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    objects.push(`<< /Length ${Buffer.byteLength(content, "ascii")} >>\nstream\n${content}\nendstream`);
  });
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >>");

  let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "binary"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, "binary");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, "binary");
}
