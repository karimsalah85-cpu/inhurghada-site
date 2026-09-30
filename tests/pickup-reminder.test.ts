import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/booking-service", () => ({ sendBookingEmail: vi.fn(), sendWhatsAppMessage: vi.fn() }));
vi.mock("@/utils/supabase/admin", () => ({ createRequiredAdminClient: vi.fn() }));
vi.mock("@/lib/google-ads", () => ({ getGoogleAdsReport: vi.fn(), googleAdsConfiguration: vi.fn(), isDeveloperTokenNotApproved: vi.fn() }));
vi.mock("@/lib/finance/automation", () => ({ runFinanceAutomation: vi.fn() }));

const { pickupLine, render, resolvePickupTime } = await import("@/lib/admin-automation");

const booking = { id: "b1", reference: "DRS-1", customer_name: "Anna", customer_email: "a@example.com", phone: "+20100", tour_name: "Orange Bay", date: "2026-10-02", hotel: "Steigenberger", locale: "en" };

describe("pickup reminder time", () => {
  it("prefers the assigned pickup time, shown in Cairo time", () => {
    expect(resolvePickupTime("2026-10-02T05:30:00Z", "09:00:00")).toBe("08:30");
  });

  it("falls back to the booking departure time", () => {
    expect(resolvePickupTime(null, "09:15:00")).toBe("09:15");
  });

  it("returns null when nothing is known", () => {
    expect(resolvePickupTime(undefined, null)).toBeNull();
    expect(resolvePickupTime("not a date", "")).toBeNull();
  });

  it("writes a concrete pickup line when the time is known", () => {
    expect(pickupLine({ hotel: "Steigenberger", pickup_time: "08:30" })).toBe("Your pickup is at 08:30 from Steigenberger. Please be ready in the lobby 10 minutes early.");
  });

  it("keeps the 'we will confirm' wording when no time is known", () => {
    expect(pickupLine({ hotel: "Steigenberger", pickup_time: null })).toBe("We will confirm the pickup time for Steigenberger by WhatsApp.");
    expect(pickupLine({ hotel: null, pickup_time: null })).toBe("We will confirm the pickup time by WhatsApp.");
  });

  it("fills {{pickup_line}} and {{pickup_time}} in templates", () => {
    const text = render("Tomorrow: {{tour_name}}. {{pickup_line}} ({{pickup_time}})", { ...booking, pickup_time: "08:30" });
    expect(text).toBe("Tomorrow: Orange Bay. Your pickup is at 08:30 from Steigenberger. Please be ready in the lobby 10 minutes early. (08:30)");
  });

  it("fills {{waiver_link}} only for diving bookings", () => {
    const previous = process.env.TICKET_SIGNING_SECRET;
    process.env.TICKET_SIGNING_SECRET = "test-secret";
    try {
      expect(render("Sign: {{waiver_link}}", { ...booking, tour_slug: "orange-bay" })).toBe("Sign: ");
      expect(render("Sign: {{waiver_link}}", booking)).toBe("Sign: ");
      expect(render("Sign: {{waiver_link}}", { ...booking, tour_slug: "full-day-diving" })).toMatch(/^Sign: https:\/\/dailyredsea\.com\/waiver\/DRS-1\.[0-9a-z]+\.[A-Za-z0-9_-]{27}$/);
    } finally {
      if (previous === undefined) delete process.env.TICKET_SIGNING_SECRET; else process.env.TICKET_SIGNING_SECRET = previous;
    }
  });
});
