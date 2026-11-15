/** A partner's role on one trip, next to the trip's main partner. */
export const PARTNER_ROLES = ["boat", "guide", "driver", "hotel", "transfer", "company", "other"] as const;
export type PartnerRole = (typeof PARTNER_ROLES)[number];
export const partnerRoleLabels: Record<PartnerRole, string> = {
  boat: "Boat", guide: "Guide", driver: "Driver", hotel: "Hotel", transfer: "Transfer", company: "Company", other: "Other",
};

/** Roles a supplier can have in a trip's setup: one main partner (the trip provider) plus extra partners. */
export const TRIP_PARTNER_ROLES = ["main", ...PARTNER_ROLES] as const;
export type TripPartnerRole = (typeof TRIP_PARTNER_ROLES)[number];
export const tripPartnerRoleLabels: Record<TripPartnerRole, string> = { main: "Main (trip provider)", ...partnerRoleLabels };
