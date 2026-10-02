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
    expect(output.toString("binary").match(/\/Type \/Page\b/g)?.length).toBe(2);
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

      expect(output.subarray(0, 5).toString()).toBe("%PDF-");
      expect(output.toString("binary").match(/\/Type \/Page\b/g)?.length).toBe(2);
    } finally {
      if (previousPolicy === undefined) {
        delete process.env.CANCELLATION_POLICY_TEXT;
      } else {
        process.env.CANCELLATION_POLICY_TEXT = previousPolicy;
      }
    }
  });

  it("creates a valid situation report PDF", async () => {
    const output = await createReportPdf({
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

  it("embeds the footer photo once however many pages the report runs to", async () => {
    const report = (count: number) => createReportPdf({
      from: "2026-07-01", to: "2026-07-31", trip: "all", status: "all", generatedAt: "2026-07-22T12:00:00Z",
      bookings: count, people: count, cancelled: 0, revenue: count * 10,
      rows: Array.from({ length: count }, (_, index) => ({ reference: `DRS-${index}`, trip: "Orange Bay Island Snorkeling Boat Trip", serviceDate: "2026-07-23", people: 1, status: "confirmed", amount: 10, currency: "USD" })),
    });
    const [short, long] = await Promise.all([report(2), report(150)]);
    const pages = (pdf: Buffer) => pdf.toString("binary").match(/\/Type \/Page\b/g)?.length ?? 0;
    const images = (pdf: Buffer) => pdf.toString("binary").match(/\/Subtype \/Image\b/g)?.length ?? 0;
    expect(pages(short)).toBe(1);
    expect(pages(long)).toBeGreaterThan(4);
    expect(images(long)).toBe(images(short));
  });

  it("gives the status voucher the confirmation's hero page plus a price-breakdown page", async () => {
    const output = await createBookingStatusPdf({
      reference: "DRS-20260727-STATUS", generatedAt: new Date("2026-07-27T12:00:00Z"), customerName: "Guest",
      itemName: "Morning Quad Bike Safari", amount: 65, currency: "USD", bookingStatus: "confirmed", paymentStatus: "paid",
    });
    expect(output.toString("binary").match(/\/Type \/Page\b/g)?.length).toBe(2);
    // Hero photo, wordmark and footer strip.
    expect(output.toString("binary").match(/\/Subtype \/Image\b/g)?.length).toBeGreaterThanOrEqual(3);
    // Print-sized photos keep the emailed attachment small.
    expect(output.length).toBeLessThan(700_000);
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

  it("renders confirmation and status PDFs per booking language across every locale", async () => {
    const locales = ["en", "de", "ru", "ar", "pl", "zh"] as const;
    const statusBase = {
      reference: "DRS-L10N-1", generatedAt: new Date("2026-08-14T00:00:00Z"), customerName: "Guest",
      itemName: "Glass-bottom boat", amount: 50, currency: "USD", bookingStatus: "completed", paymentStatus: "paid",
    };
    const statusByLocale = await Promise.all(locales.map((locale) => createBookingStatusPdf({ ...statusBase, locale })));
    const confirmationByLocale = await Promise.all(locales.map((locale) => createInvoicePdf({
      reference: "DRS-L10N-1", issuedAt: new Date("2026-08-14T00:00:00Z"), customerName: "Guest",
      itemName: "Glass-bottom boat", quantity: 2, amount: 50, currency: "USD", locale,
    })));

    for (const pdf of [...statusByLocale, ...confirmationByLocale]) {
      expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    }
    // Same inputs, different booking language -> different rendered bytes (localized copy + script font).
    expect(new Set(statusByLocale.map((pdf) => pdf.toString("binary"))).size).toBe(locales.length);
    expect(new Set(confirmationByLocale.map((pdf) => pdf.toString("binary"))).size).toBe(locales.length);
    // Re-rendering the same locale is deterministic.
    const statusDeAgain = await createBookingStatusPdf({ ...statusBase, locale: "de" });
    expect(statusDeAgain.equals(statusByLocale[1])).toBe(true);
  });
});
