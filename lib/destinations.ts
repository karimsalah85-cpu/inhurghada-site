export type Destination = {
  slug: string;
  name: string;
  country: string;
  tagline: string;
  active: boolean;
  comingSoon?: boolean;
  image: string;
};

export const destinations: Destination[] = [
  {
    slug: "hurghada",
    name: "Hurghada",
    country: "Egypt",
    tagline: "Red Sea tours, transfers, and local experiences",
    active: true,
    image: "/images/placeholders/sea-activity.svg",
  },
  {
    slug: "marsa-alam",
    name: "Marsa Alam",
    country: "Egypt",
    tagline: "Untouched reefs, desert landscapes, and southern Red Sea adventures",
    active: false,
    comingSoon: true,
    image: "/images/placeholders/island-trip.svg",
  },
];

export const defaultDestination = destinations[0];

export function getDestination(slug?: string) {
  return destinations.find((destination) => destination.slug === (slug || defaultDestination.slug));
}
