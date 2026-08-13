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
    image: "/images/hero-egypt-red-sea.jpg",
  },
  {
    slug: "marsa-alam",
    name: "Marsa Alam",
    country: "Egypt",
    tagline: "Untouched reefs, desert landscapes, and southern Red Sea adventures",
    active: true,
    image: "/images/owned/red-sea-reef-panorama.jpg",
  },
];

export const defaultDestination = destinations[0];

export function getDestination(slug?: string) {
  return destinations.find((destination) => destination.slug === (slug || defaultDestination.slug));
}
