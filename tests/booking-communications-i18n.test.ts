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
  });

  it("escapes customer-controlled values", () => {
    const email = buildThankYouEmail({ locale: "en", customerName: "<script>", reference: "DRS-1", tourName: "<img>" });
    expect(email.html).not.toContain("<script>");
    expect(email.html).not.toContain("<img>");
  });
});
