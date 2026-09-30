import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTicketToken, ticketUrl, verifyTicketToken } from "@/lib/ticket-token";
import { buildCustomerConfirmationEmail } from "@/lib/booking-communications-i18n";
import { isKnownApplicationPath } from "@/lib/public-routes";

describe("per-trip ticket tokens", () => {
  const previous = process.env.TICKET_SIGNING_SECRET;
  beforeEach(() => { process.env.TICKET_SIGNING_SECRET = "test-ticket-secret"; });
  afterEach(() => { if (previous === undefined) delete process.env.TICKET_SIGNING_SECRET; else process.env.TICKET_SIGNING_SECRET = previous; });

  it("gives every trip of a booking its own verifiable token", () => {
    const first = createTicketToken("DRS-20260930-ABC123", 0);
    const second = createTicketToken("DRS-20260930-ABC123", 1);
    expect(first).not.toBe(second);
    expect(verifyTicketToken(first)).toEqual({ reference: "DRS-20260930-ABC123", tripIndex: 0 });
    expect(verifyTicketToken(second)).toEqual({ reference: "DRS-20260930-ABC123", tripIndex: 1 });
  });

  it("keeps guest details out of the QR payload", () => {
    const url = ticketUrl("DRS-20260930-ABC123", 0);
    expect(url).toMatch(/^https:\/\/dailyredsea\.com\/ticket\/DRS-20260930-ABC123~0~[A-Za-z0-9_-]{22}$/);
  });

  it("rejects forged, edited or foreign-secret tokens", () => {
    const token = createTicketToken("DRS-20260930-ABC123", 0);
    expect(verifyTicketToken(token.replace("~0~", "~1~"))).toBeNull();
    expect(verifyTicketToken(token.replace("ABC123", "ABC124"))).toBeNull();
    expect(verifyTicketToken("DRS-20260930-ABC123~0~AAAAAAAAAAAAAAAAAAAAAA")).toBeNull();
    expect(verifyTicketToken("not-a-ticket")).toBeNull();
    process.env.TICKET_SIGNING_SECRET = "another-secret";
    expect(verifyTicketToken(token)).toBeNull();
  });

  it("only allows the unprefixed /ticket/<token> route", () => {
    expect(isKnownApplicationPath("/ticket/DRS-1~0~abc")).toBe(true);
    expect(isKnownApplicationPath("/ticket")).toBe(false);
    expect(isKnownApplicationPath("/de/ticket/DRS-1~0~abc")).toBe(false);
  });
});

describe("themed confirmation email", () => {
  it("renders one inline QR ticket per trip in the thank-you theme", () => {
    const email = buildCustomerConfirmationEmail({
      locale: "en", customerName: "Sam", reference: "DRS-1", itemName: "Multi-trip booking",
      tickets: [
        { label: "Orange Bay · 2026-10-02", url: "https://dailyredsea.com/ticket/a", imageSrc: "cid:ticket-1@dailyredsea.com" },
        { label: "Quad safari · 2026-10-03", url: "https://dailyredsea.com/ticket/b", imageSrc: "cid:ticket-2@dailyredsea.com" },
      ],
      whatsappUrl: "https://wa.me/201000000000",
    });
    expect(email.html).toContain("dailyredsea-wordmark-email.png");
    expect(email.html).toContain('src="cid:ticket-1@dailyredsea.com"');
    expect(email.html).toContain('src="cid:ticket-2@dailyredsea.com"');
    expect(email.html).toContain("Trip ticket 2 / 2");
    expect(email.html).toContain("https://wa.me/201000000000");
  });

  it("drops tickets with unsafe links", () => {
    const email = buildCustomerConfirmationEmail({ locale: "en", customerName: "Sam", reference: "DRS-1", tickets: [{ label: "x", url: "javascript:alert(1)", imageSrc: "cid:x" }] });
    expect(email.html).not.toContain("javascript:");
  });
});
