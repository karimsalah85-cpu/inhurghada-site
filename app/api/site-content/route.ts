import { NextResponse } from "next/server";
import { getLiveBlogPosts, getLiveTours, getPublicSiteSettings } from "@/lib/live-content";

export const dynamic = "force-dynamic";

export async function GET() {
  const [tours, blogs, settings] = await Promise.all([getLiveTours(), getLiveBlogPosts(), getPublicSiteSettings()]);
  return NextResponse.json({ tours, blogs, settings }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}
