import { emailTheme, renderEmail, emailIntro, emailParagraph, emailRow, emailCard, emailCardTitle, emailDetails, emailHeading, emailPanel, escapeHtml as escape } from "@/lib/email/layout";
import { commissionPeriod, commissionTotals, type CommissionInvoice } from "./commission-invoice";
import { formatMoney } from "./money";

export function buildCommissionInvoiceEmail(invoice: CommissionInvoice, reference: string) {
  const totals = commissionTotals(invoice);
  const theme = emailTheme("en");
  const { palette } = theme;
  const money = (value: string) => escape(formatMoney(value, invoice.currency));
  const linked = Boolean(invoice.source);
  const headings = linked ? ["Date / Booking / Trip", "Customers", "Ticket price", "Total sales", "Original amount due", "Due to Daily Red Sea"] : ["Date / Trip", "Customers", "Ticket price", "Total sales", "Rate", "DRS commission"];
  const rows = totals.rows.map(row => {
    const values = linked ? [`${escape(row.date)}<br>${escape(row.bookingReference || "")}<br><strong>${escape(row.trip)}</strong>`, String(row.customers), money(row.ticketPrice), money(row.sales), `${escape(row.nativeCommission || "")} ${escape(row.nativeCurrency || "")}`, money(row.commission)] : [`${escape(row.date)}<br><strong>${escape(row.trip)}</strong>`, String(row.customers), money(row.ticketPrice), money(row.sales), `${escape(row.commissionPercent)}%`, money(row.commission)];
    return `<tr class="trip-row">${values.map((value, index) => `<td class="${index === 0 ? "trip-name" : "trip-value"}" style="padding:16px 5px;border-bottom:1px solid ${palette.line};text-align:${index === 0 ? "left" : "right"};vertical-align:top;${index === 0 ? "line-height:20px;" : ""}">${index ? `<span class="mobile-label" style="display:none;mso-hide:all;color:${palette.body};">${headings[index]}</span>` : ""}${value}</td>`).join("")}</tr>`;
  }).join("");

  const subject = `Daily Red Sea Commission Statement - ${commissionPeriod(invoice.period)} - ${invoice.partner}`;
  const tripTable = `<table class="trip-table" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:11px;line-height:18px;"><thead><tr>${headings.map((heading, index) => `<th style="padding:12px 5px;border-bottom:1px solid ${palette.line};color:${palette.body};font-size:10px;line-height:16px;text-align:${index === 0 ? "left" : "right"};">${heading}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>`;
  return { subject, html: renderEmail(theme, {
    title: subject,
    preheader: `${commissionPeriod(invoice.period)} · ${reference} · Commission ${formatMoney(totals.commission, invoice.currency)} ${invoice.currency}`,
    mastheadNote: { text: reference, ltr: true },
    signoff: "Thank you for your partnership,\nThe Daily Red Sea team",
    mobileCss: `.trip-table,.trip-table tbody,.trip-row{display:block!important;width:100%!important;box-sizing:border-box!important}.trip-table thead{display:none!important}.trip-row{padding:12px 0!important;border-bottom:1px solid ${palette.line}}.trip-name,.trip-value{display:block!important;width:100%!important;box-sizing:border-box!important;border:0!important;padding:4px 0!important;font-size:13px!important}.trip-name{padding-bottom:10px!important}.mobile-label{display:block!important;float:left;font-size:12px}`,
    rows: [
      emailIntro(theme, { eyebrow: "Partner statement", headline: "Commission Statement", body: [
        emailParagraph(theme, `Hello ${invoice.partner},`, { strong: true }),
        emailParagraph(theme, `Thank you for your business. This statement details the commission payable by ${invoice.partner} to Daily Red Sea for ${commissionPeriod(invoice.period)}. Please pay Daily Red Sea the amount shown below. The PDF is attached for your records.`, { last: true }),
      ] }),
      emailRow(emailCard(theme, `${emailCardTitle(theme, "Commission payable to Daily Red Sea")}<p style="margin:8px 0;font-size:32px;line-height:40px;font-weight:800;color:${palette.ink};">${money(totals.commission)} <span style="font-size:14px;">${escape(invoice.currency)}</span></p>${emailParagraph(theme, `${totals.customers} customers · ${formatMoney(totals.sales, invoice.currency)} total sales`, { last: true, small: true })}`), "0 42px 22px"),
      emailRow(emailDetails(theme, [
        { label: "Payable by", value: invoice.partner }, { label: "Payable to", value: "Daily Red Sea" }, { label: "Period", value: commissionPeriod(invoice.period) },
        { label: "City", value: invoice.city }, { label: "Currency", value: invoice.currency === "USD" ? "US Dollar (USD)" : invoice.currency },
      ]), "0 42px 26px"),
      emailRow(emailHeading(theme, "Trip breakdown") + tripTable + emailDetails(theme, [], { label: "Total payable to Daily Red Sea", value: `${formatMoney(totals.commission, invoice.currency)} ${invoice.currency}` }), "0 42px 30px"),
      invoice.source ? emailRow(emailParagraph(theme, "Current unpaid commission for trips in this month, after payments allocated to each booking. USD amounts use locked trip exchange rates; original-currency amounts are shown above. Record receipts against those original-currency balances. Ticket prices and sales are shown for reference; the amount due is the unpaid commission recorded for each booking.", { small: true }), "0 42px 20px") : "",
      invoice.notes ? emailRow(emailHeading(theme, "Payment instructions / notes") + emailParagraph(theme, invoice.notes), "0 42px 30px") : "",
      emailRow(emailPanel(theme, { lead: "Here to help.", body: "Questions about this statement? Reply to this email and our team will help." }), "0 42px 30px"),
    ],
  }) };
}
