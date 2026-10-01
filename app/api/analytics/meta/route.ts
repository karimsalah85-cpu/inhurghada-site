import { NextRequest, NextResponse } from "next/server";

import { toMetaEvent } from "@/lib/meta-events";

type MetaErrorBody = { error?: { message?: unknown; type?: unknown; code?: unknown; error_subcode?: unknown; fbtrace_id?: unknown } };

// Log only Meta's diagnostic fields: never the event payload (IP, user agent, click ids) or the access token.
async function metaErrorSummary(response: Response, accessToken: string) {
  const text = await response.text().catch(() => "");
  const redact = (value: unknown) => (typeof value === "string" ? value.split(accessToken).join("[redacted]").slice(0, 500) : value);
  let parsed: MetaErrorBody = {};
  try {
    parsed = JSON.parse(text) as MetaErrorBody;
  } catch {
    // Non-JSON error body; fall through to a truncated text summary.
  }
  const error = parsed.error;
  if (!error) return { message: redact(text.slice(0, 200)) || undefined };
  return { message: redact(error.message), type: redact(error.type), code: error.code, subcode: error.error_subcode, fbtraceId: redact(error.fbtrace_id) };
}

export async function POST(request: NextRequest) {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const accessToken = process.env.META_CONVERSIONS_API_ACCESS_TOKEN;
  const apiVersion = process.env.META_GRAPH_API_VERSION;
  if (!pixelId || !accessToken || !apiVersion) return new NextResponse(null, { status: 204 });

  try {
    const origin = request.headers.get("origin");
    if (origin && new URL(origin).host !== request.nextUrl.host) {
      return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
    }
    const body = await request.json();
    const eventName = toMetaEvent(String(body.event), body.data && typeof body.data === "object" ? body.data : {});
    if (!eventName || typeof body.eventId !== "string") return NextResponse.json({ error: "Unsupported event." }, { status: 400 });
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const source = body.data && typeof body.data === "object" ? body.data as Record<string, unknown> : {};
    const eventTime = Math.floor(Date.now() / 1000);
    const fbclid = typeof source.fbclid === "string" ? source.fbclid.trim() : "";
    const fbc = request.cookies.get("_fbc")?.value || (fbclid ? `fb.1.${eventTime * 1000}.${fbclid}` : undefined);
    const customData = Object.fromEntries(Object.entries(source).filter(([key, value]) => ["item_name", "value", "currency", "booking_type", "placement", "transaction_id", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].includes(key) && ["string", "number", "boolean"].includes(typeof value)));
    const response = await fetch(`https://graph.facebook.com/${apiVersion}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [{ event_name: eventName, event_time: eventTime, event_id: body.eventId, event_source_url: request.headers.get("referer") || "https://dailyredsea.com", action_source: "website", user_data: { client_ip_address: forwarded, client_user_agent: request.headers.get("user-agent") || undefined, fbp: request.cookies.get("_fbp")?.value, fbc }, custom_data: customData }] }),
    });
    if (!response.ok) {
      console.error("Meta Conversions API rejected event", { status: response.status, event: eventName, error: await metaErrorSummary(response, accessToken) });
      return new NextResponse(null, { status: 502 });
    }
  } catch (error) {
    console.error("Meta Conversions API event failed", error);
  }
  return new NextResponse(null, { status: 204 });
}
