import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { buildQuotationEmail, isPendingQuote, parseQuotePrice, quoteBlocker, quotedSnapshot, quotedTransferDetails, quotationWhatsAppText, customerWhatsAppLink } from "@/lib/transfer-quotation";
import { readPricingSnapshot } from "@/lib/booking-pricing-snapshot";
import { buildAdminAttention } from "@/lib/admin-attention";

type Row = Record<string, unknown>;
const state: { booking: Row | null; updates: Row[]; audits: Row[]; allowed: boolean; emails: Array<{ to: string; subject: string; html: string }>; emailOk: boolean } = { booking: null, updates: [], audits: [], allowed: true, emails: [], emailOk: true };

vi.mock("@/lib/admin-permission", () => ({
  getAdminAuthorization: async () => ({
    allowed: state.allowed,
    user: { email: "staff@example.com" },
    supabase: {
      from: () => {
        let pending: Row | null = null;
        const chain = {
          select: () => chain,
          eq: () => chain,
          update: (values: Row) => { pending = values; return chain; },
          single: async () => {
            if (pending) { state.updates.push(pending); state.booking = { ...state.booking, ...pending }; pending = null; }
            return state.booking ? { data: state.booking, error: null } : { data: null, error: { message: "missing" } };
          },
        };
        return chain;
      },
      rpc: async (_name: string, args: Row) => { state.audits.push(args); return { error: null }; },
    },
  }),
}));
vi.mock("@/lib/booking-service", async (original) => ({
  ...(await original<typeof import("@/lib/booking-service")>()),
  sendBookingEmail: async (to: string, subject: string, html: string) => { state.emails.push({ to, subject, html }); return state.emailOk ? { success: true } : { success: false, reason: "gmail-smtp-failed" }; },
}));

import { POST } from "@/app/api/admin/bookings/[id]/quote/route";

const id = "11111111-1111-4111-8111-111111111111";
const pendingSnapshot = { version: 1, currency: "USD", subtotal: 0, pending: true, trips: [{ name: "Private transfer: Makadi Bay → Hurghada Airport (round trip)", lines: [], guests: 14, participants: { adults: 12, youth: 2, infants: 0 } }] };
const quoteRequest = () => ({
  id, reference: "DRS-T-20261120-ABC123", type: "transfer", status: "new", payment_status: "unpaid", amount: "0.00", subtotal: "0.00", currency: "USD",
  discount_amount: "0.00", referral_discount_amount: "0.00", customer_name: "Sam <Guest>", customer_email: "guest@example.com", phone: "+44 7700 900123",
  tour_name: "Private transfer: Makadi Bay → Hurghada Airport (round trip)", date: "2026-12-02", start_time: "09:30:00", guests: 14, hotel: "Makadi Palace",
  pricing_snapshot: pendingSnapshot, transfer_details: { zone: "makadi_bay", requires_manual_confirmation: true, fare: null },
});
const quote = (body: unknown) => POST(new NextRequest(`https://dailyredsea.com/api/admin/bookings/${id}/quote`, { method: "POST", headers: { "Content-Type": "application/json", Origin: "https://dailyredsea.com" }, body: JSON.stringify(body) }), { params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.stubEnv("VERCEL_ENV", "production");
  Object.assign(state, { booking: quoteRequest(), updates: [], audits: [], allowed: true, emails: [], emailOk: true });
});

describe("quotation rules", () => {
  it("recognises a transfer waiting for a price", () => {
    expect(isPendingQuote(quoteRequest())).toBe(true);
    expect(isPendingQuote({ ...quoteRequest(), amount: 120, pricing_snapshot: { pending: false } })).toBe(false);
    expect(isPendingQuote({ ...quoteRequest(), type: "tour" })).toBe(false);
  });

  it("only quotes open, unpaid transfers without discounts", () => {
    expect(quoteBlocker(quoteRequest())).toBeNull();
    expect(quoteBlocker({ ...quoteRequest(), status: "confirmed" })).toBeNull();
    expect(quoteBlocker({ ...quoteRequest(), type: "tour" })).toMatch(/transfer/);
    expect(quoteBlocker({ ...quoteRequest(), status: "cancelled" })).toMatch(/cancelled/);
    expect(quoteBlocker({ ...quoteRequest(), payment_status: "paid" })).toMatch(/payment/);
    expect(quoteBlocker({ ...quoteRequest(), discount_amount: "5" })).toMatch(/discount/);
  });

  it("accepts a positive price and rounds it to cents", () => {
    expect(parseQuotePrice("185.499")).toEqual({ ok: true, price: 185.5 });
    for (const bad of [0, -1, "", "abc", null, 100_001]) expect(parseQuotePrice(bad).ok, String(bad)).toBe(false);
  });

  it("produces a priced snapshot that finance and the booking panel accept", () => {
    const snapshot = quotedSnapshot(pendingSnapshot, 185.5, "usd", "Transfer");
    expect(snapshot).toMatchObject({ pending: false, subtotal: 185.5, currency: "USD", trips: [{ guests: 14, participants: { adults: 12, youth: 2, infants: 0 }, lines: [{ kind: "booking", quantity: 1, unitPrice: 185.5, total: 185.5 }] }] });
    expect(readPricingSnapshot(snapshot, "USD", 185.5)).not.toBeNull();
    expect(quotedSnapshot(null, 50, "USD", "Fallback").trips[0]).toMatchObject({ name: "Fallback", guests: 1 });
    expect(quotedTransferDetails({ zone: "x", fare: null }, 185.5, "staff@example.com")).toMatchObject({ zone: "x", fare: { total: 185.5, persisted_amount: 185.5, quoted: true, quoted_by: "staff@example.com" } });
  });

  it("writes an email and WhatsApp message with the total, escaping customer text", () => {
    const input = { reference: "DRS-T-1", customer_name: "Sam <Guest>", tour_name: "Private transfer", date: "2026-12-02", start_time: "09:30:00", guests: 14, hotel: "Makadi Palace", price: 185.5, currency: "USD", message: "Includes a <b>minibus</b>." };
    const email = buildQuotationEmail(input);
    expect(email.subject).toBe("Transfer quotation DRS-T-1: $185.50");
    expect(email.html).toContain("$185.50");
    expect(email.html).toContain("Sam &lt;Guest&gt;");
    expect(email.html).toContain("&lt;b&gt;minibus&lt;/b&gt;");
    expect(email.html).not.toContain("<b>minibus</b>");
    const text = quotationWhatsAppText(input);
    expect(text).toContain("Price: $185.50 in total");
    expect(text).toContain("on 2026-12-02 at 09:30");
    expect(customerWhatsAppLink("+44 7700 900123", "hi")).toBe("https://wa.me/447700900123?text=hi");
    expect(customerWhatsAppLink("", "hi")).toBeNull();
  });
});

describe("sending a quotation from the admin", () => {
  it("saves the price, clears the pending flag and emails the customer", async () => {
    const response = await quote({ price: "185.5", message: "Includes child seats." });
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(state.updates[0]).toMatchObject({ amount: 185.5, subtotal: 185.5, pricing_snapshot: { pending: false, subtotal: 185.5 }, transfer_details: { fare: { total: 185.5, quoted: true } } });
    expect(result.booking).toMatchObject({ amount: 185.5 });
    expect(result.email).toEqual({ attempted: true, sent: true, recipient: "guest@example.com" });
    expect(state.emails[0]).toMatchObject({ to: "guest@example.com", subject: "Transfer quotation DRS-T-20261120-ABC123: $185.50" });
    expect(state.emails[0].html).toContain("Includes child seats.");
    expect(result.whatsappLink).toMatch(/^https:\/\/wa\.me\/447700900123\?text=/);
    expect(decodeURIComponent(result.whatsappLink)).toContain("Price: $185.50");
    expect(state.audits[0]).toMatchObject({ resource_name: "booking", summary_text: "Quoted transfer DRS-T-20261120-ABC123 at 185.5 USD" });
  });

  it("can save without emailing, and reports a failed email without losing the price", async () => {
    expect((await (await quote({ price: 90, sendEmail: false })).json()).email).toEqual({ attempted: false, sent: false });
    expect(state.emails).toHaveLength(0);
    state.emailOk = false;
    const failed = await (await quote({ price: 95 })).json();
    expect(failed.email).toMatchObject({ attempted: true, sent: false, reason: "gmail-smtp-failed" });
    expect(state.booking).toMatchObject({ amount: 95 });
  });

  it("refuses bad prices, closed or paid bookings, staff without permission, and preview", async () => {
    expect((await quote({ price: 0 })).status).toBe(400);
    state.booking = { ...quoteRequest(), payment_status: "paid" };
    expect((await quote({ price: 100 })).status).toBe(409);
    state.booking = { ...quoteRequest(), type: "tour" };
    expect((await quote({ price: 100 })).status).toBe(409);
    state.booking = quoteRequest();
    state.allowed = false;
    expect((await quote({ price: 100 })).status).toBe(403);
    state.allowed = true;
    vi.stubEnv("VERCEL_ENV", "preview");
    expect((await quote({ price: 100 })).status).toBe(503);
    expect(state.updates).toHaveLength(0);
    expect(state.emails).toHaveLength(0);
  });
});

describe("admin overview", () => {
  it("lists open transfer quote requests, soonest first", () => {
    const row = (reference: string, date: string | null, status = "new") => ({ id: reference, reference, customer_name: "Guest", tour_name: "Private transfer", date, status });
    const attention = buildAdminAttention({ now: new Date("2026-11-20T10:00:00Z"), quoteRequests: [row("B", "2026-12-05"), row("A", "2026-11-25"), row("OLD", "2026-11-01"), row("X", "2026-12-01", "cancelled")] });
    const item = attention.items.find((entry) => entry.id === "quotes-to-send")!;
    expect(item.count).toBe(2);
    expect(item.entries.map((entry) => entry.title)).toEqual(["A · Guest", "B · Guest"]);
    expect(buildAdminAttention({ now: new Date(), quoteRequests: [] }).items).toHaveLength(0);
  });
});
