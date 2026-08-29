import "server-only";

import { sendBookingEmail, sendWhatsAppMessage } from "@/lib/booking-service";
import { createRequiredAdminClient } from "@/utils/supabase/admin";
import { getGoogleAdsReport, googleAdsConfiguration } from "@/lib/google-ads";

type Template = { id: string; event_key: string; channel: "email" | "whatsapp"; subject: string | null; body: string };
type Booking = { id: string; reference: string; customer_name: string; customer_email: string | null; phone: string; tour_name: string | null; date: string | null; hotel: string | null };
type QueueItem = { id: string; recipient: string; channel: "email" | "whatsapp"; attempts: number; template_id: string | null; booking_id: string | null };

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]!);
const dateOnly = (date: Date) => date.toISOString().slice(0, 10);

function render(value: string, booking: Booking) {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://dailyredsea.com";
  const reviewUrl = booking.customer_email
    ? `${site}/reviews?ref=${encodeURIComponent(booking.reference)}&email=${encodeURIComponent(booking.customer_email)}`
    : `${site}/reviews`;
  const replacements: Record<string, string> = {
    customer_name: booking.customer_name,
    booking_reference: booking.reference,
    tour_name: booking.tour_name || "your Daily Red Sea trip",
    date: booking.date || "",
    hotel: booking.hotel || "",
    review_url: reviewUrl,
  };
  return value.replace(/{{\s*([a-z_]+)\s*}}/g, (_, key: string) => replacements[key] ?? "");
}

async function addHealthChecks(supabase: ReturnType<typeof createRequiredAdminClient>) {
  const emailReady = Boolean(process.env.GMAIL_SMTP_APP_PASSWORD || process.env.RESEND_API_KEY);
  const analyticsReady = Boolean(process.env.GOOGLE_ADS_DEVELOPER_TOKEN && process.env.GOOGLE_ADS_CUSTOMER_ID);
  await supabase.from("system_health_checks").insert([
    { check_type: "database", status: "ok", summary: "Automated server database access succeeded." },
    { check_type: "email", status: emailReady ? "ok" : "warning", summary: emailReady ? "Email delivery is configured." : "Email delivery credentials are missing." },
    { check_type: "analytics", status: analyticsReady ? "ok" : "warning", summary: analyticsReady ? "Google Ads credentials are configured." : "Google Ads credentials are incomplete." },
    { check_type: "backup", status: "warning", summary: "Database access is healthy; verify managed backups in Supabase." },
  ]);
}

async function checkManagedBackups(supabase: ReturnType<typeof createRequiredAdminClient>) {
  const token=process.env.SUPABASE_ACCESS_TOKEN;const projectRef=process.env.SUPABASE_PROJECT_REF||process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if(!token||!projectRef){await supabase.from("backup_checks").insert({status:"warning",summary:"Add SUPABASE_ACCESS_TOKEN to verify managed backups automatically."});return;}
  try{const response=await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/backups`,{headers:{Authorization:`Bearer ${token}`},cache:"no-store"});const payload=await response.json() as {backups?:Array<{status?:string;inserted_at?:string}>};const completed=payload.backups?.filter(item=>item.status==="COMPLETED").sort((a,b)=>String(b.inserted_at).localeCompare(String(a.inserted_at)))[0];await supabase.from("backup_checks").insert({status:response.ok&&completed?"ok":"failed",backup_created_at:completed?.inserted_at||null,summary:completed?`Latest managed backup completed at ${completed.inserted_at}.`:"No completed managed backup was returned.",details:payload});}catch(error){await supabase.from("backup_checks").insert({status:"failed",summary:"Managed backup verification failed.",details:{error:error instanceof Error?error.message:"unknown"}});}
}

export async function runAdminAutomation() {
  const supabase = createRequiredAdminClient();
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const yesterday = new Date(now);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  const { data: published, error: publishError } = await supabase
    .from("content_items")
    .update({ status: "published", published_at: now.toISOString(), updated_at: now.toISOString() })
    .eq("status", "scheduled")
    .lte("publish_at", now.toISOString())
    .select("id");
  if (publishError) throw publishError;

  const { error: seedError } = await supabase.from("communication_templates").upsert([
    { name: "Pickup reminder email", channel: "email", event_key: "pickup_reminder", locale: "en", subject: "Your pickup tomorrow — {{booking_reference}}", body: "Hello {{customer_name}},\n\nYour {{tour_name}} is tomorrow ({{date}}). We will confirm the pickup time for {{hotel}} by WhatsApp.\n\nDaily Red Sea" },
    { name: "Pickup reminder WhatsApp", channel: "whatsapp", event_key: "pickup_reminder", locale: "en", subject: null, body: "Hello {{customer_name}}! A reminder that {{tour_name}} is tomorrow ({{date}}). We will confirm your pickup at {{hotel}}. Reference: {{booking_reference}}." },
    { name: "Review request email", channel: "email", event_key: "review_request", locale: "en", subject: "How was your Daily Red Sea trip?", body: "Hello {{customer_name}},\n\nWe hope you enjoyed {{tour_name}}. Please share your experience: {{review_url}}\n\nThank you,\nDaily Red Sea" },
    { name: "Review request WhatsApp", channel: "whatsapp", event_key: "review_request", locale: "en", subject: null, body: "Hello {{customer_name}}! We hope you enjoyed {{tour_name}}. We would love your feedback: {{review_url}}" },
  ], { onConflict: "event_key,channel,locale", ignoreDuplicates: true });
  if (seedError) throw seedError;

  const [{ data: templates, error: templateError }, { data: pickupBookings, error: pickupError }, { data: reviewBookings, error: reviewError }] = await Promise.all([
    supabase.from("communication_templates").select("id,event_key,channel,subject,body").eq("active", true).in("event_key", ["pickup_reminder", "review_request"]),
    supabase.from("bookings").select("id,reference,customer_name,customer_email,phone,tour_name,date,hotel").eq("status", "confirmed").eq("date", dateOnly(tomorrow)),
    supabase.from("bookings").select("id,reference,customer_name,customer_email,phone,tour_name,date,hotel").eq("status", "completed").eq("date", dateOnly(yesterday)),
  ]);
  if (templateError || pickupError || reviewError) throw templateError || pickupError || reviewError;

  const typedTemplates = (templates || []) as Template[];
  const queueRows: Array<Record<string, unknown>> = [];
  for (const [eventKey, bookings] of [["pickup_reminder", pickupBookings || []], ["review_request", reviewBookings || []]] as const) {
    for (const template of typedTemplates.filter((item) => item.event_key === eventKey)) {
      for (const booking of bookings as Booking[]) {
        const recipient = template.channel === "email" ? booking.customer_email : booking.phone;
        if (recipient) queueRows.push({ booking_id: booking.id, template_id: template.id, channel: template.channel, recipient, scheduled_for: now.toISOString() });
      }
    }
  }
  if (queueRows.length) {
    const bookingIds = [...new Set(queueRows.map((row) => String(row.booking_id)))];
    const templateIds = [...new Set(queueRows.map((row) => String(row.template_id)))];
    const { data: existing, error: existingError } = await supabase.from("communication_queue").select("booking_id,template_id").in("booking_id", bookingIds).in("template_id", templateIds);
    if (existingError) throw existingError;
    const existingKeys = new Set((existing || []).map((row) => `${row.booking_id}:${row.template_id}`));
    const newRows = queueRows.filter((row) => !existingKeys.has(`${row.booking_id}:${row.template_id}`));
    const { error } = newRows.length ? await supabase.from("communication_queue").insert(newRows) : { error: null };
    if (error) throw error;
  }

  const { data: pending, error: queueError } = await supabase.from("communication_queue").select("id,recipient,channel,attempts,template_id,booking_id").eq("status", "pending").lte("scheduled_for", now.toISOString()).order("scheduled_for").limit(25);
  if (queueError) throw queueError;

  let sent = 0;
  let failed = 0;
  for (const item of (pending || []) as QueueItem[]) {
    const template = typedTemplates.find((entry) => entry.id === item.template_id);
    const booking = [...((pickupBookings || []) as Booking[]), ...((reviewBookings || []) as Booking[])].find((entry) => entry.id === item.booking_id);
    if (!template || !booking) continue;
    await supabase.from("communication_queue").update({ status: "processing", attempts: item.attempts + 1 }).eq("id", item.id).eq("status", "pending");
    const body = render(template.body, booking);
    const result = template.channel === "email"
      ? await sendBookingEmail(item.recipient, render(template.subject || "Daily Red Sea booking update", booking), `<p>${escapeHtml(body).replace(/\n/g, "<br>")}</p>`)
      : await sendWhatsAppMessage(item.recipient, body);
    const success = result.success;
    await supabase.from("communication_queue").update({ status: success ? "sent" : "failed", sent_at: success ? new Date().toISOString() : null, last_error: success ? null : String("reason" in result ? result.reason : "delivery-failed") }).eq("id", item.id);
    await supabase.from("communication_messages").insert({ booking_id: booking.id, customer_key: booking.customer_email || booking.phone, channel: template.channel, direction: "outbound", recipient: item.recipient, sender: template.channel === "email" ? "info@dailyredsea.com" : process.env.TWILIO_WHATSAPP_FROM || "Daily Red Sea", subject: template.subject ? render(template.subject, booking) : null, body, delivery_status: success ? "sent" : "failed", metadata: { queue_id: item.id } });
    if (success) sent++;
    else failed++;
  }

  let googleAdsSpendImported = 0;
  if (googleAdsConfiguration().configured) {
    try {
      const reportDate = dateOnly(yesterday);
      const report = await getGoogleAdsReport(reportDate, reportDate);
      if (report.totals.cost > 0) {
        const { error } = await supabase.from("expenses").upsert({ description: `Google Ads spend ${reportDate}`, amount: report.totals.cost, currency: report.currency, expense_date: reportDate, category: "Google Ads API", expense_type: "google_ads", external_reference: `google-ads:${report.customerId}:${reportDate}` }, { onConflict: "external_reference", ignoreDuplicates: true });
        if (error) throw error;
        googleAdsSpendImported = report.totals.cost;
      }
    } catch (error) { console.error("Google Ads expense import failed", error); }
  }

  await addHealthChecks(supabase);
  await checkManagedBackups(supabase);
  return { published: published?.length || 0, considered: queueRows.length, sent, failed, googleAdsSpendImported };
}
