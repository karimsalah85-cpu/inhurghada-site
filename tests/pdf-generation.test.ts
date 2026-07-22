import { describe, expect, it } from "vitest";
import { createInvoicePdf } from "@/lib/invoice-service";
import { createReportPdf } from "@/lib/report-service";

describe("PDF generators", () => {
  it("creates a valid booking confirmation PDF", async () => {
    const output = await createInvoicePdf({
      reference: "DRS-20260722-QA1234",
      issuedAt: new Date("2026-07-22T12:00:00Z"),
      customerName: "Quality Assurance Guest",
      customerEmail: "qa@example.com",
      customerPhone: "+20 100 000 0000",
      itemName: "Orange Bay Island Snorkeling Boat Trip",
      quantity: 4,
      travelerSummary: "2 adults - 1 youth - 1 infant",
      amount: 65,
      currency: "usd",
      paymentMethod: "Cash on arrival",
      date: "2026-07-30",
      time: "08:00",
      hotel: "Quality Test Hotel, Hurghada",
    });
    expect(output.subarray(0, 5).toString()).toBe("%PDF-");
    expect(output.length).toBeGreaterThan(4_000);
  });

  it("creates a valid situation report PDF", () => {
    const output = createReportPdf({
      from: "2026-07-01", to: "2026-07-31", trip: "all", status: "all", generatedAt: "2026-07-22T12:00:00Z",
      bookings: 2, people: 7, cancelled: 0, revenue: 92,
      rows: [
        { reference: "DRS-20260722-A1B2C3", trip: "Orange Bay Island Snorkeling Boat Trip", serviceDate: "2026-07-23", people: 4, status: "confirmed", amount: 65, currency: "USD" },
        { reference: "DRS-T-20260722-D4E5F6", trip: "Hurghada Airport one-way transfer", serviceDate: "2026-07-24", people: 3, status: "new", amount: 27, currency: "USD" },
      ],
    });
    expect(output.subarray(0, 5).toString()).toBe("%PDF-");
    expect(output.length).toBeGreaterThan(1_500);
  });
});
