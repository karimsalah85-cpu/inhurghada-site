import { describe, expect, it } from "vitest";
import { buildReferralMessage } from "@/lib/referral-messages";
import { locales } from "@/lib/i18n";

describe("post-trip communication", () => {
  it("thanks, requests review and explains referrals without amounts or receipt attachment", () => {
    const result = buildReferralMessage({event:"trip_completed",customerName:"Sam",qualified:true,referralCode:"DRS-ABC123",locale:"en"});
    expect(result.subject).toContain("Thank you");
    expect(result.html).toContain("/reviews");
    expect(result.html).toContain("GIVE 5% — EARN 5%");
    expect(result.html).toContain("wa.me/");
    expect(result.html).toContain("?ref=DRS-ABC123");
    expect(result.html).not.toMatch(/paid|payment|receipt|\.pdf|\$|USD|amount/i);
    expect(result).not.toHaveProperty("attachment");
  });
  it("does not share a code before qualification", () => {
    const result=buildReferralMessage({event:"trip_completed",customerName:"Sam",qualified:false,referralCode:"DRS-ABC123"});
    expect(result.html).toContain("Complete your first paid");
    expect(result.html).not.toContain("?ref=");
  });
  it.each(locales)("localizes %s and preserves reward carryover wording", locale => {
    const result=buildReferralMessage({event:"reward_earned",customerName:"<script>",qualified:true,referralCode:"DRS-ABC123",balanceUnits:5,locale});
    expect(result.html).toContain('lang="'+locale+'"');
    expect(result.html).toContain("25%");
    expect(result.html).toContain("15%");
    expect(result.html).not.toContain("<script>");
    expect(result.html).toContain(locale==="ar" ? 'dir="rtl"' : 'dir="ltr"');
  });
});

it.each(locales)("post-trip %s links to the real review form with reference and invites referrals", locale => {
 const result=buildReferralMessage({event:"trip_completed",customerName:"Sam",qualified:true,referralCode:"DRS-ABC123",locale,bookingReference:"DRS-TEST"});
 expect(result.html).toContain('/reviews?lang='+locale+'&amp;ref=DRS-TEST');
 expect(result.html).not.toContain('/'+locale+'/reviews');
 expect(result.html).toContain('wa.me/');
 expect(result.html).toContain('referrals');
 if(locale==='en') expect(result.text).toContain('Invite your friends and family');
});
