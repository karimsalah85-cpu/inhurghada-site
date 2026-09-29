import { describe, expect, it } from "vitest";
import { normalizePartnerRecord } from "@/lib/partner-record";

describe("normalizePartnerRecord", () => {
  it("accepts every partner type with WhatsApp and payment details", () => {
    for (const kind of ["boat", "guide", "driver", "hotel", "company", "other"]) {
      const result = normalizePartnerRecord("supplier", { name: "Partner", supplier_type: kind });
      expect(result).toHaveProperty("record.type", kind);
    }
    const result = normalizePartnerRecord("supplier", {
      name: " Captain Ali ", whatsapp: " +20 100 123 4567 ", payment_method: "InstaPay", payment_details: "ali@instapay",
    });
    expect(result).toEqual({ record: expect.objectContaining({
      name: "Captain Ali", whatsapp: "+20 100 123 4567", payment_method: "instapay", payment_details: "ali@instapay",
    }) });
  });

  it("clears optional fields that were emptied", () => {
    const result = normalizePartnerRecord("supplier", { name: "Driver", whatsapp: "", payment_method: "", payment_details: "  " });
    expect(result).toEqual({ record: expect.objectContaining({ whatsapp: null, payment_method: null, payment_details: null }) });
  });

  it("rejects unknown types, payment methods, bad emails and short names", () => {
    expect(normalizePartnerRecord("supplier", { name: "X Co", supplier_type: "airline" })).toEqual({ error: "Choose a valid partner type." });
    expect(normalizePartnerRecord("supplier", { name: "X Co", payment_method: "crypto" })).toEqual({ error: "Choose a valid payment method." });
    expect(normalizePartnerRecord("supplier", { name: "X Co", email: "nope" })).toHaveProperty("error");
    expect(normalizePartnerRecord("supplier", { name: "X" })).toHaveProperty("error");
  });

  it("keeps partner-only fields off sales people and validates commission", () => {
    const result = normalizePartnerRecord("sales_person", { name: "Hotel desk", commission_percent: "10", whatsapp: "+20" });
    expect(result).toEqual({ record: { name: "Hotel desk", phone: null, email: null, notes: null, commission_percent: 10 } });
    expect(normalizePartnerRecord("sales_person", { name: "Desk", commission_percent: 120 })).toHaveProperty("error");
  });
});
