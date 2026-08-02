import { describe, expect, it } from "vitest";
import { googleAdsErrorMessage } from "@/lib/google-ads";

describe("Google Ads diagnostics", () => {
  it("turns an empty 401 response into actionable OAuth guidance", () => {
    const message = googleAdsErrorMessage({}, 401, "request-123");
    expect(message).toContain("Google rejected the OAuth access token");
    expect(message).toContain("two-step verification");
    expect(message).toContain("Request ID: request-123");
  });

  it("preserves nested Google Ads failure codes and messages", () => {
    const message = googleAdsErrorMessage({ error: {
      code: 403,
      status: "PERMISSION_DENIED",
      details: [{ errors: [{ errorCode: { authorizationError: "USER_PERMISSION_DENIED" }, message: "User lacks access." }] }],
    } }, 403, null);
    expect(message).toContain("USER_PERMISSION_DENIED: User lacks access.");
    expect(message).toContain("PERMISSION_DENIED / 403");
  });

  it("explains that a test-account token cannot read production accounts", () => {
    const message = googleAdsErrorMessage({ error: { code: 403, status: "PERMISSION_DENIED", details: [{ errors: [{ errorCode: { authorizationError: "DEVELOPER_TOKEN_NOT_APPROVED" }, message: "The developer token is only approved for use with test accounts." }] }] } }, 403, null);
    expect(message).toContain("DEVELOPER_TOKEN_NOT_APPROVED");
    expect(message).toContain("Apply for Basic Access");
  });
});
