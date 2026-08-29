const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ReviewSubmissionInput = {
  reference: string;
  email: string;
  rating: number;
  body: string;
};

export function validateReviewSubmission(input: Record<string, unknown>) {
  const reference = String(input.reference ?? "").trim().slice(0, 40);
  const email = String(input.email ?? "").trim().slice(0, 180).toLowerCase();
  const rating = Math.trunc(Number(input.rating));
  const body = String(input.body ?? "").trim().slice(0, 2000);

  if (!reference) return { data: null, error: "Your booking reference is required." };
  if (!emailPattern.test(email)) return { data: null, error: "A valid email address is required." };
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) return { data: null, error: "Rating must be between 1 and 5." };
  if (!body) return { data: null, error: "Please write a few words about your trip." };

  return { data: { reference, email, rating, body } as ReviewSubmissionInput, error: null };
}
