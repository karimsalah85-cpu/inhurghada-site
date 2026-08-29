/**
 * Picks the communication template matching a booking's own locale, falling back
 * to English when that locale has no template for the event/channel. Keeping this
 * pure and dependency-free so the automation's routing is unit-testable.
 */
export function pickTemplate<T extends { event_key: string; channel: string; locale: string }>(
  templates: T[],
  eventKey: string,
  channel: string,
  locale: string,
): T | undefined {
  const forEvent = templates.filter((item) => item.event_key === eventKey && item.channel === channel);
  return forEvent.find((item) => item.locale === locale) ?? forEvent.find((item) => item.locale === "en");
}
