export const CANCELLATION_POLICY_TEXT =
  "Cancel at least 48 hours before the scheduled trip or pickup time for a full refund, or no charge for cash-on-arrival bookings. Cancellations made within 48 hours are non-refundable. To cancel, contact Daily Red Sea on WhatsApp and include your booking reference; cancellation is effective when confirmed in writing.\n\nArrival more than 15 minutes after the confirmed meeting time is treated as a no-show, with no refund, credit, or reschedule. Group departures cannot be delayed for late guests.\n\nIf Daily Red Sea or the local operator cancels because of weather, sea conditions, safety, or operational reasons, you may choose a full refund or an available replacement date. Routes, itineraries, and dive sites may change when conditions require it, and the trip leader makes the final safety decision.\n\nGuests must follow all instructions from instructors and crew, confirm that they are medically fit, disclose relevant medical conditions or allergies before departure, and ensure that no travel ban or legal restriction prevents participation. Activities, especially diving, involve inherent personal risk. To the extent permitted by law, Daily Red Sea and the operator are not responsible for injury caused by a guest's negligence, failure to follow instructions, or misuse of equipment.\n\nFor diving activities, participants must sign the required liability waiver. Certified-diver activities require a valid diving certification. Air tanks and weights are included for certified divers; personal equipment such as a BCD, regulator, wetsuit, mask, and fins is not included and may be rented on request. Guests are responsible for loss of or damage to rented equipment. Nothing in this policy excludes liability that cannot legally be excluded.";

export function getCancellationPolicyParagraphs(): string[] {
  const configuredPolicy =
    process.env.CANCELLATION_POLICY_TEXT?.replace(/\\n/g, "\n").trim() ||
    CANCELLATION_POLICY_TEXT;

  return configuredPolicy
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}
