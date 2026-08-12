export type TourSchedule = {
  operatingWeekdays: number[];
  bookingCutoff?: { daysBefore: number; localTime: string; timeZone: "Africa/Cairo"; assumption?: boolean };
};

export const marsaAlamTourSchedules = {
  "dolphin-house-marsa-alam": { operatingWeekdays: [1, 5], bookingCutoff: { daysBefore: 1, localTime: "18:00", timeZone: "Africa/Cairo", assumption: true } },
  "marsa-mubarak-snorkeling": { operatingWeekdays: [0, 2, 3, 4, 6] },
  "abu-dabbab-snorkeling": { operatingWeekdays: [1, 3, 5], bookingCutoff: { daysBefore: 1, localTime: "18:00", timeZone: "Africa/Cairo", assumption: true } },
} as const satisfies Record<string, TourSchedule>;

export type MarsaAlamTourSlug = keyof typeof marsaAlamTourSchedules;

export function isMarsaAlamTourSlug(value: string): value is MarsaAlamTourSlug {
  return Object.prototype.hasOwnProperty.call(marsaAlamTourSchedules, value);
}
