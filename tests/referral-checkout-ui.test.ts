import { describe, expect, it } from "vitest";
import { verifiedRewardSelection } from "@/components/booking/ReferralRewardsField";

const verifiedAccount = { email: "customer@example.com", token: "server-verified-proof", balanceUnits: 6 };
describe("explicit verified referral reward selection", () => {
  it("never requests rewards without opt-in", () => {
    expect(verifiedRewardSelection(verifiedAccount, verifiedAccount.email, false)).toBeNull();
  });
  it("does not carry an identity's redemption onto another booking contact", () => {
    expect(verifiedRewardSelection(verifiedAccount, "other@example.com", true)).toBeNull();
    expect(verifiedRewardSelection(null, verifiedAccount.email, true)).toBeNull();
  });
  it("caps redemption at 3 units while preserving an uncapped available balance", () => {
    expect(verifiedRewardSelection(verifiedAccount, " CUSTOMER@example.com ", true)).toEqual({ token: "server-verified-proof", units: 3 });
    expect(verifiedAccount.balanceUnits).toBe(6);
  });
  it("uses smaller balances without rounding up or accepting corrupt values", () => {
    expect(verifiedRewardSelection({ ...verifiedAccount, balanceUnits: 1 }, verifiedAccount.email, true)?.units).toBe(1);
    for (const balanceUnits of [-1, 0, 1.5, Number.NaN]) {
      expect(verifiedRewardSelection({ ...verifiedAccount, balanceUnits }, verifiedAccount.email, true)).toBeNull();
    }
  });
});
