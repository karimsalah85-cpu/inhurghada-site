import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { hasAdminPermission, isAuthorizedAdmin, type AdminPermission } from "@/lib/admin-auth";

const resources = {
  content: "content_items",
  media: "media_assets",
  availability: "tour_availability",
  staff: "staff_members",
  assignments: "booking_assignments",
  notes: "customer_notes",
  templates: "communication_templates",
  queue: "communication_queue",
  settings: "site_settings",
  redirects: "redirect_rules",
} as const;
type Resource = keyof typeof resources;

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
const text = (value: unknown, max: number) => String(value || "").trim().slice(0, max);
const previewMutationBlocked = () => process.env.VERCEL_ENV === "preview";

async function authorized() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user, allowed: isAuthorizedAdmin(user) };
}
const resourcePermission: Record<Resource, AdminPermission> = { content: "content", media: "content", availability: "operations", staff: "operations", assignments: "operations", notes: "operations", templates: "operations", queue: "operations", settings: "settings", redirects: "content" };

export async function GET() {
  const { supabase, user, allowed } = await authorized();
  if (!allowed) return json({ error: "Unauthorized" }, 401);
  const queries = await Promise.all([
    hasAdminPermission(user,"content") ? supabase.from("content_items").select("*").order("updated_at", { ascending: false }).limit(100) : Promise.resolve({data:[],error:null}),
    hasAdminPermission(user,"content") ? supabase.from("media_assets").select("*").order("created_at", { ascending: false }).limit(100) : Promise.resolve({data:[],error:null}),
    hasAdminPermission(user,"content") ? supabase.from("media_asset_localizations").select("asset_id,locale,alt_text,caption").limit(1000) : Promise.resolve({data:[],error:null}),
    hasAdminPermission(user,"content") ? supabase.from("media_usages").select("id,asset_id,owner_type,owner_key,role,sort_order,crop_profile").order("sort_order").limit(1000) : Promise.resolve({data:[],error:null}),
    hasAdminPermission(user,"operations") ? supabase.from("tour_availability").select("*").order("service_date").limit(100) : Promise.resolve({data:[],error:null}),
    hasAdminPermission(user,"operations") ? supabase.from("staff_members").select("*").order("name").limit(100) : Promise.resolve({data:[],error:null}),
    hasAdminPermission(user,"operations") ? supabase.from("booking_assignments").select("*").order("created_at", { ascending: false }).limit(100) : Promise.resolve({data:[],error:null}),
    hasAdminPermission(user,"operations") ? supabase.from("customer_notes").select("*").order("created_at", { ascending: false }).limit(100) : Promise.resolve({data:[],error:null}),
    hasAdminPermission(user,"operations") ? supabase.from("communication_templates").select("*").order("name").limit(100) : Promise.resolve({data:[],error:null}),
    hasAdminPermission(user,"operations") ? supabase.from("communication_queue").select("*").order("scheduled_for", { ascending: false }).limit(100) : Promise.resolve({data:[],error:null}),
    hasAdminPermission(user,"settings") ? supabase.from("site_settings").select("*").order("category").limit(100) : Promise.resolve({data:[],error:null}),
    hasAdminPermission(user,"content") ? supabase.from("redirect_rules").select("*").order("source_path").limit(100) : Promise.resolve({data:[],error:null}),
    supabase.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(50),
    supabase.from("system_health_checks").select("*").order("checked_at", { ascending: false }).limit(20),
  ]);
  const migrationError = queries.find((result) => result.error && ["42P01", "PGRST205"].includes(result.error.code || ""))?.error;
  if (migrationError) return json({ configured: false, migration: "202608010001_admin_control_center.sql" });
  const otherError = queries.find((result) => result.error)?.error;
  if (otherError) return json({ error: otherError.message }, 500);
  const [content, media, mediaLocalizations, mediaUsages, availability, staff, assignments, notes, templates, queue, settings, redirects, audit, health] = queries.map((result) => result.data || []);
  return json({ configured: true, content, media, mediaLocalizations, mediaUsages, availability, staff, assignments, notes, templates, queue, settings, redirects, audit, health });
}

export async function POST(request: NextRequest) {
  if (previewMutationBlocked()) return json({ error: "Administration changes are disabled in this preview until an isolated test database is configured." }, 503);
  const { supabase, user, allowed } = await authorized();
  if (!allowed) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => null);
  const resource = text(body?.resource, 30) as Resource;
  if (!Object.hasOwn(resources, resource)) return json({ error: "Unknown admin resource." }, 400);
  if (!hasAdminPermission(user, resourcePermission[resource])) return json({ error: "Your role cannot manage this resource." }, 403);
  let record: Record<string, unknown>;
  if (resource === "content") {
    record = { content_type: text(body.content_type, 20), slug: text(body.slug, 160).toLowerCase(), locale: text(body.locale, 8) || "en", status: text(body.status, 20) || "draft", listing_status: text(body.listing_status, 20) || "active", title: text(body.title, 200), excerpt: text(body.excerpt, 500) || null, seo_title: text(body.seo_title, 200) || null, seo_description: text(body.seo_description, 500) || null, canonical_path: text(body.canonical_path, 250) || null, featured_image: text(body.featured_image, 500) || null, body: typeof body.body === "object" && body.body ? body.body : { content: text(body.body, 20_000) }, publish_at: body.publish_at || null, created_by: user!.id, updated_by: user!.id };
    if (!record.title || !record.slug || !["tour", "blog", "page", "promotion"].includes(String(record.content_type))) return json({ error: "Enter a valid content type, title, and slug." }, 400);
  } else if (resource === "media") {
    record = { storage_path: text(body.storage_path || body.public_url, 500), public_url: text(body.public_url, 500) || null, file_name: text(body.file_name, 200), mime_type: text(body.mime_type, 100) || null, alt_text: text(body.alt_text, 300) || null, credit: text(body.credit, 200) || null, source_url: text(body.source_url, 1000) || null, creator: text(body.creator, 200) || null, license_type: text(body.license_type, 100) || null, license_url: text(body.license_url, 1000) || null, attribution_text: text(body.attribution_text, 500) || null, attribution_required: Boolean(body.attribution_required), rights_status: text(body.rights_status, 30) || "unverified", authenticity: text(body.authenticity, 30) || "unknown", focal_x: Number(body.focal_x ?? 0.5), focal_y: Number(body.focal_y ?? 0.5), created_by: user!.id };
    if (!record.storage_path || !record.file_name) return json({ error: "Enter an image URL/path and file name." }, 400);
    if (!Number.isFinite(record.focal_x) || !Number.isFinite(record.focal_y) || Number(record.focal_x) < 0 || Number(record.focal_x) > 1 || Number(record.focal_y) < 0 || Number(record.focal_y) > 1) return json({ error: "Focal points must be between 0 and 1." }, 400);
  } else if (resource === "availability") {
    record = { tour_slug: text(body.tour_slug, 160), service_date: text(body.service_date, 10), start_time: text(body.start_time, 8) || null, capacity: body.capacity === "" || body.capacity == null ? null : Number(body.capacity), blocked: Boolean(body.blocked), price_override: body.price_override === "" || body.price_override == null ? null : Number(body.price_override), currency: text(body.currency, 3).toUpperCase() || "USD", notes: text(body.notes, 500) || null };
    if (!record.tour_slug || !/^\d{4}-\d{2}-\d{2}$/.test(String(record.service_date))) return json({ error: "Choose a tour and valid service date." }, 400);
  } else if (resource === "staff") {
    record = { name: text(body.name, 120), staff_type: text(body.staff_type, 20), phone: text(body.phone, 40) || null, languages: text(body.languages, 200).split(",").map((item) => item.trim()).filter(Boolean), active: body.active !== false, notes: text(body.notes, 500) || null };
    if (!record.name || !["guide", "driver", "crew", "operations"].includes(String(record.staff_type))) return json({ error: "Enter a staff name and type." }, 400);
  } else if (resource === "assignments") {
    record = { booking_id: text(body.booking_id, 80), supplier_id: text(body.supplier_id, 80) || null, staff_member_id: text(body.staff_member_id, 80) || null, assignment_type: text(body.assignment_type, 20), pickup_time: body.pickup_time || null, internal_cost: body.internal_cost === "" || body.internal_cost == null ? null : Number(body.internal_cost), currency: text(body.currency, 3).toUpperCase() || "USD", status: text(body.status, 20) || "assigned", notes: text(body.notes, 500) || null };
    if (!record.booking_id || !["supplier", "guide", "driver", "crew"].includes(String(record.assignment_type))) return json({ error: "Enter a booking ID and assignment type." }, 400);
  } else if (resource === "notes") {
    record = { customer_key: text(body.customer_key, 254).toLowerCase(), customer_name: text(body.customer_name, 120) || null, note: text(body.note, 2000), tags: text(body.tags, 300).split(",").map((item) => item.trim()).filter(Boolean), created_by: user!.id };
    if (!record.customer_key || !record.note) return json({ error: "Enter a customer phone/email and note." }, 400);
  } else if (resource === "templates") {
    record = { name: text(body.name, 120), channel: text(body.channel, 20), event_key: text(body.event_key, 80), locale: text(body.locale, 8) || "en", subject: text(body.subject, 200) || null, body: text(body.body, 10_000), active: body.active !== false };
    if (!record.name || !record.event_key || !record.body || !["email", "whatsapp"].includes(String(record.channel))) return json({ error: "Complete the template name, event, channel, and message." }, 400);
  } else if (resource === "queue") {
    record = { booking_id: text(body.booking_id, 80) || null, template_id: text(body.template_id, 80) || null, channel: text(body.channel, 20), recipient: text(body.recipient, 254), scheduled_for: body.scheduled_for || new Date().toISOString(), status: "pending" };
    if (!record.recipient || !["email", "whatsapp"].includes(String(record.channel))) return json({ error: "Enter a recipient and channel." }, 400);
  } else if (resource === "settings") {
    const key = text(body.key, 120).toLowerCase();
    const rawValue: unknown = body.value;
    let value: unknown = rawValue;
    if (typeof rawValue === "string") { try { value = JSON.parse(rawValue); } catch { value = rawValue.trim(); } }
    record = { key, value, category: text(body.category, 80) || "general", public: Boolean(body.public), description: text(body.description, 300) || null, updated_by: user!.id, updated_at: new Date().toISOString() };
    if (!key || value === "") return json({ error: "Enter a setting key and value." }, 400);
  } else {
    record = { source_path: text(body.source_path, 300), destination_path: text(body.destination_path, 500), permanent: body.permanent !== false, active: body.active !== false };
    if (!String(record.source_path).startsWith("/") || !record.destination_path) return json({ error: "Enter a source path beginning with / and a destination." }, 400);
  }
  const table = resources[resource];
  const query = resource === "settings"
    ? supabase.from(table).upsert(record, { onConflict: "key" }).select().single()
    : supabase.from(table).insert(record).select().single();
  const { data, error } = await query;
  if (error) return json({ error: error.code === "23505" ? "A record with this key already exists." : error.message }, 400);
  await supabase.rpc("record_admin_audit", { action_name: "create", resource_name: resource, resource_identifier: String((data as { id?: string; key?: string }).id || (data as { key?: string }).key || ""), summary_text: `Created ${resource} record`, after_value: data });
  return json({ record: data }, 201);
}
