export type GoogleReview = {
  authorName: string;
  authorUri?: string;
  rating: number;
  text: string;
  originalText?: string;
  relativeTime: string;
  reviewUri?: string;
  reportUri?: string;
};

export type GoogleReviewsPayload = {
  placeName: string;
  placeUri: string;
  rating: number;
  reviewCount: number;
  reviews: GoogleReview[];
};

type GoogleText = { text?: unknown };
type GoogleAuthor = { displayName?: unknown; uri?: unknown };
type GoogleReviewSource = {
  authorAttribution?: GoogleAuthor;
  rating?: unknown;
  text?: GoogleText;
  originalText?: GoogleText;
  relativePublishTimeDescription?: unknown;
  googleMapsUri?: unknown;
  flagContentUri?: unknown;
};

const text = (value: unknown) => typeof value === "string" ? value : "";
const number = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : 0;

export function normalizeGooglePlace(source: Record<string, unknown>, fallbackPlaceUri: string): GoogleReviewsPayload {
  const displayName = source.displayName as GoogleText | undefined;
  const mapsLinks = source.googleMapsLinks as { placeUri?: unknown } | undefined;
  const sourceReviews = Array.isArray(source.reviews) ? source.reviews as GoogleReviewSource[] : [];

  return {
    placeName: text(displayName?.text) || "Daily Red Sea",
    placeUri: text(mapsLinks?.placeUri) || fallbackPlaceUri,
    rating: number(source.rating),
    reviewCount: number(source.userRatingCount),
    reviews: sourceReviews.map((review) => ({
      authorName: text(review.authorAttribution?.displayName) || "Google user",
      authorUri: text(review.authorAttribution?.uri) || undefined,
      rating: number(review.rating),
      text: text(review.text?.text),
      originalText: text(review.originalText?.text) || undefined,
      relativeTime: text(review.relativePublishTimeDescription),
      reviewUri: text(review.googleMapsUri) || undefined,
      reportUri: text(review.flagContentUri) || undefined,
    })).filter((review) => review.text),
  };
}
