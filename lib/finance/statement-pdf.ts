import { pdfColors, pdfPage } from "@/lib/pdf/theme";
import { createPdfDocument, renderPdfToBuffer } from "@/lib/pdf/render";
import { PdfFlow, stampPdfFooters } from "@/lib/pdf/layout";
import { drawInfoGrid, drawTableRow, pdfTextHeight, pdfWrite, type TableColumn } from "@/lib/pdf/components";
import { registerAllScriptFonts } from "@/lib/pdf/script-font";
import { formatMoney } from "@/lib/finance/money";
import { entryTypeLabels, formatBalances, type Statement } from "@/lib/finance/supplier-ledger";

const columns: TableColumn[] = [
  { label: "Date", width: 58 },
  { label: "Type", width: 108 },
  { label: "Booking", width: 72 },
  { label: "Note", width: 125 },
  { label: "Amount", width: 76, align: "right" },
  { label: "Balance", width: 76, align: "right" },
];

/** Supplier statement to send by WhatsApp; same branded layout as the admin situation report. */
export async function createSupplierStatementPdf(statement: Statement): Promise<Buffer> {
  const doc = createPdfDocument({ title: `Daily Red Sea - Statement - ${statement.supplierName}`, locale: "en" });
  registerAllScriptFonts(doc);
  const margin = pdfPage.margin;
  const contentWidth = pdfPage.width - margin * 2;
  const flow = new PdfFlow(doc, {
    header: { variant: "compact", title: `Supplier statement · ${statement.supplierName}`, subtitle: `Period: ${statement.from} to ${statement.to}  |  Generated: ${statement.generatedAt}` },
    bottomMargin: 48,
  });
  flow.newPage();

  const usdNote = statement.closingUsd.missing.length ? ` (no current rate for ${statement.closingUsd.missing.join(", ")})` : "";
  const summary: [string, string][] = [
    ["Opening balance", formatBalances(statement.opening)],
    ["Closing balance", formatBalances(statement.closing)],
    ["Position (USD, latest rates)", statement.label.text + usdNote],
    ["How to read", "Positive = supplier owes Daily Red Sea. Negative = Daily Red Sea owes the supplier."],
  ];
  flow.advance(drawInfoGrid(doc, summary, margin, flow.y, contentWidth, false, 34) + 18);

  const header = () => flow.advance(drawTableRow(doc, columns.map((column) => column.label), columns, margin, flow.y, { header: true }));
  header();
  if (!statement.rows.length) pdfWrite(doc, "No entries in this period.", margin, flow.y + 8, contentWidth, { size: 10, color: pdfColors.muted });
  let zebra = false;
  for (const row of statement.rows) {
    const note = [row.reversed ? "[reversed]" : "", row.note || ""].filter(Boolean).join(" ");
    const values = [row.entry_date, entryTypeLabels[row.entry_type], row.booking_reference || "-", note || "-", formatMoney(row.amount, row.currency), formatMoney(row.running_balance, row.currency)];
    const needed = Math.max(...values.map((value, index) => pdfTextHeight(doc, value, columns[index].width - 10, 9))) + 16;
    if (flow.y + needed > pdfPage.height - 48) { flow.newPage(); header(); zebra = false; }
    flow.advance(drawTableRow(doc, values, columns, margin, flow.y, { zebra }));
    zebra = !zebra;
  }

  stampPdfFooters(doc, { reference: statement.supplierName });
  doc.end();
  return renderPdfToBuffer(doc);
}
