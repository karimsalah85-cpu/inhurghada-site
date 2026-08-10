import { describe, expect, it } from "vitest";
import { adminInvitationRedirectUrl, escapeInvitationHtml, isPendingInvitation, parseAuthSessionHash } from "@/lib/admin-invitations";

describe("admin invitations", () => {
  it("identifies only unaccepted invited users as pending", () => {
    expect(isPendingInvitation({ invited_at: "2026-08-10T10:00:00Z" })).toBe(true);
    expect(isPendingInvitation({ invited_at: "2026-08-10T10:00:00Z", confirmed_at: "2026-08-10T10:05:00Z" })).toBe(false);
    expect(isPendingInvitation({})).toBe(false);
  });

  it("escapes names and generated URLs before placing them in email HTML", () => {
    expect(escapeInvitationHtml(`Karim <admin> & "team"`)).toBe("Karim &lt;admin&gt; &amp; &quot;team&quot;");
  });

  it("always sends admin invitations to the public password setup page", () => {
    expect(adminInvitationRedirectUrl).toBe("https://dailyredsea.com/admin/reset-password");
  });

  it("extracts an implicit auth session from an invitation redirect", () => {
    expect(parseAuthSessionHash("#access_token=access-123&refresh_token=refresh-456&type=invite")).toEqual({
      access_token: "access-123",
      refresh_token: "refresh-456",
    });
    expect(parseAuthSessionHash("#error=access_denied&error_code=otp_expired")).toBeNull();
  });
});
