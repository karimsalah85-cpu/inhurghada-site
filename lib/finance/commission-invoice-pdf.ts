import { createPdfDocument, renderPdfToBuffer } from "@/lib/pdf/render";
import { PdfFlow, stampPdfFooters } from "@/lib/pdf/layout";
import { drawExperienceTicket, drawPdfHero, pdfPageBackground, drawTableRow, pdfTextHeight, pdfWrite, type TableColumn } from "@/lib/pdf/components";
import { resolveHeroImage } from "@/lib/pdf/hero-image";
import { registerAllScriptFonts } from "@/lib/pdf/script-font";
import { pdfColors, pdfPage } from "@/lib/pdf/theme";
import { formatMoney } from "./money";
import { commissionPeriod, commissionTotals, type CommissionInvoice } from "./commission-invoice";

export async function createCommissionInvoicePdf(invoice: CommissionInvoice, reference: string) {
  const doc = createPdfDocument({ title: `Daily Red Sea - Commission Statement - ${invoice.partner}`, locale: "en" });
  registerAllScriptFonts(doc);
  const width = pdfPage.width - 2 * pdfPage.margin;
  const flow = new PdfFlow(doc, { header: { title: "Commission Statement", subtitle: reference }, bottomMargin: 80 });
  const totals = commissionTotals(invoice);
  const hero = resolveHeroImage(invoice.city.toLowerCase() === "jeddah" ? "jeddah-yacht-sunset-cruise" : undefined);
  doc.addPage();
  pdfPageBackground(doc);
  flow.page = 1;
  drawPdfHero(doc, { image: hero, height: 185, title: "Commission Statement", subtitle: `${commissionPeriod(invoice.period)}  ·  ${reference}` });
  const partnerHeight = pdfTextHeight(doc, invoice.partner, width * 0.7 - 48, 18);
  const ticketHeight = Math.max(142, partnerHeight + 94);
  const ticket = drawExperienceTicket(doc, { x: pdfPage.margin, y: 201, width, height: ticketHeight });
  const infoX = ticket.leftX + 24;
  pdfWrite(doc, "PAYABLE BY", infoX, 221, ticket.leftWidth - 48, { size: 8, color: pdfColors.coral, letterSpacing: 1.2 });
  pdfWrite(doc, invoice.partner, infoX, 241, ticket.leftWidth - 48, { size: 18, color: pdfColors.navy, bold: true });
  pdfWrite(doc, `${invoice.city}  ·  ${invoice.currency === "USD" ? "US Dollar (USD)" : invoice.currency}`, infoX, 251 + partnerHeight, ticket.leftWidth - 48, { size: 10, color: pdfColors.muted });
  pdfWrite(doc, `${totals.customers} customers  ·  ${invoice.rows.length} trip entries`, infoX, 274 + partnerHeight, ticket.leftWidth - 48, { size: 9, color: pdfColors.muted });
  const stubX = ticket.stubX + 18;
  const stubWidth = ticket.stubWidth - 36;
  pdfWrite(doc, "DAILY RED SEA", stubX, 225, stubWidth, { size: 8, color: "#9FC3D6", letterSpacing: 0.6 });
  pdfWrite(doc, "Commission due", stubX, 245, stubWidth, { size: 11, color: pdfColors.white });
  pdfWrite(doc, formatMoney(totals.commission, invoice.currency), stubX, 265, stubWidth, { size: 20, color: pdfColors.white, bold: true });
  pdfWrite(doc, invoice.currency, stubX, 301, stubWidth, { size: 9, color: "#9FC3D6" });
  flow.y = 201 + ticketHeight + 24;
  const intro = `Thank you for your business. ${invoice.partner} owes the commission below to Daily Red Sea.`;
  const introHeight = pdfTextHeight(doc, intro, width, 10) + 14;
  flow.ensure(introHeight); pdfWrite(doc, intro, pdfPage.margin, flow.y, width, { size: 10 }); flow.advance(introHeight);
  const linked = Boolean(invoice.source);
  const columns: TableColumn[] = linked ? [
    { label: "Date", width: 59 }, { label: "Booking / Trip", width: 180 }, { label: "Guests", width: 40, align: "right" },
    { label: "Booked sales", width: 75, align: "right" }, { label: "Original due", width: 75, align: "right" },
    { label: "DRS due", width: width - 429, align: "right" },
  ] : [
    { label: "Date", width: 59 }, { label: "Trip", width: 114, align: "left" }, { label: "Customers", width: 62, align: "right" },
    { label: "Ticket price", width: 64, align: "right" }, { label: "Total sales", width: 74, align: "right" },
    { label: "Rate", width: 43, align: "right" }, { label: "DRS commission", width: width - 416, align: "right" },
  ];
  const header = () => flow.advance(drawTableRow(doc, columns.map(c => c.label), columns, pdfPage.margin, flow.y, { header: true }));
  header();
  for (const [index, row] of totals.rows.entries()) {
    const date = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "2-digit", timeZone: "UTC" }).format(new Date(`${row.date}T12:00:00Z`));
    const values = linked ? [date, `${row.bookingReference}\n${row.trip}`, String(row.customers), formatMoney(row.sales, invoice.currency), `${row.nativeCommission} ${row.nativeCurrency}`, formatMoney(row.commission, invoice.currency)] : [date, row.trip, String(row.customers), formatMoney(row.ticketPrice, invoice.currency), formatMoney(row.sales, invoice.currency), `${row.commissionPercent}%`, formatMoney(row.commission, invoice.currency)];
    const height = Math.max(...values.map((v, i) => pdfTextHeight(doc, v, columns[i].width - 10, 9))) + 16;
    if (flow.y + height > pdfPage.height - 80) { flow.newPage(); header(); }
    flow.advance(drawTableRow(doc, values, columns, pdfPage.margin, flow.y, { zebra: index % 2 === 1 }));
  }
  flow.ensure(100);
  flow.advance(14);
  flow.advance(drawTableRow(doc, linked ? ["Total", "", String(totals.customers), formatMoney(totals.sales, invoice.currency), "", formatMoney(totals.commission, invoice.currency)] : ["Total", "", String(totals.customers), "", formatMoney(totals.sales, invoice.currency), "", formatMoney(totals.commission, invoice.currency)], columns, pdfPage.margin, flow.y, { header: true }));
  flow.advance(22);
  pdfWrite(doc, `Payable to Daily Red Sea: ${formatMoney(totals.commission, invoice.currency)} ${invoice.currency}`, pdfPage.margin, flow.y, width, { size: 16, bold: true, color: pdfColors.navy });
  flow.advance(25);
  if (linked) {
    const explanation = "Current unpaid commission after booking-linked payments. USD uses locked trip rates; original-currency balances are shown above. Record receipts in those currencies. Booked sales may differ from an agreed commission calculation basis.";
    const height = pdfTextHeight(doc, explanation, width, 9) + 14;
    flow.ensure(height); pdfWrite(doc, explanation, pdfPage.margin, flow.y, width, { size: 9 }); flow.advance(height);
  }
  if (invoice.notes) { const height = pdfTextHeight(doc, invoice.notes, width, 10) + 25; flow.ensure(height); flow.advance(18); pdfWrite(doc, invoice.notes, pdfPage.margin, flow.y, width, { size: 10 }); }
  stampPdfFooters(doc, { reference });
  doc.end();
  return renderPdfToBuffer(doc);
}
