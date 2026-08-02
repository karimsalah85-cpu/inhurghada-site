import { describe, expect, it } from "vitest";
import { googleAdsErrorMessage } from "@/lib/google-ads";

describe("Google Ads diagnostics", () => {
  it("turns an empty 401 response into actionable OAuth guidance", () => {
    const message = googleAdsErrorMessage({}, 401, "request-123");
    expect(message).toContain("Google rejected the OAuth authorization");
    expect(message).toContain("adwords scope");
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
});
