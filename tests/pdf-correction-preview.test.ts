import { it, expect } from "vitest";
import { createInvoicePdf } from "@/lib/invoice-service";
import { mkdir, writeFile } from "node:fs/promises";
it("keeps corrected confirmation and support panels on two pages in every language", async () => {
  for (const locale of ["en", "ar", "de", "ru", "pl", "zh"]) {
    const pdf = await createInvoicePdf({ reference: "DRS-SAMPLE", issuedAt: new Date("2026-09-22T08:00:00Z"), customerName: "Sample Guest", customerPhone: "+20 100 000 0000", customerEmail: "guest@example.com", itemName: "Full Day Snorkeling Trip", tourSlug: "full-day-snorkeling", date: "2026-09-23", time: "08:00", quantity: 1, travelerSummary: "1 adult", hotel: "Hotel reception", amount: 25, currency: "USD", locale });
    expect(pdf.toString("binary").match(/\/Type \/Page\b/g)?.length).toBe(2);
    if (process.env.GENERATE_PDF_SAMPLES) { await mkdir("/tmp/drs-pdf-fix", {recursive:true}); await writeFile(`/tmp/drs-pdf-fix/after-${locale}.pdf`, pdf); }
  }
});
