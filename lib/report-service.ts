import { pdfColors, pdfPage } from "@/lib/pdf/theme";
import { createPdfDocument, renderPdfToBuffer } from "@/lib/pdf/render";
import { PdfFlow, stampPdfFooters } from "@/lib/pdf/layout";
import { drawPdfSummaryCard, drawTableRow, pdfWrite, pdfTextHeight, type TableColumn } from "@/lib/pdf/components";
import { registerAllScriptFonts } from "@/lib/pdf/script-font";

export type ReportPdfRow = {
  reference: string;
  trip: string;
  serviceDate: string;
  people: number;
  status: string;
  paymentStatus?: string;
  amount: number;
  currency: string;
};

type ReportPdfData = {
  from: string;
  to: string;
  trip: string;
  status: string;
  payment?: string;
  generatedAt: string;
  bookings: number;
  customers?: number;
  people: number;
  cancelled: number;
  revenue: number;
  revenueLabel?: string;
  rows: ReportPdfRow[];
};

const columns: TableColumn[] = [
  { label: "Reference", width: 96, align: "left" },
  { label: "Trip", width: 138, align: "left" },
  { label: "Service date", width: 64, align: "left" },
  { label: "People", width: 40, align: "right" },
  { label: "Booking", width: 58, align: "left" },
  { label: "Payment", width: 50, align: "left" },
  { label: "Amount", width: 69, align: "right" },
];

/**
 * Admin "situation report" export. Previously hand-wrote raw PDF bytes with
 * only the built-in Courier font (non-ASCII characters silently became "?");
 * now it is laid out like the text pages of the booking confirmation — the
 * same white brand header, summary card, table and photo strip footer — and
 * the embedded Noto font gives it real Unicode support.
 */
export async function createReportPdf(report: ReportPdfData): Promise<Buffer> {
  const doc = createPdfDocument({ title: "Daily Red Sea - Situation report", locale: "en" });
  // Trip/customer names in this admin export come from real bookings and can
  // be in any script, unlike the single-locale customer PDFs — register every
  // embedded face so pdfWrite's per-cell script detection has real coverage.
  registerAllScriptFonts(doc);
  const margin = pdfPage.margin;
  const contentWidth = pdfPage.width - margin * 2;
  const flow = new PdfFlow(doc, {
    header: { title: "Situation report", subtitle: `Period: ${report.from} to ${report.to}   ·   Generated: ${report.generatedAt}` },
  });

  flow.newPage();
  const summaryRows: [string, string][] = [
    ["Bookings", String(report.bookings)],
    ["Customers", String(report.customers ?? report.bookings)],
    ["Guests", String(report.people)],
    ["Cancelled", String(report.cancelled)],
    ["Revenue", report.revenueLabel || report.revenue.toFixed(2)],
    ["Filters", `Trip: ${report.trip}; Booking: ${report.status}; Payment: ${report.payment || "all"}`],
  ];
  const summaryHeight = drawPdfSummaryCard(doc, summaryRows, margin, flow.y, contentWidth);
  flow.advance(summaryHeight + 20);

  const tableHeader = () => {
    const h = drawTableRow(doc, columns.map((column) => column.label), columns, margin, flow.y, { header: true });
    flow.advance(h);
  };
  tableHeader();

  if (!report.rows.length) {
    pdfWrite(doc, "No bookings match these filters.", margin, flow.y + 8, contentWidth, { size: 10, color: pdfColors.muted });
  }
  let zebra = false;
  for (const row of report.rows) {
    const values = [row.reference, row.trip, row.serviceDate, String(row.people), row.status, row.paymentStatus || "-", `${row.amount.toFixed(2)} ${row.currency}`];
    const needed = Math.max(...values.map((value, index) => pdfTextHeight(doc, value, columns[index].width - 10, 9))) + 16;
    if (flow.y + needed > flow.bottom) {
      flow.newPage();
      tableHeader();
      zebra = false;
    }
    const h = drawTableRow(doc, values, columns, margin, flow.y, { zebra });
    flow.advance(h);
    zebra = !zebra;
  }

  stampPdfFooters(doc, { imageFromPage: 0 });
  doc.end();
  return renderPdfToBuffer(doc);
}
