import { pdfColors, pdfPage } from "@/lib/pdf/theme";
import { createPdfDocument, renderPdfToBuffer } from "@/lib/pdf/render";
import { PdfFlow, stampPdfFooters } from "@/lib/pdf/layout";
import { drawInfoGrid, drawTableRow, pdfWrite, pdfTextHeight, type TableColumn } from "@/lib/pdf/components";
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
  { label: "Reference", width: 85 },
  { label: "Trip", width: 140 },
  { label: "Service date", width: 62 },
  { label: "People", width: 35, align: "right" },
  { label: "Booking", width: 55 },
  { label: "Payment", width: 52 },
  { label: "Amount", width: 70, align: "right" },
];

/**
 * Admin "situation report" export. Previously hand-wrote raw PDF bytes with
 * only the built-in Courier font (non-ASCII characters silently became "?");
 * now shares the same theme, header/footer and Table component as every
 * customer-facing PDF, and the embedded Noto font gives it real Unicode support.
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
    header: { variant: "compact", title: "Situation report", subtitle: `Period: ${report.from} to ${report.to}  |  Generated: ${report.generatedAt}` },
    bottomMargin: 48,
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
  const summaryHeight = drawInfoGrid(doc, summaryRows, margin, flow.y, contentWidth, false, 34);
  flow.advance(summaryHeight + 18);

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
    if (flow.y + needed > pdfPage.height - 48) {
      flow.newPage();
      tableHeader();
      zebra = false;
    }
    const h = drawTableRow(doc, values, columns, margin, flow.y, { zebra });
    flow.advance(h);
    zebra = !zebra;
  }

  stampPdfFooters(doc);
  doc.end();
  return renderPdfToBuffer(doc);
}
