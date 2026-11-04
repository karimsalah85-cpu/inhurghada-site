import { describe, expect, it } from "vitest";
import { normalizeGooglePlace } from "@/lib/google-reviews";

describe("Google review normalization", () => {
  it("keeps public attribution links and strips unrelated API fields", () => {
    const result = normalizeGooglePlace({
      displayName: { text: "Daily Red Sea" }, rating: 4.8, userRatingCount: 27,
      googleMapsLinks: { placeUri: "https://maps.google.com/place" },
      secret: "must-not-leak",
      reviews: [{ rating: 5, text: { text: "Excellent trip" }, relativePublishTimeDescription: "a week ago", authorAttribution: { displayName: "Guest", uri: "https://maps.google.com/guest" }, googleMapsUri: "https://maps.google.com/review", flagContentUri: "https://maps.google.com/report" }],
    }, "https://maps.google.com/fallback");
    expect(result.placeName).toBe("Daily Red Sea");
    expect(result.reviews[0]).toMatchObject({ authorName: "Guest", rating: 5, text: "Excellent trip", reportUri: "https://maps.google.com/report" });
    expect(result).not.toHaveProperty("secret");
  });
});

// A configured legacy key must never cause a paid request after this change.
import { afterEach, vi } from "vitest";
import { GET } from "@/app/api/google-reviews/route";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("zero-cost review delivery", () => {
  it("retires the live endpoint without contacting Google", async () => {
    vi.stubEnv("GOOGLE_PLACES_API_KEY", "legacy-key-must-not-be-used");
    const fetch = vi.fn(() => { throw new Error("No external API calls allowed"); });
    vi.stubGlobal("fetch", fetch);
    const response = await GET();
    expect(response.status).toBe(410);
    expect(await response.json()).toMatchObject({ source: "manual", code: "LIVE_FEED_RETIRED" });
    expect(fetch).not.toHaveBeenCalled();
  });
});
