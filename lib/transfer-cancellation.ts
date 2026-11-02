import { cairoDateTimeParts } from "@/lib/booking-validation";

/** Hours before pickup that a transfer can be cancelled free. Must match the published policy in lib/pdf-policy.ts. */
export const TRANSFER_FREE_CANCELLATION_HOURS = 48;

/**
 * Last free-cancellation moment for a pickup, as Africa/Cairo wall-clock values.
 * `eligible` is false when that moment has already passed.
 */
export function transferCancellationDeadline(date: string, time: string, now = new Date()) {
  const pickup = new Date(`${date}T${time}:00Z`);
  if (Number.isNaN(pickup.getTime())) return { eligible: false, date: "", time: "" };
  const deadline = new Date(pickup.getTime() - TRANSFER_FREE_CANCELLATION_HOURS * 60 * 60 * 1000).toISOString();
  const deadlineDate = deadline.slice(0, 10);
  const deadlineTime = deadline.slice(11, 16);
  const cairo = cairoDateTimeParts(now);
  return { eligible: `${cairo.date}T${cairo.time}` <= `${deadlineDate}T${deadlineTime}`, date: deadlineDate, time: deadlineTime };
}
