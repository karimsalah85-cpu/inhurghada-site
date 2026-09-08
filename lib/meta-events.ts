/** Shared by the browser pixel and Conversions API so deduplication uses the same event name. */
export function toMetaEvent(event: string, data: Record<string, unknown> = {}) {
  if (event === "tour_view") return "ViewContent";
  // booking_start also fires on navigation. Only validated transfer submissions
  // retain the legacy mapping; tours emit checkout_started at checkout entry.
  if (event === "checkout_started" || (event === "booking_start" && data.booking_type === "transfer")) return "InitiateCheckout";
  if (event === "booking_complete") return "Lead";
  if (["whatsapp_click", "phone_click", "email_click"].includes(event)) return "Contact";
  return null;
}
