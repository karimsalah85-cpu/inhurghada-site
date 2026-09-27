const CLOCK_TIME = /^\d{1,2}:\d{2}$/;

/**
 * Returns the tour's selectable start times when it has more than one fixed
 * clock time (for example ["07:00", "08:00", "09:00"]). Tours with a single
 * time or descriptive times such as "Morning pickup confirmed by WhatsApp"
 * return an empty list, so callers keep their existing single-value display.
 */
export function startTimeChoices(availableTimes?: string[]): string[] {
  const times = (availableTimes ?? []).map((time) => time.trim()).filter(Boolean);
  if (times.length < 2 || times.length > 6) return [];
  return times.every((time) => CLOCK_TIME.test(time)) ? times : [];
}
