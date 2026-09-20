import { describe, expect, it } from "vitest";
import { availablePercentFromUnits, isValidReferralCode, redeemableUnits, referralCustomerKey, referralLink } from "@/lib/referral";
import { validateBookingInput } from "@/lib/booking-validation";

const valid = { idempotencyKey: "123e4567-e89b-42d3-a456-426614174000", type: "tour", customerName: "Test Guest", phone: "+20 100 000 0000", customerEmail: "guest@example.com", hotel: "Test Hotel", date: "2099-01-01", tourName: "Orange Bay Island Snorkeling Boat Trip", adults: 1 };

describe("referralCustomerKey", () => {
  it("prefers normalized email over phone", () => {
    expect(referralCustomerKey(" Guest@Example.com ", "+20 100 000 0000")).toBe("guest@example.com");
  });
  it("falls back to digits-only phone when no email", () => {
    expect(referralCustomerKey(undefined, "+20 100 000 0000")).toBe("201000000000");
  });
  it("returns null when neither is usable", () => {
    expect(referralCustomerKey("", "")).toBeNull();
  });
  it("treats the same customer identically regardless of phone formatting", () => {
    expect(referralCustomerKey(undefined, "+20-100-000-0000")).toBe(referralCustomerKey(undefined, "+20 100 000 0000"));
  });
});

describe("referral code validation", () => {
  it("accepts the DRS-XXXXXX format", () => {
    expect(isValidReferralCode("DRS-X7K29A")).toBe(true);
  });
  it("rejects malformed codes", () => {
    expect(isValidReferralCode("drs-x7k29a")).toBe(false);
    expect(isValidReferralCode("DRS-X7K2")).toBe(false);
    expect(isValidReferralCode("ABC-X7K29A")).toBe(false);
    expect(isValidReferralCode(undefined)).toBe(false);
  });
});

describe("referral reward unit math (1 unit = 5%)", () => {
  it("converts reward units to a percentage", () => {
    expect(availablePercentFromUnits(1)).toBe(5);
    expect(availablePercentFromUnits(2)).toBe(10);
    expect(availablePercentFromUnits(3)).toBe(15);
    expect(availablePercentFromUnits(4)).toBe(20);
  });
  it("caps redeemable units at 3 (15%) regardless of balance", () => {
    expect(redeemableUnits(4)).toBe(3);
    expect(redeemableUnits(1)).toBe(1);
    expect(redeemableUnits(0)).toBe(0);
    expect(redeemableUnits(-1)).toBe(0);
  });
});

describe("referral link", () => {
  it("builds a ?ref= link without leaking anything but the code", () => {
    const link = referralLink("https://dailyredsea.com", "DRS-X7K29A");
    expect(link).toBe("https://dailyredsea.com/?ref=DRS-X7K29A");
  });
});

describe("booking input validation — referral fields", () => {
  it("accepts a well-formed referral code and uppercases it", () => {
    const result = validateBookingInput({ ...valid, referralCode: "drs-x7k29a" });
    expect(result.data?.referralCode).toBe("DRS-X7K29A");
  });

  it("rejects a malformed referral code", () => {
    expect(validateBookingInput({ ...valid, referralCode: "not-a-code" }).error).toMatch(/referral code/i);
  });

  it("omits referralCode entirely when not provided", () => {
    const result = validateBookingInput(valid);
    expect(result.data && "referralCode" in result.data).toBe(false);
  });

  it("clamps redeemReferralUnits to between 0 and 3", () => {
    expect(validateBookingInput({ ...valid, redeemReferralUnits: 99 }).data?.redeemReferralUnits).toBe(3);
    expect(validateBookingInput({ ...valid, redeemReferralUnits: -5 }).data?.redeemReferralUnits).toBe(0);
    expect(validateBookingInput({ ...valid, redeemReferralUnits: 2 }).data?.redeemReferralUnits).toBe(2);
    expect(validateBookingInput(valid).data?.redeemReferralUnits).toBe(0);
  });
});
