import { describe, expect, it } from "vitest";
import { validateReviewSubmission } from "@/lib/review-validation";

describe("Review submission validation", () => {
  it("accepts a well-formed review", () => {
    const result = validateReviewSubmission({
      reference: "DRS-20260801-ABC123",
      email: "Guest@Example.com",
      rating: 5,
      body: "Amazing snorkeling trip, the crew was fantastic.",
    });
    expect(result.error).toBeNull();
    expect(result.data).toMatchObject({ reference: "DRS-20260801-ABC123", email: "guest@example.com", rating: 5 });
  });

  it("rejects a missing booking reference", () => {
    const result = validateReviewSubmission({ reference: "", email: "guest@example.com", rating: 5, body: "Great trip" });
    expect(result.data).toBeNull();
    expect(result.error).toMatch(/reference/i);
  });

  it("rejects an invalid email", () => {
    const result = validateReviewSubmission({ reference: "DRS-1", email: "not-an-email", rating: 4, body: "Great trip" });
    expect(result.data).toBeNull();
    expect(result.error).toMatch(/email/i);
  });

  it.each([0, 6, -1, NaN])("rejects an out-of-range rating (%s)", (rating) => {
    const result = validateReviewSubmission({ reference: "DRS-1", email: "guest@example.com", rating, body: "Great trip" });
    expect(result.data).toBeNull();
    expect(result.error).toMatch(/rating/i);
  });

  it("rejects an empty review body", () => {
    const result = validateReviewSubmission({ reference: "DRS-1", email: "guest@example.com", rating: 4, body: "   " });
    expect(result.data).toBeNull();
    expect(result.error).toMatch(/trip/i);
  });
});
