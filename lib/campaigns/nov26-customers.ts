import { escapeHtml } from "@/lib/email/layout";
import { nov26Html } from "@/lib/campaigns/nov26-customers-html";

export const NOV26_CAMPAIGN = "nov26_customers";
export type Nov26Variant = keyof typeof nov26Html;
export type CampaignBooking = {
  id: string; customer_name: string | null; customer_email: string | null; tour_name: string | null;
  tour_slug: string | null; cancellation_note: string | null; archived_at: string | null; created_at: string;
};
export type Nov26Recipient = { email: string; firstName: string; variant: Nov26Variant; bookingId: string };

export const nov26Subjects: Record<Nov26Variant, string> = {
  egypt: "Orange Bay, Luxor or the desert? Your next day in Egypt",
  egyptApology: "Orange Bay, Luxor or the desert? Your next day in Egypt",
  jeddah: "Sunset cruise or reef day? Your next trip in Jeddah",
};

const blocked = new Set(["info@dailyredsea.com"]);
const firstName = (name: string | null) => {
  const first = (name || "").trim().split(/\s+/)[0] || "";
  return first ? first[0].toUpperCase() + first.slice(1) : "there";
};
const isJeddah = (booking: CampaignBooking) => /jeddah/i.test(`${booking.tour_slug ?? ""} ${booking.tour_name ?? ""}`);
const noCapacityMahmya = (booking: CampaignBooking) => booking.tour_slug === "mahmya-island" && /no capacity/i.test(booking.cancellation_note ?? "");

/** One recipient per email, from real bookings only: archived and email-less rows are ignored. The newest booking decides the region. */
export function buildNov26Audience(bookings: CampaignBooking[]): Nov26Recipient[] {
  const byEmail = new Map<string, CampaignBooking[]>();
  for (const booking of bookings) {
    const email = booking.customer_email?.trim().toLowerCase();
    if (!email || booking.archived_at || blocked.has(email)) continue;
    byEmail.set(email, [...(byEmail.get(email) ?? []), booking]);
  }
  return [...byEmail.entries()].map(([email, rows]) => {
    const latest = [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    const variant: Nov26Variant = isJeddah(latest) ? "jeddah" : rows.some(noCapacityMahmya) ? "egyptApology" : "egypt";
    return { email, firstName: firstName(latest.customer_name), variant, bookingId: latest.id };
  }).sort((a, b) => a.email.localeCompare(b.email));
}

export const renderNov26 = (variant: Nov26Variant, name: string) => nov26Html[variant].replace("{{first_name}}", escapeHtml(name));
