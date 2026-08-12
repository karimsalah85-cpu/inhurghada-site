import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { hasAdminPermission, isAuthorizedAdmin, type AdminPermission } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";

const tables = { content: "content_items", media: "media_assets", availability: "tour_availability", staff: "staff_members", assignments: "booking_assignments", notes: "customer_notes", templates: "communication_templates", queue: "communication_queue", settings: "site_settings", redirects: "redirect_rules" } as const;
const permissions: Record<keyof typeof tables, AdminPermission> = { content:"content",media:"content",availability:"operations",staff:"operations",assignments:"operations",notes:"operations",templates:"operations",queue:"operations",settings:"settings",redirects:"content" };
const previewMutationBlocked = () => process.env.VERCEL_ENV === "preview";

export async function PATCH(request: NextRequest, context: { params: Promise<{ resource: string; id: string }> }) {
  if (previewMutationBlocked()) return NextResponse.json({ error: "Administration changes are disabled in this preview until an isolated test database is configured." }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAuthorizedAdmin(user)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { resource, id } = await context.params;
  if (!Object.hasOwn(tables, resource)) return NextResponse.json({ error: "Unknown resource." }, { status: 400 });
  if (!hasAdminPermission(user,permissions[resource as keyof typeof tables])) return NextResponse.json({error:"Your role cannot manage this resource."},{status:403});
  const table = tables[resource as keyof typeof tables];
  const key = resource === "settings" ? "key" : "id";
  const { data: before, error: readError } = await supabase.from(table).select("*").eq(key, id).single();
  if (readError) return NextResponse.json({ error: "Record not found." }, { status: 404 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  const allowed: Record<string, string[]> = {
    content: ["content_type", "slug", "locale", "status", "listing_status", "title", "excerpt", "body", "seo_title", "seo_description", "canonical_path", "featured_image", "publish_at"],
    media: ["storage_path", "public_url", "file_name", "mime_type", "alt_text", "credit", "source_url", "creator", "license_type", "license_url", "attribution_text", "attribution_required", "rights_status", "authenticity", "focal_x", "focal_y"], availability: ["tour_slug", "service_date", "start_time", "capacity", "blocked", "price_override", "currency", "notes"], staff: ["name", "staff_type", "phone", "languages", "active", "notes"], assignments: ["booking_id", "supplier_id", "staff_member_id", "assignment_type", "pickup_time", "internal_cost", "currency", "status", "notes"], notes: ["customer_key", "customer_name", "note", "tags"], templates: ["name", "channel", "event_key", "locale", "subject", "body", "active"], queue: ["booking_id", "template_id", "channel", "recipient", "scheduled_for", "status"], settings: ["value", "category", "public", "description"], redirects: ["source_path", "destination_path", "permanent", "active"],
  };
  const update = Object.fromEntries(allowed[resource].filter((field) => Object.hasOwn(body, field)).map((field) => [field, body[field]]));
  if (resource === "content" && !["active", "paused", "unlisted"].includes(String(update.listing_status || before.listing_status || ""))) update.listing_status = "active";
  if (resource === "content" && typeof update.body === "string") { try { update.body = JSON.parse(update.body); } catch { update.body = { content: update.body }; } }
  if (resource === "staff" && typeof update.languages === "string") update.languages = update.languages.split(",").map((item: string) => item.trim()).filter(Boolean);
  if (resource === "notes" && typeof update.tags === "string") update.tags = update.tags.split(",").map((item: string) => item.trim()).filter(Boolean);
  if (["content", "availability", "templates", "redirects"].includes(resource)) update.updated_at = new Date().toISOString();
  if (resource === "content") update.updated_by = user!.id;
  const { data, error } = await supabase.from(table).update(update).eq(key, id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await supabase.rpc("record_admin_audit", { action_name: "update", resource_name: resource, resource_identifier: id, summary_text: `Updated ${resource} record`, before_value: before, after_value: data });
  if (resource === "content") {
    revalidatePath("/", "layout");
    revalidatePath("/sitemap.xml");
  }
  return NextResponse.json({ record: data }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ resource: string; id: string }> }) {
  if (previewMutationBlocked()) return NextResponse.json({ error: "Administration changes are disabled in this preview until an isolated test database is configured." }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAuthorizedAdmin(user)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { resource, id } = await context.params;
  if (!Object.hasOwn(tables, resource)) return NextResponse.json({ error: "Unknown resource." }, { status: 400 });
  if (!hasAdminPermission(user,permissions[resource as keyof typeof tables])) return NextResponse.json({error:"Your role cannot manage this resource."},{status:403});
  const table = tables[resource as keyof typeof tables];
  const key = resource === "settings" ? "key" : "id";
  const { data: before, error: readError } = await supabase.from(table).select("*").eq(key, id).single();
  if (readError) return NextResponse.json({ error: "Record not found." }, { status: 404 });
  if (resource === "media") {
    const mediaUrl = String(before.public_url || before.storage_path || "");
    const { data: explicitUsages, error: usageError } = await supabase.from("media_usages").select("owner_type,owner_key,role").eq("asset_id", id).limit(20);
    if (usageError) return NextResponse.json({ error: "Image usage could not be verified, so deletion was blocked." }, { status: 503 });
    const { data: contentRows, error: contentError } = await supabase.from("content_items").select("id,title,featured_image,body").limit(1000);
    if (contentError) return NextResponse.json({ error: "Legacy image usage could not be verified, so deletion was blocked." }, { status: 503 });
    const legacyUsages = (contentRows || []).filter((row) => row.featured_image === mediaUrl || JSON.stringify(row.body || {}).includes(mediaUrl)).map((row) => ({ owner_type: "content", owner_key: String(row.id), role: String(row.title || "content") }));
    const usages = [...(explicitUsages || []), ...legacyUsages];
    if (usages.length) return NextResponse.json({ error: "This image is still in use and cannot be deleted.", usages }, { status: 409 });
  }
  const { error } = await supabase.from(table).delete().eq(key, id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await supabase.rpc("record_admin_audit", { action_name: "delete", resource_name: resource, resource_identifier: id, summary_text: `Deleted ${resource} record`, before_value: before });
  return NextResponse.json({ deleted: true }, { headers: { "Cache-Control": "private, no-store" } });
}
