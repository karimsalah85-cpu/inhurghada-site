import { describe, expect, it } from "vitest";
import { buildCustomerConfirmationEmail, buildThankYouEmail } from "@/lib/booking-communications-i18n";
import { buildBookingAndPaymentStatusEmail } from "@/lib/booking-status-notification";
import { withCustomerEmailSignature } from "@/lib/booking-service";
import { buildAutomationEmail, buildOfficeNoticeEmail, buildOperatorBookingEmail, buildStaffInvitationEmail, buildVerificationCodeEmail } from "@/lib/email/messages";
import { buildReferralMessage } from "@/lib/referral-messages";
import { buildSupplierBookingDetails, buildSupplierEmail, type SupplierBookingRow } from "@/lib/supplier-dispatch";

const supplierBooking = {
  reference: "DRS-ABC123", type: "tour", customer_name: "Anna Müller", phone: "+49 170 1234567", tour_name: "Orange Bay",
  date: "2026-10-12", start_time: "08:00:00", guests: 3, adults: 2, youth: 1, infants: 0, hotel: "Steigenberger Al Dau",
  notes: null, amount: 120, currency: "EUR", payment_status: "unpaid", status: "confirmed",
} as SupplierBookingRow;

/** Every template the site sends, so a new one that skips the shared layout fails here. */
const emails: Record<string, string> = {
  confirmation: buildCustomerConfirmationEmail({ locale: "en", customerName: "Sam", reference: "DRS-1", itemName: "Orange Bay" }).html,
  status: buildBookingAndPaymentStatusEmail({ reference: "DRS-1", customer_name: "Sam", customer_email: "sam@example.com", tour_name: "Orange Bay", date: "2026-10-12", status: "confirmed", payment_status: "unpaid", amount: 50, currency: "USD" })!.html,
  thankYouShort: buildThankYouEmail({ locale: "en", customerName: "Sam", reference: "DRS-1", tourName: "Orange Bay" }).html,
  postTrip: buildReferralMessage({ event: "trip_completed", customerName: "Sam", qualified: true, referralCode: "DRS-ABC123" }).html,
  referralUnlocked: buildReferralMessage({ event: "activated", customerName: "Sam", qualified: true, referralCode: "DRS-ABC123" }).html,
  referralReward: buildReferralMessage({ event: "reward_earned", customerName: "Sam", qualified: true, referralCode: "DRS-ABC123", balanceUnits: 2 }).html,
  supplier: buildSupplierEmail({ kind: "request", supplierName: "Captain Ali", details: buildSupplierBookingDetails(supplierBooking), link: "https://dailyredsea.com/supplier/x", adminNote: "Upper deck" }).html,
  supplierCancelled: buildSupplierEmail({ kind: "cancelled", supplierName: "Captain Ali", details: buildSupplierBookingDetails(supplierBooking), link: "https://dailyredsea.com/supplier/x" }).html,
  operator: buildOperatorBookingEmail({ bookingType: "tour", reference: "DRS-1", customerName: "Sam", tourName: "Orange Bay" }).html,
  verificationCode: buildVerificationCodeEmail({ locale: "en", code: "482913" }).html,
  staffInvitation: buildStaffInvitationEmail({ displayName: "Mona", url: "https://example.supabase.co/auth/v1/verify?token=abc&type=invite" }).html,
  officeNotice: buildOfficeNoticeEmail({ subject: "Supplier declined DRS-1", lines: ["Captain Ali declined.", "Reason: full."] }).html,
  automation: buildAutomationEmail({ subject: "Your pickup tomorrow", body: "Hello Sam,\n\nPickup at 08:00." }).html,
};

describe("shared email layout", () => {
  it.each(Object.entries(emails))("%s uses the booking-confirmation design", (_name, html) => {
    expect(html.startsWith("<!doctype html>")).toBe(true);
    // Accent rule + wordmark masthead, the confirmation email's opening.
    expect(html).toContain("border-top:4px solid #");
    expect(html).toContain("/brand/dailyredsea-wordmark-email.png");
    expect(html).toContain('class="headline');
    expect(html).toContain("dailyredsea.com</a>");
    // Complete emails carry their own footer, so the fallback signature is never appended.
    expect(withCustomerEmailSignature("guest@example.com", html)).toBe(html);
  });

  it("keeps Arabic emails right-to-left with the reference readable left-to-right", () => {
    const html = buildBookingAndPaymentStatusEmail({ reference: "DRS-1", customer_name: "كريم", customer_email: "k@example.com", tour_name: "رحلة", date: null, status: "confirmed", payment_status: "paid", locale: "ar" })!.html;
    expect(html).toContain('<html lang="ar" dir="rtl">');
    expect(html).toContain('dir="ltr" style="font-size:10px;line-height:16px;color:#767975;">DRS-1</td>');
    expect(html).toContain("تحديث حالة الحجز");
  });

  it("escapes values in the short transactional emails", () => {
    const html = [
      buildOperatorBookingEmail({ reference: "DRS-<script>", customerName: "<img>", message: "<b>note</b>\nline two" }).html,
      buildStaffInvitationEmail({ displayName: "<script>", url: "https://example.com/?a=1&b=\"2\"" }).html,
      buildOfficeNoticeEmail({ subject: "<script>", lines: ["<img>"] }).html,
      buildAutomationEmail({ subject: "<script>", body: "<img>" }).html,
    ].join("");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img>");
    expect(html).toContain("&lt;b&gt;note&lt;/b&gt;<br>line two");
    expect(html).toContain('href="https://example.com/?a=1&amp;b=&quot;2&quot;"');
  });

  it("turns links in automation templates into clickable links and keeps paragraphs", () => {
    const html = buildAutomationEmail({ subject: "How was your trip?", body: "Hello Sam,\n\nShare your experience: https://dailyredsea.com/reviews?lang=en&ref=DRS-1.\n\nThank you,\nDaily Red Sea" }).html;
    expect(html).toContain('<a href="https://dailyredsea.com/reviews?lang=en&amp;ref=DRS-1"');
    expect(html).toContain("Thank you,<br>Daily Red Sea");
    expect(html.match(/<p /g)?.length).toBeGreaterThanOrEqual(3);
  });

  it("shows the one-time code and the invitation button", () => {
    expect(emails.verificationCode).toContain(">482913</p>");
    expect(emails.staffInvitation).toContain('href="https://example.supabase.co/auth/v1/verify?token=abc&amp;type=invite"');
    expect(emails.staffInvitation).toContain("Accept invitation");
  });
});
