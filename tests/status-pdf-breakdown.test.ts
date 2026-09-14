import { describe, expect, it } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { buildBookingStatusPdfAttachment } from "@/lib/booking-status-notification";
import { pricingLine, type BookingPricingSnapshot } from "@/lib/booking-pricing-snapshot";

const snapshot: BookingPricingSnapshot = { version: 1, currency: "SAR", subtotal: 612, pending: false, trips: [{
  name: "Sunset yacht cruise", date: "2026-09-23", time: "17:00", guests: 7,
  participants: { adults: 5, youth: 2, infants: 0 },
  lines: [pricingLine("adults", 5, 100), pricingLine("youth", 2, 56)],
}] };
const base = {
  reference: "DRS-PDF-TEST", customer_name: "Test Guest", customer_email: "test@example.com",
  tour_name: "Multi-trip booking: Sunset yacht cruise", date: "2026-09-23", guests: 7,
  adults: 0, youth: 0, infants: 0, amount: 550.8, currency: "SAR", subtotal: 612,
  promo_code: "SAVE10", discount_amount: 61.2, status: "confirmed", payment_status: "unpaid",
  pricing_snapshot: snapshot,
};
async function inspect(booking: Parameters<typeof buildBookingStatusPdfAttachment>[0], name: string) {
  const { content } = await buildBookingStatusPdfAttachment(booking);
  if (process.env.PDF_QA_DIR) {
    mkdirSync(process.env.PDF_QA_DIR, { recursive: true });
    writeFileSync(`${process.env.PDF_QA_DIR}/${name}.pdf`, content);
  }
  const doc = await getDocument({ data: new Uint8Array(content), useSystemFonts: true }).promise;
  const texts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const items = (await page.getTextContent()).items;
    for (const item of items) {
      if (!("str" in item) || !item.str.trim()) continue;
      expect(item.transform[5]).toBeGreaterThan(15);
      expect(item.transform[5]).toBeLessThan(825);
      texts.push(item.str);
    }
  }
  const pages = doc.numPages;
  await doc.destroy();
  return { text: texts.join(" "), pages };
}
describe("status PDF pricing details", () => {
  it("includes saved categories, unit prices, promo and totals", async () => {
    const pdf = await inspect(base, "status-en");
    for (const value of ["Adults: 5", "Children / youth: 2", "Infants: 0", "100.00", "56.00", "612.00", "SAVE10", "61.20", "550.80"]) expect(pdf.text).toContain(value);
  });
  it("distinguishes no promo from unknown history and recovers historical categories", async () => {
    const historical = { ...base, amount: 612, promo_code: null, discount_amount: 0, pricing_snapshot: null,
      notes: "1. Sunset yacht cruise\nDate: 2026-09-23\nTime: 17:00\nTravelers: 5 adults · 2 youth · 0 infants\nTrip total: SAR 612.00" };
    const pdf = await inspect(historical, "status-history");
    expect(pdf.text).toContain("No promo code applied");
    expect(pdf.text).toContain("Adults: 5");
    expect(pdf.text).toContain("Historical unit prices unavailable");
    expect(pdf.text).not.toContain("100.00");
    const unknown = await inspect({ ...historical, subtotal: null, notes: null }, "status-unknown");
    expect(unknown.text).toContain("Promo history unavailable");
    expect(unknown.text).toContain("Participant categories unavailable");
  });
  it("paginates every trip and renders Arabic without text outside the page", async () => {
    const trips = Array.from({ length: 10 }, (_, i) => ({ ...snapshot.trips[0], name: `Trip ${i + 1}: Sunset yacht cruise with a longer experience title` }));
    const pdf = await inspect({ ...base, amount: 6120, subtotal: 6120, discount_amount: 0, promo_code: null,
      pricing_snapshot: { ...snapshot, subtotal: 6120, trips } }, "status-multi");
    expect(pdf.pages).toBeGreaterThan(2);
    expect(pdf.text).toContain("Trip 10:");
    const arabic = await inspect({ ...base, locale: "ar", customer_name: "ضيف التجربة" }, "status-ar");
    expect(arabic.pages).toBeGreaterThan(0);
    expect(arabic.text).toContain("SAVE10");
  });
});
