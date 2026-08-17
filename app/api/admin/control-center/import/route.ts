import { NextResponse } from "next/server";
import { blogPosts } from "@/data/blog-posts";
import { tours } from "@/data/tours";
import { hasLivePermission } from "@/lib/admin-permission";
import { createClient } from "@/utils/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!(await hasLivePermission(supabase, user, "content"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const now = new Date().toISOString();
  const rows = [
    ...tours.map((tour) => ({ content_type: "tour", slug: tour.slug, locale: "en", status: "published", listing_status: tour.listingStatus || "active", title: tour.title, excerpt: tour.description, body: tour, seo_title: tour.seoTitle || null, seo_description: tour.metaDescription || null, featured_image: tour.image, published_at: now, created_by: user!.id, updated_by: user!.id })),
    ...blogPosts.map((post) => ({ content_type: "blog", slug: post.slug, locale: "en", status: "published", listing_status: "active", title: post.title, excerpt: post.intro, body: post, seo_title: post.title, seo_description: post.metaDescription, featured_image: post.heroImage, published_at: post.publishedAt, created_by: user!.id, updated_by: user!.id })),
  ];
  const { error } = await supabase.from("content_items").upsert(rows, { onConflict: "content_type,slug,locale", ignoreDuplicates: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await supabase.rpc("record_admin_audit", { action_name: "import", resource_name: "content", resource_identifier: "current-site", summary_text: `Imported ${rows.length} current site records` });
  return NextResponse.json({ imported: rows.length });
}
