export type Tour = {
  slug: string;
  title: string;
  image: string;
  price: string;
  rating: string;
  reviews?: string;
  location: string;
  duration: string;
  description: string;
  highlights: string[];
  included?: string[];
  notIncluded?: string[];
  notes?: string[];
  packageName?: string;
  packageDescription?: string;
  packagePrice?: string;
  packageLabel?: string;
  itinerary?: string[];
};



export const tours: Tour[] = [

  {
    slug: "orange-bay",

    title: "Orange Bay Island Snorkeling Boat Trip",

    image: "/images/orange-bay.jpeg",

    price: "25",

    rating: "5.0",
    reviews: "30",

    location: "Hurghada, Egypt",

    duration: "8 Hours",

    description:
      "Escape to the Red Sea with a full-day Orange Bay boat trip from Hurghada. Cruise on a comfortable yacht, snorkel in vibrant coral gardens, enjoy lunch onboard, and relax on the pristine beaches of Orange Bay Island.",

    highlights: [
      "Relax on the beautiful Orange Bay Island",
      "Sail the Red Sea on a luxury yacht",
      "Swim in crystal-clear turquoise waters",
      "Snorkel among colorful marine life",
      "Enjoy two amazing snorkeling stops",
      "Experience a tropical island escape",
      "Take in panoramic views and beach time on the island",
      "Enjoy a laid-back day with lunch and drinks onboard",
    ],
    included: [
      "Hotel pickup & drop-off",
      "Luxury yacht cruise",
      "Orange Bay Island visit",
      "Two snorkeling stops",
      "Snorkeling equipment",
      "Lunch onboard",
      "Soft drinks and beverages",
      "Professional crew assistance",
      "Life jackets and safety equipment",
    ],
    notIncluded: [
      "Underwater photos & videos",
      "Beach towels",
      "Swimwear",
      "Sunscreen",
    ],
    notes: [
      "Provide a valid phone number and email for easy contact.",
      "Pickup time will be confirmed via WhatsApp after your booking request is received.",
      "Bring your passport or a copy as it may be required at the port.",
      "Bring swimwear, towels, and sunscreen for comfort.",
      "Wear beach shoes and a light cover-up for sun protection.",
      "The tour is ideal for families, couples, and solo travelers looking for a relaxed day at sea.",
    ],
    packageName: "Orange Bay Island Snorkeling Boat Trip",
    packageDescription: "Escape to Orange Bay Island from Hurghada. Relax, swim and snorkel on a luxury yacht with lunch and hotel transfers.",
    packagePrice: "25",
    packageLabel: "Adult",
    itinerary: [
      "Hotel pickup in Hurghada and transfer to the marina",
      "Luxury yacht cruise across the crystal-clear Red Sea",
      "Two snorkeling stops at vibrant coral reef locations",
      "Relaxing visit to Orange Bay Island with free time on the beach",
      "Lunch onboard and return transfer to your hotel",
    ],
  },



  {
    slug: "diving",

    title: "Red Sea Scuba Diving",

    image: "/images/scuba-diving.jpg",

    price: "45",

    rating: "4.8",

    location: "Hurghada, Egypt",

    duration: "6 Hours",

    description:
      "Explore amazing coral reefs and discover the underwater world of the Red Sea.",

    highlights: [
      "Professional instructor",
      "Equipment included",
      "Boat trip",
      "Two diving sessions",
    ],

  },



  {
    slug: "safari",

    title: "Desert Safari Adventure",

    image: "/images/desert-safari.jpg",

    price: "30",

    rating: "4.7",

    location: "Hurghada Desert",

    duration: "5 Hours",

    description:
      "Experience the desert by quad bike, camel ride and Bedouin village visit.",

    highlights: [
      "Quad bike",
      "Camel ride",
      "Bedouin tea",
      "Sunset experience",
    ],

  },


];