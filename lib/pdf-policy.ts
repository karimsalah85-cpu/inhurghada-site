export const CANCELLATION_POLICY_TEXT =
  "The cancellation terms shown on your activity page apply to this booking. Unless that page states a different window, cancel at least 24 hours before the scheduled pickup time for a full refund, or no charge for cash-on-arrival bookings.\n\nCancellations within the applicable notice period, late arrivals, and no-shows are non-refundable because local suppliers reserve capacity and incur costs. Private tours, limited-capacity boats, and third-party experiences may require longer notice or may be non-refundable when clearly stated before booking.\n\nIf Daily Red Sea or the local supplier cancels because of weather, safety, insufficient participation, or operational reasons, you may choose a full refund or an available alternative date or activity.\n\nTo cancel or request a change, contact Daily Red Sea on WhatsApp as early as possible and include your booking reference. Approved card or online-payment refunds are returned to the original payment method; cash-on-arrival bookings are not charged.";

export function getCancellationPolicyParagraphs(): string[] {
  const configuredPolicy =
    process.env.CANCELLATION_POLICY_TEXT?.replace(/\\n/g, "\n").trim() ||
    CANCELLATION_POLICY_TEXT;

  return configuredPolicy
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}
