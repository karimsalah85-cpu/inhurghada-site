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
  priceUnit?: string;
  itinerary?: string[];
  participantPricing?: {
    adults: number;
    youth?: number;
    infants?: number;
  };
  availableTimes?: string[];
  category?: string;
  badge?: "Most Popular" | "Best Value" | "New" | "Premium";
  seoTitle?: string;
  metaDescription?: string;
  faqs?: { question: string; answer: string }[];
};



export const tours: Tour[] = [

  {
    slug: "transfer-to-and-from-senzo-mall",
    title: "Private Transfer To and From Senzo Mall Hurghada",
    image: "/images/transfer.jpg",
    price: "15",
    rating: "New",
    location: "Hurghada, Egypt",
    duration: "1 Hour",
    description: "Private door-to-door transfer between Senzo Mall and your hotel, resort, apartment, or preferred pickup point in Hurghada.",
    highlights: ["Private air-conditioned vehicle", "Professional local driver", "Flexible pickup time", "Cash payment on arrival"],
    included: ["Private vehicle", "Driver", "Fuel, parking and taxes"],
    notIncluded: ["Personal shopping expenses", "Food and drinks", "Additional stops"],
    notes: ["Confirm your hotel or pickup address when booking.", "We confirm pickup time by WhatsApp before the transfer."],
    packageName: "Hurghada hotel / Senzo Mall transfer",
    packageDescription: "Fixed-price private transfer for your group.",
    packagePrice: "15",
    packageLabel: "Per vehicle",
  },

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
    participantPricing: { adults: 25, youth: 15, infants: 0 },
    availableTimes: ["08:00"],
    category: "Island Trip",
    badge: "Most Popular",
    seoTitle: "Orange Bay Island Boat Trip from Hurghada | Snorkeling and Lunch",
    metaDescription: "Enjoy a full-day Orange Bay Island boat trip from Hurghada including snorkeling, lunch, hotel transfers and crystal-clear Red Sea waters.",
    faqs: [
      { question: "Is lunch included on the Orange Bay trip?", answer: "Yes. Lunch onboard and soft drinks are included in this full-day boat trip." },
      { question: "Is Orange Bay suitable for families?", answer: "Yes. This relaxed island day is popular with families, couples, and groups. Infants travel free in the booking form." },
      { question: "How will I receive my pickup time?", answer: "After you book, Daily Red Sea confirms your pickup time and hotel location by WhatsApp." },
    ],
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

  {
    slug: "professional-underwater-photographer",

    title: "Professional Underwater Photographer",

    image: "/images/scuba-diving.jpg",

    // Prices are stored in USD and converted by the site's currency selector.
    // At the current EUR conversion rate, this displays as €120.00 per day.
    price: "137.02",

    rating: "5.0",
    reviews: "12",

    location: "Hurghada, Egypt",

    duration: "Full day",

    description:
      "Bring your Red Sea adventure home with a dedicated professional underwater photographer. Enjoy a full day of high-quality underwater and surface photography while you dive, snorkel, or explore by boat.",

    highlights: [
      "Dedicated professional underwater photographer",
      "Underwater and above-water photos throughout the day",
      "Ideal for diving, snorkeling, boat trips, and private experiences",
      "Beautiful Red Sea memories captured professionally",
    ],

    included: [
      "Professional photographer for one full day",
      "Underwater photography equipment",
      "Edited digital photo selection",
      "Coordination with your boat trip, dive, or snorkeling activity",
    ],

    notIncluded: [
      "Boat trip, diving, or snorkeling activity fees",
      "Hotel transfers unless arranged with your experience",
      "Printed albums or additional edited images",
    ],

    notes: [
      "Please book in advance to confirm photographer availability.",
      "Share your planned activity and departure time when booking.",
      "The service is priced per photographer, per full day.",
    ],

    packageName: "Full-Day Underwater Photography Service",
    packageDescription: "A dedicated professional photographer to capture your Red Sea experience for a full day.",
    packagePrice: "137.02",
    packageLabel: "Per day",
    priceUnit: "per day",
    itinerary: [
      "Confirm your activity, meeting point, and preferred photo style",
      "Meet your photographer before departure",
      "Capture underwater and above-water moments throughout the day",
      "Receive your edited digital photo selection after the experience",
    ],
  },


];
