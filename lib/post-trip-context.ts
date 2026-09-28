import type { Tour } from "@/data/tours";
import { destinations, type DestinationSlug } from "@/lib/destinations";
import { bookingLocale } from "@/lib/booking-communications-i18n";
import { localePath } from "@/lib/i18n";
import { localizeTour } from "@/lib/tour-localization";

const site = "https://dailyredsea.com";
const destinationNames: Partial<Record<string, Record<DestinationSlug, string>>> = {
  ar: { hurghada: "الغردقة", "marsa-alam": "مرسى علم", "el-gouna": "الجونة", jeddah: "جدة" },
  ru: { hurghada: "Хургада", "marsa-alam": "Марса-Алам", "el-gouna": "Эль-Гуна", jeddah: "Джидда" },
  zh: { hurghada: "赫尔格达", "marsa-alam": "马萨阿拉姆", "el-gouna": "艾尔古纳", jeddah: "吉达" },
};
function tripTheme(tour: Tour): "sea" | "desert" | "culture" {
  const category = `${tour.category || ""} ${tour.slug}`.toLowerCase();
  if (/desert|safari|quad|stargazing/.test(category)) return "desert";
  if (/cultural|city|cairo|luxor|al-balad/.test(category)) return "culture";
  return "sea";
}
export function selectPostTripContext(catalog: Tour[], input: { tour_slug?: string | null; tour_name?: string | null; locale?: string | null }) {
  const locale = bookingLocale(input.locale);
  const trip = input.tour_slug ? catalog.find(t => t.slug === input.tour_slug) : catalog.find(t => t.title === input.tour_name);
  // Never guess a destination for a legacy/custom booking.
  if (!trip) return undefined;
  const destination = destinations.find(d => d.slug === trip.destinationSlug);
  if (!destination) return undefined;
  // localizeTour applies the media-safety overrides, so this is the same hero the trip page shows.
  const card = (tour: Tour) => { const localized = localizeTour(tour, locale); return { title: localized.title, image: new URL(localized.image, site).toString(), url: new URL(localePath(locale, `/tours/${tour.slug}`), site).toString() }; };
  const candidates = catalog.filter(t => t.slug !== trip.slug && t.destinationSlug === trip.destinationSlug && (!t.listingStatus || t.listingStatus === "active") && !t.bookingBlocker)
    .sort((a, b) => Number(b.category === trip.category) - Number(a.category === trip.category));
  const first = candidates.find(t => t.image !== trip.image) || candidates[0];
  const second = candidates.find(t => t.slug !== first?.slug && t.image !== first?.image && t.image !== trip.image && t.category !== first?.category)
    || candidates.find(t => t.slug !== first?.slug && t.image !== first?.image)
    || candidates.find(t => t.slug !== first?.slug);
  const related = [first, second].filter((t): t is Tour => Boolean(t)).map(card);
  return { ...card(trip), destination: destinationNames[locale]?.[destination.slug] || destination.name, theme: tripTheme(trip), related };
}

export async function getPostTripContext(input: { tour_slug?: string | null; tour_name?: string | null; locale?: string | null }) {
  try {
    const { getLiveTours, getUnavailableTrip } = await import("@/lib/live-content");
    const context = selectPostTripContext(await getLiveTours(bookingLocale(input.locale)), input);
    if (!context) return undefined;
    try {
      // The public catalog falls back to local data on outages. Recheck suggested
      // products so a CMS-paused trip is never promoted from that fallback.
      const available = await Promise.all(context.related.map(async card => {
        const slug = new URL(card.url).pathname.split("/").pop()!;
        return await getUnavailableTrip([slug]) ? null : card;
      }));
      return { ...context, related: available.filter((card): card is NonNullable<typeof card> => card !== null) };
    } catch {
      return { ...context, related: [] };
    }
  } catch {
    // A catalog outage must not prevent the thank-you/review invitation.
    return undefined;
  }
}
