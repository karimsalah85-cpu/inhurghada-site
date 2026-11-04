// Old browser bundles may still request this endpoint. Retire the live feed
// explicitly so they take their normal fallback path; never call a metered API.
export async function GET() {
  return Response.json({
    code: "LIVE_FEED_RETIRED",
    source: "manual",
    error: "Review excerpts are now included directly on the website.",
  }, { status: 410, headers: { "Cache-Control": "public, max-age=300" } });
}
