export type Destination = {
  slug: string;
  name: string;
  country: string;
  tagline: string;
  active: boolean;
};

export const destinations: Destination[] = [
  {
    slug: "hurghada",
    name: "Hurghada",
    country: "Egypt",
    tagline: "Red Sea tours, transfers, and local experiences",
    active: true,
  },
];

export const defaultDestination = destinations[0];

export function getDestination(slug?: string) {
  return destinations.find((destination) => destination.slug === (slug || defaultDestination.slug));
}
