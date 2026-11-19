import { destinations, type DestinationSlug } from "@/lib/destinations";

export type FreeGuidePlace = { title: string; detail: string; mapsQuery: string; note: string };
export type FreeGuide = {
  slug: DestinationSlug;
  areaHint: string;
  essentials: string[];
  freePlaces: FreeGuidePlace[];
  dayPlan: string[];
};

const guides: Record<DestinationSlug, Omit<FreeGuide, "slug">> = {
  hurghada: {
    areaHint: "Choose a starting point: El Dahar, Sakkala / Marina, central Hurghada, or your own hotel.",
    essentials: [
      "Agree taxi prices before setting off, or check the fare in a ride-hailing app where available.",
      "Carry small amounts of local currency for everyday purchases. Compare the total price before paying.",
      "Many hotel beaches are private; ask about entry charges before traveling.",
      "For excursions, always check pickup location, included services and cancellation conditions."
    ],
    freePlaces: [
      { title: "Hurghada Marina promenade", detail: "Enjoy a waterfront walk and marina views.", mapsQuery: "Hurghada Marina Egypt", note: "Walking is generally free; restaurants and boat services are paid. Access rules can change." },
      { title: "El Dahar old market streets", detail: "Browse a traditional neighborhood and local market area.", mapsQuery: "El Dahar Souk Hurghada Egypt", note: "Browsing streets is free; purchases and transport cost extra." }
    ],
    dayPlan: ["Morning: explore a nearby public area or relax at your accommodation.", "Afternoon: discover the local market or waterfront.", "Evening: enjoy a marina walk and check available activities for tomorrow."]
  },
  "marsa-alam": {
    areaHint: "The Marsa Alam region is spread out. Start with your resort area: Marsa Alam, Port Ghalib or Coraya Bay.",
    essentials: [
      "Check travel distances before leaving your resort; many attractions are far apart.",
      "Arrange return transport in advance if visiting areas outside your hotel.",
      "Respect coral reefs and marine wildlife: do not touch, chase or feed animals.",
      "Beach and marina access conditions vary by resort and operator; verify before traveling."
    ],
    freePlaces: [
      { title: "Port Ghalib marina area", detail: "Explore the waterfront atmosphere where public pedestrian access is permitted.", mapsQuery: "Port Ghalib Marina Egypt", note: "Check public access locally; shops, restaurants and activities charge separately." },
      { title: "Your resort's included waterfront", detail: "Enjoy the areas included in your accommodation.", mapsQuery: "Marsa Alam Egypt", note: "Only free if access is already included in your stay; public beaches cannot be assumed." }
    ],
    dayPlan: ["Morning: explore included hotel or resort areas.", "Afternoon: review local transport and nearby marina options.", "Evening: prepare a suitable activity for the next day, allowing for long transfer distances."]
  },
  "el-gouna": {
    areaHint: "Start from Downtown, Abu Tig Marina, or your accommodation's lagoon neighborhood.",
    essentials: [
      "Confirm tuk-tuk, taxi or shuttle prices and payment methods before riding.",
      "Some beaches and lagoon facilities require tickets or hotel access.",
      "Downtown and marina areas are separate; check walking distances in advance.",
      "For excursions, confirm the exact hotel pickup area and any supplement."
    ],
    freePlaces: [
      { title: "El Gouna Downtown", detail: "Walk around the central streets and browse the public shopping areas.", mapsQuery: "El Gouna Downtown Egypt", note: "Walking is generally free; stores, dining and certain facilities are paid." },
      { title: "Abu Tig Marina", detail: "Enjoy yacht views and waterfront surroundings.", mapsQuery: "Abu Tig Marina El Gouna Egypt", note: "Check access rules locally; dining and private facilities cost extra." }
    ],
    dayPlan: ["Morning: wander the Downtown area.", "Afternoon: explore your resort or public walking areas.", "Evening: enjoy the marina atmosphere without needing to book an activity."]
  },
  jeddah: {
    areaHint: "Start with Jeddah Waterfront / Corniche, historic Al-Balad, or your neighborhood.",
    essentials: [
      "Respect local dress customs and public-space rules.",
      "Use published transport services or agree the fare before departure.",
      "Plan outdoor walks around the heat, and carry water.",
      "Opening hours, prayer-time arrangements and entry requirements may vary; verify before visiting."
    ],
    freePlaces: [
      { title: "Jeddah Corniche", detail: "Enjoy public waterfront walks and coastal views.", mapsQuery: "Jeddah Corniche Saudi Arabia", note: "Main public promenades are typically free; parking, facilities and attractions may cost extra." },
      { title: "Historic Al-Balad streets", detail: "Explore public streets and traditional architecture.", mapsQuery: "Al Balad Jeddah Saudi Arabia", note: "Public streets can be explored without a general admission ticket; individual heritage sites may have fees or special hours." }
    ],
    dayPlan: ["Morning: explore Al-Balad's streets when conditions are comfortable.", "Afternoon: take a break from the heat and plan transport.", "Evening: enjoy a public waterfront stroll on the Corniche."]
  }
};

export const liveFreeGuides: FreeGuide[] = destinations
  .filter((destination) => destination.status === "live")
  .flatMap((destination) => {
    const guide = guides[destination.slug];
    return guide ? [{ slug: destination.slug, ...guide }] : [];
  });

export function getFreeGuide(slug: string): FreeGuide | undefined {
  return liveFreeGuides.find((guide) => guide.slug === slug);
}
