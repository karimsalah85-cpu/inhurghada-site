import { describe, expect, it } from "vitest";
import { buildCustomerConfirmationEmail, buildThankYouEmail } from "@/lib/booking-communications-i18n";

describe("booking communication languages", () => {
  it.each([
    ["en", "Your booking confirmation", "Thank you"],
    ["de", "Buchungsbestätigung", "Danke"],
    ["ru", "Подтверждение", "Спасибо"],
    ["ar", "تأكيد", "شكراً"],
    ["pl", "Potwierdzenie", "Dziękujemy"],
    ["zh", "预订确认", "感谢"],
  ])("uses the saved %s booking language", (locale, confirmationText, thankYouText) => {
    const confirmation = buildCustomerConfirmationEmail({ locale, customerName: "Sam", reference: "DRS-123" });
    const thankYou = buildThankYouEmail({ locale, customerName: "Sam", reference: "DRS-123", tourName: "Glass Boat" });
    expect(confirmation.subject).toContain(confirmationText);
    expect(thankYou.subject).toContain(thankYouText);
    expect(confirmation.html).toContain(`lang="${locale}"`);
    expect(confirmation.html).toContain("data-drs-complete-email");
  });

  it("includes accurate localized booking details in the customer email", () => {
    const email = buildCustomerConfirmationEmail({ locale: "ar", customerName: "كريم", reference: "DRS-123", itemName: "رحلة بحرية في جدة", date: "2026-08-30", time: "5:00 مساءً", travelers: "2 بالغ", pickup: "خليج أبحر", amount: 450, currency: "SAR" });
    expect(email.html).toContain("رحلة بحرية في جدة");
    expect(email.html).toContain("خليج أبحر");
    expect(email.html).toContain("ر.س.");
    expect(email.html).not.toContain("travelers in Hurghada");
  });

  it("escapes customer-controlled values", () => {
    const email = buildThankYouEmail({ locale: "en", customerName: "<script>", reference: "DRS-1", tourName: "<img>" });
    expect(email.html).not.toContain("<script>");
    expect(email.html).not.toContain("<img>");
  });
});
