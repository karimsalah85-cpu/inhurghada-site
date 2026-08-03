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
