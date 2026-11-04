import { describe, expect, it } from "vitest";
import { buildNov26Audience, renderNov26, type CampaignBooking } from "@/lib/campaigns/nov26-customers";

const row = (over: Partial<CampaignBooking>): CampaignBooking => ({ id: "1", customer_name: "ann lee", customer_email: "a@example.com", tour_name: "Trip", tour_slug: "orange-bay", cancellation_note: null, archived_at: null, created_at: "2026-10-01", ...over });

describe("nov26 audience", () => {
  it("skips missing emails, archived bookings and the shared inbox", () => {
    expect(buildNov26Audience([row({ customer_email: null }), row({ archived_at: "2026-10-02" }), row({ customer_email: "INFO@dailyredsea.com" })])).toEqual([]);
  });
  it("splits Jeddah and Egypt, including multi-trip Jeddah bookings", () => {
    const audience = buildNov26Audience([row({ customer_email: "b@example.com", tour_slug: "multi-trip", tour_name: "Multi-trip booking: Jeddah Yacht" }), row({})]);
    expect(audience.map(r => [r.email, r.variant, r.firstName])).toEqual([["a@example.com", "egypt", "Ann"], ["b@example.com", "jeddah", "Ann"]]);
  });
  it("gives the apology version only to a no-capacity Mahmya cancellation", () => {
    expect(buildNov26Audience([row({ tour_slug: "mahmya-island", cancellation_note: "No Capacity" })])[0].variant).toBe("egyptApology");
    expect(buildNov26Audience([row({ tour_slug: "mahmya-island" })])[0].variant).toBe("egypt");
  });
  it("de-duplicates by email and escapes the name", () => {
    expect(buildNov26Audience([row({}), row({ customer_email: "A@example.com" })])).toHaveLength(1);
    const html = renderNov26("egypt", "<b>");
    expect(html).toContain("Hello &lt;b&gt;,");
    expect(html).toContain("data-drs-complete-email");
  });
});
