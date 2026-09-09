import { NextResponse } from "next/server";
import { getLiveTours, getPublicSiteSettings } from "@/lib/live-content";

export const dynamic = "force-dynamic";

// The homepage (live tour prices) and SiteSettingsContext (public settings) both
// read this on the client. Blog posts are rendered server-side on the blog
// routes and were never consumed here, so they are deliberately excluded: with
// ~200 published articles the `blogs` array was ~1.8 MB uncompressed (~520 KB
// gzip) and was being downloaded and JSON-parsed twice on every page load,
// which pushed mobile TBT to ~2 s and tanked the Lighthouse score.
export async function GET() {
  const [tours, settings] = await Promise.all([getLiveTours(), getPublicSiteSettings()]);
  return NextResponse.json(
    { tours, settings },
    { headers: { "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300" } },
  );
}
