import { afterEach, describe, expect, it, vi } from "vitest";
import { sendBookingEmail } from "@/lib/booking-service";

function mockResend() {
  vi.stubEnv("GMAIL_SMTP_APP_PASSWORD", "");
  vi.stubEnv("RESEND_API_KEY", "test-key");
  const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  return () => JSON.parse(fetchMock.mock.calls[0][1].body);
}

describe("customer email BCC", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  it("BCCs info@dailyredsea.com on customer emails", async () => {
    const body = mockResend();
    await sendBookingEmail("traveler@example.com", "Booking confirmed", "<p>Hi</p>");
    expect(body().bcc).toEqual(["info@dailyredsea.com"]);
  });

  it("does not BCC emails already addressed to the shared inbox", async () => {
    const body = mockResend();
    await sendBookingEmail("INFO@dailyredsea.com", "New booking", "<p>Hi</p>");
    expect(body().bcc).toBeUndefined();
  });

  it("skips the BCC when a sender opts out", async () => {
    const body = mockResend();
    await sendBookingEmail("traveler@example.com", "Your code", "<p>123456</p>", undefined, { bcc: false });
    expect(body().bcc).toBeUndefined();
  });
});
