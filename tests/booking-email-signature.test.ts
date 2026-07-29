import { describe, expect, it } from "vitest";
import {
  companyStatement,
  withCustomerEmailSignature,
} from "@/lib/booking-service";

describe("customer booking email signature", () => {
  it("adds the company statement to customer emails", () => {
    const html = withCustomerEmailSignature(
      "traveler@example.com",
      "<p>Your booking is confirmed.</p>",
    );

    expect(html).toContain(companyStatement);
    expect(html).toContain("Daily Red Sea");
    expect(html).toContain("info@dailyredsea.com");
    expect(html).not.toContain("About Daily Red Sea");
    expect(html).toContain("background:#f0f9ff");
  });

  it("does not duplicate an existing company statement", () => {
    const originalHtml = `<p>Your booking is confirmed.</p><p>${companyStatement}</p>`;

    expect(
      withCustomerEmailSignature("traveler@example.com", originalHtml),
    ).toBe(originalHtml);
  });

  it("does not add the customer signature to internal admin emails", () => {
    const originalHtml = "<p>A new booking was received.</p>";

    expect(
      withCustomerEmailSignature("INFO@DAILYREDSEA.COM", originalHtml),
    ).toBe(originalHtml);
  });
});
