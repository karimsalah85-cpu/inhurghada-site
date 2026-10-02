import { describe, expect, it } from "vitest";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { commissionInvoiceSchema, commissionTotals, septemberHaddadInvoice } from "@/lib/finance/commission-invoice";
import { createCommissionInvoicePdf } from "@/lib/finance/commission-invoice-pdf";
import { buildCommissionInvoiceEmail } from "@/lib/finance/commission-invoice-email";

describe("supplier commission statements", () => {
  it("matches the supplied September statement exactly", () => {
    const document = commissionInvoiceSchema.parse(septemberHaddadInvoice);
    expect(commissionTotals(document)).toMatchObject({ customers: 13, sales: "494.00", commission: "123.50", rows: [{ sales: "110.00", commission: "27.50" }, { sales: "160.00", commission: "40.00" }, { sales: "224.00", commission: "56.00" }] });
  });
  it("rounds line commissions once and sums displayed cents", () => {
    const row = { ...septemberHaddadInvoice.rows[0], ticketPrice: "0.10", commissionPercent: "25" };
    expect(commissionTotals({ ...septemberHaddadInvoice, rows: [row, row] }).commission).toBe("0.06");
  });
  it("rejects incorrect months, invalid dates, rates, quantities and precision", () => {
    for (const patch of [{ date: "2026-10-01" }, { date: "2026-09-31" }, { commissionPercent: "101" }, { commissionPercent: "NaN" }, { customers: 0 }, { customers: 1.5 }, { ticketPrice: "32.001" }, { ticketPrice: "-1" }]) {
      expect(commissionInvoiceSchema.safeParse({ ...septemberHaddadInvoice, rows: [{ ...septemberHaddadInvoice.rows[0], ...patch }] }).success).toBe(false);
    }
  });
  it("escapes partner, trip and payment instruction markup in email", () => {
    const email = buildCommissionInvoiceEmail({ ...septemberHaddadInvoice, partner: '<img src=x onerror="alert(1)">', notes: "<script>alert(1)</script>" }, "DRS-COM-TEST");
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;img");
    expect(email.html).toContain("$123.50");
  });
  it("creates the September PDF and paginates long statements", async () => {
    const pdf = await createCommissionInvoicePdf(septemberHaddadInvoice, "DRS-COM-00000001");
    expect(pdf.toString("binary").match(/\/Type \/Page\b/g)?.length).toBe(1);
    const long = await createCommissionInvoicePdf({ ...septemberHaddadInvoice, rows: Array.from({ length: 100 }, () => ({ ...septemberHaddadInvoice.rows[0], trip: "A longer excursion name with several words to verify safe wrapping" })) }, "DRS-COM-LONG");
    expect(long.toString("binary").match(/\/Type \/Page\b/g)!.length).toBeGreaterThan(3);
    if (process.env.GENERATE_COMMISSION_SAMPLES) {
      await mkdir("output/supplier-invoices", { recursive: true });
      await writeFile("output/supplier-invoices/el-haddad-september-2026.pdf", pdf);
      await writeFile("output/supplier-invoices/el-haddad-september-2026-email.html", buildCommissionInvoiceEmail(septemberHaddadInvoice, "DRS-COM-00000001").html);
      await writeFile("/tmp/drs-commission-long.pdf", long);
    }
  });
  it("protects saved invoices with RLS and prevents browser writes", async () => {
    const db = new PGlite();
    try {
      await db.exec(`create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users(id uuid primary key); create table public.suppliers(id uuid primary key); create function public.admin_has_permission(text) returns boolean language sql as $$ select current_setting('test.finance',true) = 'yes' $$;`);
      await db.exec(await readFile("supabase/migrations/20261002073043_supplier_commission_invoices.sql", "utf8"));
      await db.exec(`insert into suppliers values ('45b9782c-c235-4db3-b9dc-124d49021a9f'); insert into supplier_commission_invoices(supplier_id,document) values ('45b9782c-c235-4db3-b9dc-124d49021a9f','{}'); set role authenticated;`);
      expect((await db.query("select * from supplier_commission_invoices")).rows).toHaveLength(0);
      await db.exec("set test.finance = 'yes'");
      expect((await db.query("select reference from supplier_commission_invoices")).rows).toEqual([{ reference: "DRS-COM-00000001" }]);
      await expect(db.exec("update supplier_commission_invoices set status = 'sent'")).rejects.toThrow(/permission denied/);
      await db.exec("set role anon");
      await expect(db.query("select * from supplier_commission_invoices")).rejects.toThrow(/permission denied/);
    } finally { await db.close(); }
  });
});
