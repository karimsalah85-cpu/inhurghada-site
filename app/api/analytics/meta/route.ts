import { NextRequest, NextResponse } from "next/server";

const metaEvents: Record<string, string> = { tour_view: "ViewContent", booking_start: "InitiateCheckout", booking_complete: "Lead", whatsapp_click: "Contact", phone_click: "Contact", email_click: "Contact" };

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
    const eventName = metaEvents[String(body.event)];
    if (!eventName || typeof body.eventId !== "string") return NextResponse.json({ error: "Unsupported event." }, { status: 400 });
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const source = body.data && typeof body.data === "object" ? body.data as Record<string, unknown> : {};
    const customData = Object.fromEntries(Object.entries(source).filter(([key, value]) => ["item_name", "value", "currency", "booking_type", "placement", "transaction_id"].includes(key) && ["string", "number", "boolean"].includes(typeof value)));
    const response = await fetch(`https://graph.facebook.com/${apiVersion}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [{ event_name: eventName, event_time: Math.floor(Date.now() / 1000), event_id: body.eventId, event_source_url: request.headers.get("referer") || "https://dailyredsea.com", action_source: "website", user_data: { client_ip_address: forwarded, client_user_agent: request.headers.get("user-agent") || undefined, fbp: request.cookies.get("_fbp")?.value, fbc: request.cookies.get("_fbc")?.value }, custom_data: customData }] }),
    });
    if (!response.ok) console.error("Meta Conversions API request failed", response.status);
  } catch (error) {
    console.error("Meta Conversions API event failed", error);
  }
  return new NextResponse(null, { status: 204 });
}
