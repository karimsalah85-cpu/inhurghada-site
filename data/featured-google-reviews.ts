/**
 * Manually maintained excerpts from genuine customer reviews.
 * No Places API, scraping service, subscription, or billing account is used.
 * Add only verified text, the original author/rating, and a Google source URL.
 * Use absolute dates; do not add a live aggregate score or relative timestamps.
 */
import { googleMapsUrl } from "@/lib/contact";

export type FeaturedGoogleReview = {
  id: string;
  authorName: string;
  rating: number;
  excerpt: string;
  reviewUrl: string;
  language: string;
  translatedByGoogle?: boolean;
};

// Verified directly on the Google Maps reviews tab on 2026-11-04.
// Owner supplied the five excerpts on 2026-11-04, also verified on Maps.
// The link opens the official listing containing the original reviews.
export const featuredGoogleReviews: FeaturedGoogleReview[] = [
  {
    id: "mohamed-elshazly",
    authorName: "Mohamed Elshazly",
    rating: 5,
    excerpt: "We had very great experience with them very professional and organised.",
    reviewUrl: googleMapsUrl,
    language: "en",
  },
  {
    id: "ahmed-hewail",
    authorName: "Ahmed Hewail",
    rating: 5,
    excerpt: "Best trip ever.",
    reviewUrl: googleMapsUrl,
    language: "en",
  },
  {
    id: "mohamed-salah-eldin",
    authorName: "Mohamed salah eldin",
    rating: 5,
    excerpt: "Smooth booking, fair prices, great service. Highly recommend. Will definitely use it again for excursions in Hurghada.",
    reviewUrl: googleMapsUrl,
    language: "en",
  },
  {
    id: "basma-elhakim",
    authorName: "Basma Elhakim",
    rating: 5,
    excerpt: "The experience was wonderful, everything was great, and it won't be the last time, God willing. 🌷 …",
    reviewUrl: googleMapsUrl,
    language: "en",
    translatedByGoogle: true,
  },
  {
    id: "steffi-feldmann",
    authorName: "Steffi Feldmann",
    rating: 5,
    excerpt: "Easy booking, quick response times, no hidden fees or extra costs. Our Luxor trip was fantastic! …",
    reviewUrl: googleMapsUrl,
    language: "en",
    translatedByGoogle: true,
  },
];
