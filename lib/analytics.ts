export type AnalyticsEventName =
  | "page_view"
  | "tour_view"
  | "search"
  | "booking_start"
  | "booking_complete"
  | "whatsapp_click"
  | "phone_click"
  | "email_click";

export type AnalyticsEventData = Record<string, string | number | boolean | undefined>;

export type ConsentPreferences = { analytics: boolean; marketing: boolean };

export const consentStorageKey = "daily-red-sea-cookie-consent";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

function consent(): ConsentPreferences | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(window.localStorage.getItem(consentStorageKey) || "null") as ConsentPreferences | null;
  } catch {
    return null;
  }
}

function eventId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function toMetaEvent(event: AnalyticsEventName) {
  if (event === "tour_view") return "ViewContent";
  if (event === "booking_start") return "InitiateCheckout";
  if (event === "booking_complete") return "Lead";
  if (["whatsapp_click", "phone_click", "email_click"].includes(event)) return "Contact";
  return null;
}

function adsLabel(event: AnalyticsEventName) {
  const labels: Partial<Record<AnalyticsEventName, string | undefined>> = {
    booking_complete: process.env.NEXT_PUBLIC_GOOGLE_ADS_BOOKING_CONVERSION_LABEL,
    whatsapp_click: process.env.NEXT_PUBLIC_GOOGLE_ADS_WHATSAPP_CONVERSION_LABEL,
    phone_click: process.env.NEXT_PUBLIC_GOOGLE_ADS_PHONE_CONVERSION_LABEL,
    email_click: process.env.NEXT_PUBLIC_GOOGLE_ADS_EMAIL_CONVERSION_LABEL,
  };
  return labels[event];
}

export function updateGoogleConsent(preferences: ConsentPreferences) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || ((...args: unknown[]) => window.dataLayer?.push(args));
  window.gtag("consent", "update", {
    analytics_storage: preferences.analytics ? "granted" : "denied",
    ad_storage: preferences.marketing ? "granted" : "denied",
    ad_user_data: preferences.marketing ? "granted" : "denied",
    ad_personalization: preferences.marketing ? "granted" : "denied",
  });
}

export function trackEvent(event: AnalyticsEventName, data: AnalyticsEventData = {}) {
  const preferences = consent();
  if (!preferences?.analytics || typeof window === "undefined") return;

  const id = eventId();
  const cleanData = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || ((...args: unknown[]) => window.dataLayer?.push(args));
  window.dataLayer.push(["event", event, { ...cleanData, event_id: id }]);
  window.gtag("event", event, { ...cleanData, event_id: id });

  if (!preferences.marketing) return;

  const metaEvent = toMetaEvent(event);
  if (metaEvent && window.fbq) {
    window.fbq("track", metaEvent, cleanData, { eventID: id });
    void fetch("/api/analytics/meta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, eventId: id, data: cleanData }),
      keepalive: true,
    });
  }

  const googleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID;
  const label = adsLabel(event);
  if (googleAdsId && label) {
    window.gtag("event", "conversion", {
      send_to: `${googleAdsId}/${label}`,
      value: typeof cleanData.value === "number" ? cleanData.value : 1,
      currency: typeof cleanData.currency === "string" ? cleanData.currency : "USD",
      transaction_id: cleanData.transaction_id || id,
    });
  }
}
