import { z } from "zod";
import { currencySchema, isoDateSchema, nonNegativeAmountSchema } from "./schemas";
import { fromMinor, toMinor } from "./money";

const text = (max: number) => z.string().trim().min(1).max(max).refine(value => !/[\u0000-\u001f]/.test(value), "Use plain text.");
export const commissionInvoiceSchema = z.object({
  partner: text(100), city: text(60),
  period: z.string().regex(/^20\d{2}-(0[1-9]|1[0-2])$/, "Choose a valid month."),
  currency: currencySchema,
  rows: z.array(z.object({
    date: isoDateSchema, trip: text(140), customers: z.number().int().min(1).max(10000),
    ticketPrice: nonNegativeAmountSchema.refine(value => toMinor(value) <= 100000000n, "Ticket price is too large."),
    commissionPercent: z.string().regex(/^\d{1,3}(\.\d{1,2})?$/).refine(value => Number(value) <= 100, "Commission must be between 0 and 100%."),
  })).min(1).max(100),
  notes: z.string().trim().max(1000).default(""),
}).superRefine((value, ctx) => {
  value.rows.forEach((row, index) => {
    if (!row.date.startsWith(value.period)) ctx.addIssue({ code: "custom", path: ["rows", index, "date"], message: "Every trip date must be within the statement month." });
  });
});
export type CommissionInvoice = z.infer<typeof commissionInvoiceSchema>;
export function commissionTotals(invoice: CommissionInvoice) {
  let sales = 0n, commission = 0n, customers = 0;
  const rows = invoice.rows.map(row => {
    const total = toMinor(row.ticketPrice) * BigInt(row.customers);
    // Round each line half up to cents, then sum the displayed amounts.
    const cut = (total * toMinor(row.commissionPercent) + 5000n) / 10000n;
    sales += total; commission += cut; customers += row.customers;
    return { ...row, sales: fromMinor(total), commission: fromMinor(cut) };
  });
  return { rows, customers, sales: fromMinor(sales), commission: fromMinor(commission) };
}
export function commissionPeriod(period: string) {
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${period}-01T12:00:00Z`));
}
export const septemberHaddadInvoice: CommissionInvoice = {
  partner: "El Haddad SCUBA", city: "Jeddah", period: "2026-09", currency: "USD", notes: "",
  rows: [
    { date: "2026-09-21", trip: "Bayada Leisure Boat Trip", customers: 1, ticketPrice: "110.00", commissionPercent: "25" },
    { date: "2026-09-21", trip: "Jeddah Sunset Tour", customers: 5, ticketPrice: "32.00", commissionPercent: "25" },
    { date: "2026-09-23", trip: "Jeddah Sunset Tour", customers: 7, ticketPrice: "32.00", commissionPercent: "25" },
  ],
};
export type SavedCommissionInvoice = {
  id: string; reference: string; supplier_id: string; document: CommissionInvoice;
  status: "draft" | "sending" | "sent" | "delivery_unknown"; recipient: string | null;
  created_at: string; sent_at: string | null;
};
