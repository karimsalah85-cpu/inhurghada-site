export type DestinationSlug = "hurghada" | "marsa-alam";
export type DestinationStatus = "live" | "coming-soon";

export type PickupZone = {
  name: string;
  supplement: number;
  currency: "USD" | "EUR";
};

export type Destination = {
  slug: DestinationSlug;
  name: string;
  country: string;
  region: string;
  status: DestinationStatus;
  tagline: string;
  shortDescription: string;
  longDescription: string;
  coordinates: { latitude: number; longitude: number };
  defaultCurrency: "USD" | "EUR";
  image: string;
  seo: { title: string; description: string; ogImage: string };
  pickupZones: PickupZone[];
};

export const destinations: Destination[] = [
  {
    slug: "hurghada",
    name: "Hurghada",
    country: "Egypt",
    region: "Red Sea Governorate",
    status: "live",
    tagline: "Red Sea tours, transfers, and local experiences",
    shortDescription: "Island trips, snorkeling, diving, desert adventures, historical day trips and private transfers from Hurghada.",
    longDescription: "Explore Hurghada with clear local prices, practical pickup information and direct booking support from Daily Red Sea.",
    coordinates: { latitude: 27.2579, longitude: 33.8116 },
    defaultCurrency: "USD",
    image: "/images/hero-egypt-red-sea.jpg",
    seo: {
      title: "Things to do in Hurghada",
      description: "Explore Hurghada tours, island trips, snorkeling, diving, desert safaris, historical excursions and private transfers with clear prices and local support.",
      ogImage: "/images/hero-egypt-red-sea.jpg",
    },
    pickupZones: [
      { name: "Hurghada hotels", supplement: 0, currency: "USD" },
    ],
  },
  {
    slug: "marsa-alam",
    name: "Marsa Alam",
    country: "Egypt",
    region: "Red Sea Governorate",
    status: "live",
    tagline: "Untouched reefs, desert landscapes, and southern Red Sea adventures",
    shortDescription: "Snorkeling trips from Marsa Alam, Port Ghalib and Coraya Bay with destination-specific schedules and pickup details.",
    longDescription: "Discover Marsa Alam's southern Red Sea reefs on locally verified trips with clear EUR pricing and included pickup from the confirmed hotel zones.",
    coordinates: { latitude: 25.0676, longitude: 34.8790 },
    defaultCurrency: "EUR",
    image: "/images/owned/red-sea-reef-panorama.jpg",
    seo: {
      title: "Things to do in Marsa Alam",
      description: "Book Marsa Alam snorkeling trips to Dolphin House, Marsa Mubarak and Abu Dabbab with clear EUR prices, included hotel pickup and local support.",
      ogImage: "/images/owned/red-sea-reef-panorama.jpg",
    },
    pickupZones: [
      { name: "Marsa Alam hotels", supplement: 0, currency: "EUR" },
      { name: "Port Ghalib", supplement: 0, currency: "EUR" },
      { name: "Coraya Bay", supplement: 0, currency: "EUR" },
    ],
  },
];

export const defaultDestination = destinations[0];

export function getDestination(slug?: string) {
  return destinations.find((destination) => destination.slug === (slug || defaultDestination.slug));
}

export function isLiveDestination(destination: Destination) {
  return destination.status === "live";
}
