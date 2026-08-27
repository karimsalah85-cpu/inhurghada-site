export type FulfillmentType = "meeting_point" | "hotel_pickup" | "optional_pickup" | "transfer_included";
export type AvailabilityStatus = "available" | "limited" | "sold_out" | "unavailable" | "request_confirmation";

export function availabilityStatus(managed: boolean, remaining: number | null, blocked = false): AvailabilityStatus {
  if (!managed) return "request_confirmation";
  if (blocked) return "unavailable";
  if (remaining === 0) return "sold_out";
  if (remaining !== null && remaining <= 3) return "limited";
  return "available";
}

export function isOperatingDate(date: string, operatingWeekdays?: number[]) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  if (!operatingWeekdays?.length) return true;
  return operatingWeekdays.includes(new Date(`${date}T12:00:00Z`).getUTCDay());
}

export function nextOperatingDate(minimumDate: string, operatingWeekdays?: number[]) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(minimumDate)) throw new Error("Invalid minimum date");
  const candidate = new Date(`${minimumDate}T12:00:00Z`);
  for (let offset = 0; offset < 14; offset += 1) {
    const date = candidate.toISOString().slice(0, 10);
    if (isOperatingDate(date, operatingWeekdays)) return date;
    candidate.setUTCDate(candidate.getUTCDate() + 1);
  }
  throw new Error("No operating date found in the next 14 days");
}

export function nextDepartures(minimumDate: string, operatingWeekdays?: number[], count = 3) {
  const dates: string[] = [];
  let cursor = minimumDate;
  while (dates.length < count) {
    const date = nextOperatingDate(cursor, operatingWeekdays);
    dates.push(date);
    const next = new Date(`${date}T12:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    cursor = next.toISOString().slice(0, 10);
  }
  return dates;
}
