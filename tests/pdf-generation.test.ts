import { describe, expect, it } from "vitest";
import { createBookingStatusPdf, createInvoicePdf } from "@/lib/invoice-service";
import { createReportPdf } from "@/lib/report-service";
import { customerEmailSender, normalizeGoogleAppPassword } from "@/lib/booking-service";

describe("PDF generators", () => {
  it("uses the official customer email sender", () => {
    expect(customerEmailSender).toEqual({
      email: "info@dailyredsea.com",
      formatted: "Daily Red Sea <info@dailyredsea.com>",
    });
  });

  it("normalizes Google's grouped app-password format", () => {
    expect(normalizeGoogleAppPassword("abcd efgh ijkl mnop")).toBe("abcdefghijklmnop");
    expect(normalizeGoogleAppPassword("  abcd-efgh  ")).toBe("abcd-efgh");
  });

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
    expect(output.toString("binary")).toContain(
      "(CANCELLATION & REFUND POLICY) Tj",
    );
    expect(output.toString("binary")).not.toContain("PLACEHOLDER");
    expect(output.toString("binary")).toContain(
      "(The cancellation terms shown on your activity page apply to this booking. Unless that page) Tj",
    );
  });

  it("includes the configured policy in the booking PDF", async () => {
    const previousPolicy = process.env.CANCELLATION_POLICY_TEXT;
    process.env.CANCELLATION_POLICY_TEXT =
      "Cancel at least 48 hours before departure.\\n\\nApproved refunds return through the agreed payment method.";

    try {
      const output = await createInvoicePdf({
        reference: "DRS-20260722-POLICY",
        issuedAt: new Date("2026-07-22T12:00:00Z"),
        customerName: "Policy Test Guest",
        itemName: "Multi-day Red Sea itinerary",
        quantity: 2,
        amount: 120,
        currency: "USD",
      });

      const pdfText = output.toString("binary");
      expect({
        heading: pdfText.includes("(CANCELLATION & REFUND POLICY) Tj"),
        firstParagraph: pdfText.includes(
          "(Cancel at least 48 hours before departure.) Tj",
        ),
        secondParagraph: pdfText.includes(
          "(Approved refunds return through the agreed payment method.) Tj",
        ),
        pages: pdfText.match(/\/Type \/Page\b/g)?.length,
      }).toMatchInlineSnapshot(`
        {
          "firstParagraph": true,
          "heading": true,
          "pages": 2,
          "secondParagraph": true,
        }
      `);
    } finally {
      if (previousPolicy === undefined) {
        delete process.env.CANCELLATION_POLICY_TEXT;
      } else {
        process.env.CANCELLATION_POLICY_TEXT = previousPolicy;
      }
    }
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

  it("creates a valid customer booking status PDF", async () => {
    const output = await createBookingStatusPdf({
      reference: "DRS-20260727-STATUS",
      generatedAt: new Date("2026-07-27T12:00:00Z"),
      customerName: "Quality Assurance Guest",
      customerEmail: "qa@example.com",
      customerPhone: "+20 100 000 0000",
      itemName: "Morning Quad Bike Safari",
      date: "2026-08-02",
      travelers: "2 travelers",
      pickup: "Quality Test Hotel, Hurghada",
      amount: 65,
      currency: "USD",
      bookingStatus: "confirmed",
      paymentStatus: "paid",
    });
    expect(output.subarray(0, 5).toString()).toBe("%PDF-");
    expect(output.length).toBeGreaterThan(4_000);
  });

  it("uses the booking language in confirmation and status PDFs", async () => {
    const confirmation = await createInvoicePdf({
      reference: "DRS-DE-1", issuedAt: new Date("2026-08-14T00:00:00Z"), customerName: "Gast",
      itemName: "Glasbodenboot", quantity: 2, amount: 50, currency: "USD", locale: "de",
    });
    const status = await createBookingStatusPdf({
      reference: "DRS-DE-1", generatedAt: new Date("2026-08-14T00:00:00Z"), customerName: "Gast",
      itemName: "Glasbodenboot", amount: 50, currency: "USD", bookingStatus: "completed", paymentStatus: "paid", locale: "de",
    });
    expect(confirmation.toString("binary")).toContain("(BUCHUNGSBESTAETIGUNG) Tj");
    expect(status.toString("binary")).toContain("(BUCHUNGSSTATUS) Tj");
  });
});
