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
    category: "Diving",
    badge: "Best Value",

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
    category: "Desert Safari",
    badge: "Most Popular",

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

  {
    slug: "mahmya-island", title: "Mahmya Island Boat Trip", image: "/images/mahmya-island.jpg", price: "75", rating: "4.9", reviews: "New", location: "Hurghada, Egypt", duration: "Full Day", category: "Island Trip", badge: "Premium",
    seoTitle: "Mahmya Island Boat Trip from Hurghada | Premium Red Sea Experience", metaDescription: "Visit Mahmya Island from Hurghada for a premium Red Sea day with crystal-clear water, white sandy beaches and memorable snorkeling.",
    description: "Discover the crystal-clear waters of Mahmya Island in the Giftun Island National Park. Relax on white sand, swim in turquoise water, and enjoy a premium island day from Hurghada.",
    highlights: ["Premium island experience", "White sandy beach", "Crystal-clear water", "Snorkeling", "Lunch", "Boat cruise", "Hotel transfers"], included: ["Hotel pickup and return", "Boat cruise", "Island entry", "Lunch", "Soft drinks"], notIncluded: ["Personal expenses", "Photos and videos"], notes: ["Pickup time is confirmed by WhatsApp.", "Bring swimwear, sunscreen, and a towel."], packageName: "Mahmya Island day trip", packageDescription: "A premium full-day island experience with pickup, boat cruise and lunch.", packagePrice: "75", packageLabel: "Per person", itinerary: ["Hotel pickup", "Boat cruise", "Mahmya beach time", "Lunch", "Return to Hurghada"],
  },
  {
    slug: "full-day-snorkeling", title: "Full Day Snorkeling Trip", image: "/images/full-day-snorkeling.jpg", price: "25", rating: "4.8", reviews: "New", location: "Hurghada, Egypt", duration: "8 Hours", category: "Snorkeling", badge: "Best Value",
    seoTitle: "Full Day Snorkeling Trip in Hurghada | Red Sea Reefs and Lunch", metaDescription: "Explore Red Sea coral reefs on a full-day snorkeling trip from Hurghada with lunch, soft drinks and hotel pickup.",
    description: "Explore beautiful local coral reefs on a full-day snorkeling adventure from Hurghada. The captain selects suitable snorkeling locations according to weather and sea conditions.", highlights: ["Two snorkeling stops", "Local Red Sea reefs", "Buffet lunch", "Soft drinks", "Hotel pickup", "Professional guide"], included: ["Hotel pickup", "Boat trip", "Snorkeling equipment", "Lunch", "Soft drinks"], notIncluded: ["Island visit", "Personal expenses"], notes: ["This trip does not include an island visit.", "Locations depend on weather and sea conditions."], packageName: "Full-day reef snorkeling", packageDescription: "A relaxed Red Sea boat day with two snorkeling stops and lunch.", packagePrice: "25", packageLabel: "Per person",
  },
  {
    slug: "full-day-diving", title: "Full Day Scuba Diving Trip", image: "/images/full-day-diving.jpg", price: "55", rating: "4.8", reviews: "New", location: "Hurghada, Egypt", duration: "8 Hours", category: "Diving", badge: "Premium",
    seoTitle: "Full Day Scuba Diving Trip in Hurghada | 2 Guided Red Sea Dives", metaDescription: "Discover the Red Sea with two guided dives from Hurghada, lunch onboard, soft drinks and hotel transfers.",
    description: "Discover the incredible underwater world of the Red Sea with two guided dives. Dive locations are selected by the captain according to weather and sea conditions.", highlights: ["Two guided dives", "Professional instructor", "Lunch onboard", "Soft drinks", "Hotel transfers", "Equipment available"], included: ["Hotel transfers", "Boat trip", "Professional instructor", "Lunch", "Soft drinks"], notIncluded: ["Diving equipment rental - available for $30", "Personal expenses"], notes: ["Equipment is not included in the base price.", "Dive sites depend on weather and sea conditions."], packageName: "Two guided Red Sea dives", packageDescription: "A full-day boat trip with two guided dives. Equipment can be added when booking.", packagePrice: "55", packageLabel: "Per person",
  },
  {
    slug: "quad-safari-morning", title: "Morning Quad Bike Safari", image: "/images/desert-safari.jpg", price: "20", rating: "4.7", reviews: "New", location: "Hurghada Desert", duration: "5 Hours", category: "Desert Safari", badge: "Best Value",
    seoTitle: "Morning Quad Bike Safari in Hurghada Desert", metaDescription: "Ride through the Eastern Desert on a morning quad bike safari from Hurghada with a Bedouin camp visit and tea.",
    description: "Start your day with a quad bike adventure through the Eastern Desert. Ride across desert tracks, take in mountain views and visit a traditional Bedouin camp.", highlights: ["Quad bike ride", "Desert adventure", "Bedouin camp", "Tea", "Mountain views"], included: ["Hotel pickup", "Quad bike ride", "Safety briefing", "Bedouin tea"], notIncluded: ["Scarf and goggles if required", "Personal expenses"], notes: ["Drivers must follow the safety briefing.", "Bring sunglasses and closed shoes."], packageName: "Morning desert quad safari", packageDescription: "A morning desert ride with Bedouin camp visit.", packagePrice: "20", packageLabel: "Per person",
  },
  {
    slug: "quad-safari-sunset", title: "Sunset Quad Bike Safari", image: "/images/desert-safari.jpg", price: "22", rating: "4.8", reviews: "New", location: "Hurghada Desert", duration: "5 Hours", category: "Desert Safari", badge: "Most Popular",
    seoTitle: "Sunset Quad Bike Safari in Hurghada Desert", metaDescription: "Experience a Hurghada desert sunset with an exciting quad bike ride, Bedouin visit and mountain panorama.",
    description: "Experience Hurghada's desert at sunset with a memorable quad biking adventure through the mountains followed by a traditional Bedouin visit.", highlights: ["Sunset ride", "Quad bike", "Bedouin camp", "Tea", "Desert panorama"], included: ["Hotel pickup", "Quad bike ride", "Safety briefing", "Bedouin tea"], notIncluded: ["Personal expenses"], notes: ["Pickup time varies with the sunset.", "Bring sunglasses and closed shoes."], packageName: "Sunset desert quad safari", packageDescription: "A sunset desert ride with traditional Bedouin hospitality.", packagePrice: "22", packageLabel: "Per person",
  },
  {
    slug: "hurghada-airport-transfer", title: "Hurghada Airport Private Transfer", image: "/images/hurghada-airport-transfer.jpg", price: "15", rating: "5.0", reviews: "New", location: "Hurghada International Airport", duration: "Flexible", category: "Airport Transfer", badge: "Best Value",
    seoTitle: "Hurghada Airport Private Transfer | Hotel Pickup and Drop-off", metaDescription: "Book a private transfer between Hurghada International Airport and your hotel with fixed pricing and reliable local drivers.",
    description: "Private airport transfers between Hurghada International Airport and your hotel with comfortable vehicles, fixed pricing, and reliable local drivers.", highlights: ["Private vehicle", "Meet and greet", "Hotel pickup", "Flight monitoring", "Air-conditioned car"], included: ["Private vehicle", "Driver", "Fuel and parking"], notIncluded: ["Additional stops"], notes: ["Send your flight number and hotel name when booking.", "We confirm your meeting point by WhatsApp."], packageName: "Airport to hotel private transfer", packageDescription: "Reliable door-to-door airport transfer for your group.", packagePrice: "15", packageLabel: "From price",
  },
  {
    slug: "senzo-transfer", title: "Private Transfer To and From Senzo Mall Hurghada", image: "/images/senzo-transfer.jpg", price: "15", rating: "New", location: "Hurghada, Egypt", duration: "Flexible", category: "Shopping Transfer", badge: "New",
    seoTitle: "Senzo Mall Transfer from Hurghada Hotels", metaDescription: "Convenient private transfer from your Hurghada hotel to Senzo Mall for shopping, dining and entertainment.",
    description: "Private door-to-door transport between your Hurghada hotel and Senzo Mall for shopping, dining, and entertainment, with flexible return times.", highlights: ["Private vehicle", "Hotel pickup", "Flexible return time", "Air-conditioned car"], included: ["Private transfer", "Driver", "Fuel and parking"], notIncluded: ["Shopping and meals"], notes: ["Confirm your preferred return time when booking."], packageName: "Senzo Mall private transfer", packageDescription: "Simple door-to-door transport for shopping and dining.", packagePrice: "15", packageLabel: "From price",
  },


];
