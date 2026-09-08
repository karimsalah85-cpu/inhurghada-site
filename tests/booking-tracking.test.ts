import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { trackEvent } from "@/lib/analytics";

describe("booking tracking semantics", () => {
  const gtag = vi.fn();
  const fbq = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID", "");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ADS_BOOKING_CONVERSION_LABEL", "");
    vi.stubGlobal("window", {
      gtag, fbq,
      localStorage: { getItem: () => JSON.stringify({ analytics: true, marketing: false }) },
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("records an unpaid request as a lead, never a purchase", () => {
    trackEvent("booking_complete", { transaction_id: "test-ref", value: 120, currency: "SAR", booking_type: "tour" });
    expect(gtag.mock.calls.map((call) => call[1])).toEqual(["booking_complete", "generate_lead"]);
    expect(gtag).toHaveBeenCalledWith("event", "generate_lead", expect.objectContaining({ transaction_id: "test-ref", value: 120, currency: "SAR" }));
    expect(fbq).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("maps genuine checkout entry but not a navigation click", () => {
    trackEvent("checkout_started", { value: 25, currency: "USD" });
    expect(gtag.mock.calls.map((call) => call[1])).toEqual(["checkout_started", "begin_checkout"]);
    gtag.mockClear();
    trackEvent("booking_start", { placement: "bottom_nav" });
    expect(gtag.mock.calls.map((call) => call[1])).toEqual(["booking_start"]);
  });

  it("preserves consented Meta lead and browser/server event identity", () => {
    vi.stubGlobal("window", { gtag, fbq, localStorage: { getItem: () => JSON.stringify({ analytics: true, marketing: true }) } });
    trackEvent("booking_complete", { transaction_id: "test-ref", value: 25, currency: "USD" });
    expect(fbq).toHaveBeenCalledWith("track", "Lead", expect.objectContaining({ transaction_id: "test-ref" }), expect.objectContaining({ eventID: expect.any(String) }));
    const payload = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
    expect(payload.eventId).toBe(fbq.mock.calls[0][3].eventID);
    expect(gtag.mock.calls.some((call) => call[1] === "purchase")).toBe(false);
  });

  it("does not send Meta checkout for navigation or duplicate tour booking_start", () => {
    vi.stubGlobal("window", { gtag, fbq, localStorage: { getItem: () => JSON.stringify({ analytics: true, marketing: true }) } });
    trackEvent("booking_start", { placement: "bottom_nav" });
    expect(fbq).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    trackEvent("checkout_started", { value: 25, currency: "USD" });
    trackEvent("booking_start", { booking_type: "tour", value: 25, currency: "USD" });
    expect(fbq).toHaveBeenCalledTimes(1);
    expect(fbq).toHaveBeenCalledWith("track", "InitiateCheckout", expect.any(Object), expect.any(Object));
    expect(fetch).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
    expect(payload.event).toBe("checkout_started");
    expect(payload.eventId).toBe(fbq.mock.calls[0][3].eventID);
  });

  it("preserves checkout tracking for validated legacy transfer submissions", () => {
    vi.stubGlobal("window", { gtag, fbq, localStorage: { getItem: () => JSON.stringify({ analytics: true, marketing: true }) } });
    trackEvent("booking_start", { booking_type: "transfer", value: 25, currency: "USD" });
    expect(fbq).toHaveBeenCalledWith("track", "InitiateCheckout", expect.any(Object), expect.any(Object));
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("does not throw during server rendering", () => {
    vi.stubGlobal("window", undefined);
    expect(() => trackEvent("booking_complete")).not.toThrow();
    expect(gtag).not.toHaveBeenCalled();
  });

  it("keeps the configured Google Ads lead conversion and its transaction identity", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID", "AW-test");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ADS_BOOKING_CONVERSION_LABEL", "lead-label");
    vi.stubGlobal("window", { gtag, fbq, localStorage: { getItem: () => JSON.stringify({ analytics: true, marketing: true }) } });
    trackEvent("booking_complete", { transaction_id: "request-123", value: 120, currency: "SAR" });
    expect(gtag.mock.calls.map((call) => call[1])).toEqual(["booking_complete", "generate_lead", "conversion"]);
    expect(gtag).toHaveBeenCalledWith("event", "conversion", {
      send_to: "AW-test/lead-label", value: 120, currency: "SAR", transaction_id: "request-123",
    });
  });

  it.each([null, "invalid", JSON.stringify({ analytics: false, marketing: false })])("does not send marketing conversions without consent (%s)", (storedConsent) => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID", "AW-test");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ADS_BOOKING_CONVERSION_LABEL", "lead-label");
    vi.stubGlobal("window", { gtag, fbq, localStorage: { getItem: () => storedConsent } });
    trackEvent("booking_complete", { transaction_id: "request-123" });
    expect(gtag.mock.calls.map((call) => call[1])).toEqual(["booking_complete", "generate_lead"]);
    expect(fbq).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
});
