import { googleMapsUrl } from "@/lib/contact";
import { normalizeGooglePlace } from "@/lib/google-reviews";

const DEFAULT_PLACE_ID = "ChIJXZ9eh4x-YCURk7atPmlNA5c";
const supportedLanguages = new Set(["en", "de", "ru", "ar", "zh"]);

const json = (body: unknown, status = 200) => Response.json(body, {
  status,
  headers: { "Cache-Control": "private, no-store, max-age=0" },
});

export async function GET(request: Request) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!apiKey) return json({ code: "NOT_CONFIGURED", error: "Google reviews are not configured." }, 503);

  const placeId = process.env.GOOGLE_PLACE_ID?.trim() || DEFAULT_PLACE_ID;
  const requestedLanguage = new URL(request.url).searchParams.get("language") || "en";
  const language = supportedLanguages.has(requestedLanguage) ? requestedLanguage : "en";
  const endpoint = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`);
  endpoint.searchParams.set("languageCode", language);

  try {
    const response = await fetch(endpoint, {
      cache: "no-store",
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "displayName,rating,userRatingCount,reviews,googleMapsLinks",
      },
    });
    if (!response.ok) return json({ code: "GOOGLE_API_ERROR", error: "Google reviews are temporarily unavailable." }, 502);
    const source = await response.json() as Record<string, unknown>;
    return json(normalizeGooglePlace(source, googleMapsUrl));
  } catch {
    return json({ code: "GOOGLE_API_ERROR", error: "Google reviews are temporarily unavailable." }, 502);
  }
}
