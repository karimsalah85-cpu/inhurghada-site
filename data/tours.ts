export type Tour = {
  slug: string;
  /** Destination ownership keeps tours ready for expansion beyond Hurghada. */
  destinationSlug?: string;
  title: string;
  image: string;
  price: string;
  originalPrice?: string;
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
  ageBands?: { adults: string; children: string; infants: string };
  notSuitableFor?: string[];
  whatToBring?: string[];
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
  /** Inquiry tours are listed publicly but cannot be checked out until a verified price is configured. */
  bookingMode?: "direct" | "inquiry";
};



export const tours: Tour[] = [

  {
    slug: "orange-bay",

    title: "Orange Bay Island Snorkeling Boat Trip",

    image: "/images/orange-bay.jpeg",

    // Catalog prices use USD as the site base currency. With the configured EUR
    // rate these display as EUR 36.78 (20% below the verified EUR 45.98 price),
    // EUR 45.98 before discount, and EUR 22 for children.
    price: "41.96",
    originalPrice: "52.45",

    rating: "5.0",
    reviews: "30",

    location: "Hurghada, Egypt",

    duration: "8.5 Hours",

    description:
      "Enjoy a full-day Orange Bay trip with two-way pickup from Hurghada, a Red Sea boat cruise, snorkeling, island time, lunch, drinks, snacks and water activities.",

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
      "Hotel pickup and drop-off in Hurghada",
      "Boat cruise",
      "Tour guide",
      "Snorkeling stop with use of snorkeling equipment",
      "Stop at Orange Bay Island",
      "Open buffet: fish, chicken, chicken nuggets, oven-roasted potatoes, rice, pasta and meat kofta",
      "Four different kinds of salad and three different kinds of fruit",
      "Unlimited soft drinks, hot drinks and snacks",
      "One massage per guest",
      "Life jackets",
      "Tax and marine fee",
    ],
    notIncluded: [
      "Drinks on the island",
      "Pickup from Makadi Bay, Soma Bay, El Gouna, Sahl Hasheesh or Safaga (€3.75 extra per adult after discount)",
      "Personal expenses",
    ],
    notes: [
      "Start time is 7:30 AM. Your exact pickup time is confirmed by WhatsApp.",
      "Bookings must be made at least one day before the trip.",
      "Free cancellation is available until one day before the trip.",
      "Two-way pickup and transfer are included from Hurghada.",
      "Live guides are available in English, German, Arabic, Russian and French, subject to confirmation.",
      "Pickup from Makadi Bay, Soma Bay, El Gouna, Sahl Hasheesh or Safaga costs €3.75 extra per adult after discount.",
    ],
    packageName: "Orange Bay Island Snorkeling Boat Trip",
    packageDescription: "Escape to Orange Bay Island from Hurghada. Relax, swim and snorkel on a luxury yacht with lunch and hotel transfers.",
    packagePrice: "41.96",
    packageLabel: "Adult",
    participantPricing: { adults: 41.96, youth: 25.09, infants: 0 },
    ageBands: { adults: "Adults (ages 12-99)", children: "Children (ages 2-11)", infants: "Infants (age 1 and younger)" },
    availableTimes: ["07:30"],
    category: "Island Trip",
    badge: "Most Popular",
    seoTitle: "Orange Bay Island Boat Trip from Hurghada | Snorkeling and Lunch",
    metaDescription: "Enjoy a full-day Orange Bay Island boat trip from Hurghada including snorkeling, lunch, hotel transfers and crystal-clear Red Sea waters.",
    faqs: [
      { question: "Is lunch included on the Orange Bay trip?", answer: "Yes. Lunch onboard and soft drinks are included in this full-day boat trip." },
      { question: "Is Orange Bay suitable for families?", answer: "Yes. This relaxed island day is popular with families, couples, and groups. Infants travel free in the booking form." },
      { question: "How will I receive my pickup time?", answer: "After you book, Daily Red Sea confirms your pickup time and hotel location by WhatsApp." },
      { question: "What is the cancellation policy?", answer: "Cancellation is free until one day before the trip. The trip must also be booked at least one day in advance." },
    ],
    itinerary: [
      "Pickup location options · Van transfer (30 minutes)",
      "Red Sea · Boat cruise (45 minutes)",
      "Orange Bay · Island visit (75 minutes)",
      "Jazā'ir Jiftūn · Snorkeling (45 minutes, optional)",
      "Red Sea · Lunch (45 minutes, optional)",
      "Jazīrat Abū Rimāthī · Snorkeling (45 minutes, optional)",
      "Red Sea · Banana boat ride (45 minutes, optional)",
      "Red Sea · Free time (45 minutes, optional)",
      "Red Sea Governorate · Return boat cruise (45 minutes)",
      "Van transfer (30 minutes) · Drop-off locations",
    ],
    notSuitableFor: ["People with mobility impairments", "Wheelchair users"],
    whatToBring: ["Sunglasses", "Sun hat", "Swimwear", "Towel", "Sunscreen", "Cash"],
  },



  {
    slug: "safari",

    title: "Desert Safari Adventure",

    image: "/images/hurghada-desert-camel-closeup.jpeg",

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
    participantPricing: { adults: 30, youth: 20 },
    availableTimes: ["Afternoon - exact pickup confirmed by WhatsApp"],
    category: "Desert Safari",
    badge: "Most Popular",

  },

  {
    slug: "professional-underwater-photographer",

    title: "Professional Underwater Photographer",

    image: "/images/hurghada-red-sea-scuba-diver.jpeg",

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
    participantPricing: { adults: 137.02 },
    availableTimes: ["Start time confirmed by WhatsApp"],
    itinerary: [
      "Confirm your activity, meeting point, and preferred photo style",
      "Meet your photographer before departure",
      "Capture underwater and above-water moments throughout the day",
      "Receive your edited digital photo selection after the experience",
    ],
  },

  {
    slug: "luxor-private-day-trip",
    title: "Private Day Trip to Luxor from Hurghada",
    image: "/images/luxor-karnak-columns.jpeg",
    price: "120",
    rating: "5.0",
    reviews: "New",
    location: "Luxor, Egypt",
    duration: "About 1 Day",
    category: "Cultural Day Trip",
    badge: "Premium",
    description: "Discover the real Luxor on a private day trip from Hurghada with your own air-conditioned vehicle and Egyptologist guide. Explore the Valley of the Kings, Hatshepsut Temple, the Colossi of Memnon and the monumental Karnak Temple, with hotel pickup and lunch included.",
    highlights: [
      "Private day trip with your own vehicle and guide",
      "Visit three royal tombs in the Valley of the Kings",
      "See Queen Hatshepsut's dramatic terraced temple",
      "Stand before the Colossi of Memnon",
      "Explore the vast Karnak Temple complex",
      "Family and group pricing available on request",
      "Free cancellation up to 24 hours before the activity starts",
      "Runs every day with approximately 05:00 hotel pickup",
    ],
    included: [
      "Private hotel pickup and return in Hurghada",
      "Private air-conditioned vehicle",
      "Valley of the Kings admission with three standard tombs",
      "Hatshepsut Temple, Colossi of Memnon and Karnak Temple",
      "Entrance fees with no hidden admission costs",
      "Private English-speaking Egyptologist guide",
      "Lunch at a local restaurant, with vegetarian option available",
      "Mineral water",
      "Required travel permits",
      "Service charges and taxes",
    ],
    notIncluded: [
      "Tutankhamun's tomb ticket – approximately $30 extra",
      "Guides in French, German, Spanish, Italian, Dutch, Russian or Polish – supplement applies",
      "Drinks with lunch",
      "Optional felucca trip",
      "Tipping and personal expenses",
    ],
    notes: [
      "A valid ID or passport is required for the travel permit.",
      "The advertised $120 is the starting adult price. Contact us for a family or private-group quotation.",
      "Pickup is planned for approximately 05:00 and confirmed by WhatsApp.",
      "Tutankhamun's tomb is not part of the standard three-tomb ticket and is paid separately if requested.",
      "All itinerary times are guidelines and may change with traffic, opening conditions and your private schedule.",
      "Free cancellation is available until 24 hours before the activity starts.",
    ],
    packageName: "Private Luxor Day Trip from Hurghada",
    packageDescription: "A full private Luxor experience with transport, Egyptologist guide, main entrance fees, three Valley of the Kings tombs and lunch.",
    packagePrice: "120",
    packageLabel: "Starting price per adult",
    participantPricing: { adults: 120 },
    availableTimes: ["05:00"],
    seoTitle: "Private Luxor Day Trip from Hurghada | Valley of the Kings",
    metaDescription: "Book a private Luxor day trip from Hurghada with Valley of the Kings, Hatshepsut Temple, Colossi of Memnon, Karnak, guide, entrance fees and lunch.",
    faqs: [
      { question: "Is Tutankhamun's tomb included?", answer: "No. The standard visit includes three regular Valley of the Kings tombs. Tutankhamun's tomb requires a separate ticket costing approximately $30." },
      { question: "Is lunch included in the Luxor day trip?", answer: "Yes. Lunch at a local restaurant is included, and a vegetarian option is available. Drinks are paid separately." },
      { question: "Can I request a guide in another language?", answer: "Yes. French, German, Spanish, Italian, Dutch, Russian and Polish guides can be requested for an additional supplement, subject to availability." },
    ],
    itinerary: [
      "05:00 – Private pickup from your Hurghada hotel and drive approximately 280 km to Luxor, with a comfort stop en route",
      "09:30 – Cross to Luxor's west bank and visit three decorated royal tombs in the Valley of the Kings",
      "11:30 – Visit the Colossi of Memnon, the monumental statues of Amenhotep III",
      "12:00 – Optional stop at a local alabaster workshop",
      "12:30 – Explore the terraced mortuary temple of Queen Hatshepsut at Deir el-Bahari",
      "13:30 – Included lunch at a local Egyptian restaurant; vegetarian meal available",
      "14:45 – Guided visit to Karnak Temple and its extraordinary ancient halls and monuments",
      "17:00 – Private air-conditioned return transfer to your hotel in Hurghada",
    ],
  },

  {
    slug: "mahmya-island", title: "Mahmya Island Boat Trip", image: "/images/mahmya-island-boats-sunset.jpeg", price: "75", rating: "4.9", reviews: "New", location: "Hurghada, Egypt", duration: "Full Day", category: "Island Trip", badge: "Premium",
    seoTitle: "Mahmya Island Boat Trip from Hurghada | Premium Red Sea Experience", metaDescription: "Visit Mahmya Island from Hurghada for a premium Red Sea day with crystal-clear water, white sandy beaches and memorable snorkeling.",
    description: "Discover the crystal-clear waters of Mahmya Island in the Giftun Island National Park. Relax on white sand, swim in turquoise water, and enjoy a premium island day from Hurghada.", participantPricing: { adults: 75, youth: 45, infants: 0 }, availableTimes: ["08:00"],
    highlights: ["Premium island experience", "White sandy beach", "Crystal-clear water", "Snorkeling", "Lunch", "Boat cruise", "Hotel transfers"], included: ["Hotel pickup and return", "Boat cruise", "Island entry", "Lunch", "Soft drinks"], notIncluded: ["Personal expenses", "Photos and videos"], notes: ["Pickup time is confirmed by WhatsApp.", "Bring swimwear, sunscreen, and a towel."], packageName: "Mahmya Island day trip", packageDescription: "A premium full-day island experience with pickup, boat cruise and lunch.", packagePrice: "75", packageLabel: "Per person", itinerary: ["Hotel pickup", "Boat cruise", "Mahmya beach time", "Lunch", "Return to Hurghada"],
  },
  {
    slug: "full-day-snorkeling", title: "Full Day Snorkeling Trip", image: "/images/hurghada-snorkeling-reef-panorama.jpeg", price: "25", rating: "4.8", reviews: "New", location: "Hurghada, Egypt", duration: "8 Hours", category: "Snorkeling", badge: "Best Value",
    seoTitle: "Full Day Snorkeling Trip in Hurghada | Red Sea Reefs and Lunch", metaDescription: "Explore Red Sea coral reefs on a full-day snorkeling trip from Hurghada with lunch, soft drinks and hotel pickup.",
    description: "Explore beautiful local coral reefs on a full-day snorkeling adventure from Hurghada. The captain selects suitable snorkeling locations according to weather and sea conditions.", highlights: ["Two snorkeling stops", "Local Red Sea reefs", "Buffet lunch", "Soft drinks", "Hotel pickup", "Professional guide"], included: ["Hotel pickup", "Boat trip", "Snorkeling equipment", "Lunch", "Soft drinks"], notIncluded: ["Island visit", "Personal expenses"], notes: ["This trip does not include an island visit.", "Locations depend on weather and sea conditions."], packageName: "Full-day reef snorkeling", packageDescription: "A relaxed Red Sea boat day with two snorkeling stops and lunch.", packagePrice: "25", packageLabel: "Per person", participantPricing: { adults: 25, youth: 15, infants: 0 }, availableTimes: ["08:00"],
  },
  {
    slug: "full-day-diving", title: "Full Day Scuba Diving Trip", image: "/images/hurghada-red-sea-scuba-diver.jpeg", price: "55", rating: "4.8", reviews: "New", location: "Hurghada, Egypt", duration: "8 Hours", category: "Diving", badge: "Premium",
    seoTitle: "Full Day Scuba Diving Trip in Hurghada | 2 Guided Red Sea Dives", metaDescription: "Discover the Red Sea with two guided dives from Hurghada, lunch onboard, soft drinks and hotel transfers.",
    description: "Discover the incredible underwater world of the Red Sea with two guided dives. Dive locations are selected by the captain according to weather and sea conditions.", highlights: ["Two guided dives", "Professional instructor", "Lunch onboard", "Soft drinks", "Hotel transfers", "Equipment available"], included: ["Hotel transfers", "Boat trip", "Professional instructor", "Lunch", "Soft drinks"], notIncluded: ["Diving equipment rental - available for $30", "Personal expenses"], notes: ["A valid scuba diving license is required for every diver and proof must be brought on the trip.", "Equipment is not included in the base price.", "Dive sites depend on weather and sea conditions."], packageName: "Two guided Red Sea dives", packageDescription: "A full-day boat trip with two guided dives. A valid diving license is required; equipment can be added when booking.", packagePrice: "55", packageLabel: "Per person", participantPricing: { adults: 55, youth: 55 }, availableTimes: ["08:00"],
  },
  {
    slug: "quad-safari-morning", title: "Morning Quad Bike Safari", image: "/images/hurghada-desert-camel-closeup.jpeg", price: "20", rating: "4.7", reviews: "New", location: "Hurghada Desert", duration: "5 Hours", category: "Desert Safari", badge: "Best Value",
    seoTitle: "Morning Quad Bike Safari in Hurghada Desert", metaDescription: "Ride through the Eastern Desert on a morning quad bike safari from Hurghada with a Bedouin camp visit and tea.",
    description: "Start your day with a quad bike adventure through the Eastern Desert. Ride across desert tracks, take in mountain views and visit a traditional Bedouin camp.", highlights: ["Quad bike ride", "Desert adventure", "Bedouin camp", "Tea", "Mountain views"], included: ["Hotel pickup", "Quad bike ride", "Safety briefing", "Bedouin tea"], notIncluded: ["Scarf and goggles if required", "Personal expenses"], notes: ["Minimum participant age is 9 years.", "Drivers must follow the safety briefing.", "Bring sunglasses and closed shoes."], packageName: "Morning desert quad safari", packageDescription: "A morning desert ride with Bedouin camp visit. Minimum age: 9 years.", packagePrice: "20", packageLabel: "Per person", participantPricing: { adults: 20, youth: 20 }, availableTimes: ["08:00"],
  },
  {
    slug: "quad-safari-sunset", title: "Sunset Quad Bike Safari", image: "/images/hurghada-desert-camel-closeup.jpeg", price: "22", rating: "4.8", reviews: "New", location: "Hurghada Desert", duration: "5 Hours", category: "Desert Safari", badge: "Most Popular",
    seoTitle: "Sunset Quad Bike Safari in Hurghada Desert", metaDescription: "Experience a Hurghada desert sunset with an exciting quad bike ride, Bedouin visit and mountain panorama.",
    description: "Experience Hurghada's desert at sunset with a memorable quad biking adventure through the mountains followed by a traditional Bedouin visit.", highlights: ["Sunset ride", "Quad bike", "Bedouin camp", "Tea", "Desert panorama"], included: ["Hotel pickup", "Quad bike ride", "Safety briefing", "Bedouin tea"], notIncluded: ["Personal expenses"], notes: ["Minimum participant age is 9 years.", "Pickup is in the afternoon and varies with sunset time. We confirm the exact time by WhatsApp.", "Bring sunglasses and closed shoes."], packageName: "Sunset desert quad safari", packageDescription: "A sunset desert ride with traditional Bedouin hospitality. Minimum age: 9 years.", packagePrice: "22", packageLabel: "Per person", participantPricing: { adults: 22, youth: 22 }, availableTimes: ["Afternoon - exact pickup confirmed by WhatsApp"],
  },
  {
    slug: "hurghada-airport-transfer", title: "Hurghada Airport Private Transfer", image: "/images/hurghada-airport-transfer.jpg", price: "20", rating: "5.0", reviews: "New", location: "Hurghada International Airport", duration: "Flexible", category: "Airport Transfer", badge: "Best Value",
    seoTitle: "Hurghada Airport Private Transfer | Hotel Pickup and Drop-off", metaDescription: "Book a private transfer between Hurghada International Airport and your hotel with fixed pricing and reliable local drivers.",
    description: "One-way private airport transfer for a fixed $20 within Hurghada. Makadi Bay, Soma Bay, El Gouna, and Sahl Hasheesh add $7.", highlights: ["Fixed one-way fare", "Meet and greet", "Flight monitoring", "Private air-conditioned vehicle", "Automatic vehicle sizing"], included: ["Private vehicle", "Driver", "Fuel and parking"], notIncluded: ["Additional stops", "Return journey"], notes: ["1–2 passengers travel by small car with a maximum of 2 bags.", "Groups above 2 passengers receive a larger vehicle with up to 2 travel bags per person.", "Send your flight number and hotel name when booking."], packageName: "Airport one-way private transfer", packageDescription: "$20 within Hurghada; add $7 for Makadi Bay, Soma Bay, El Gouna, or Sahl Hasheesh.", packagePrice: "20", packageLabel: "Fixed one-way fare", availableTimes: ["Time confirmed from your flight details"],
  },
  {
    slug: "senzo-transfer", title: "Private Transfer To and From Senzo Mall Hurghada", image: "/images/senzo-transfer.jpg", price: "10", rating: "New", location: "Hurghada, Egypt", duration: "Flexible", category: "Shopping Transfer", badge: "New",
    seoTitle: "Senzo Mall Transfer from Hurghada Hotels", metaDescription: "Convenient private transfer from your Hurghada hotel to Senzo Mall for shopping, dining and entertainment.",
    description: "One-way private Senzo Mall transfer for a fixed $10 within Hurghada. Makadi Bay, Soma Bay, El Gouna, and Sahl Hasheesh add $7.", highlights: ["Fixed one-way fare", "Private vehicle", "Hotel pickup", "Flexible pickup time", "Air-conditioned car"], included: ["Private transfer", "Driver", "Fuel and parking"], notIncluded: ["Return journey", "Travel bags", "Shopping and meals"], notes: ["Maximum 4 passengers.", "Travel bags are not accepted on this service.", "Book each direction separately if you need a return journey."], packageName: "Senzo Mall one-way transfer", packageDescription: "$10 within Hurghada; add $7 for Makadi Bay, Soma Bay, El Gouna, or Sahl Hasheesh.", packagePrice: "10", packageLabel: "Fixed one-way fare", availableTimes: ["Preferred time confirmed by WhatsApp"],
  },

  {
    slug: "dolphin-house-snorkeling", title: "Dolphin House Yacht Trip, Snorkeling and Lunch", image: "/images/hurghada-snorkeling-reef-panorama.jpeg",
    // EUR 26.40 is 20% below the verified GetYourGuide EUR 33 adult price.
    price: "30.11", originalPrice: "37.64", rating: "New", reviews: "New", location: "Hurghada, Egypt", duration: "5 Hours", category: "Snorkeling", badge: "New", bookingMode: "direct", participantPricing: { adults: 30.11 },
    description: "Cruise from Hurghada to known Dolphin House habitats for responsible dolphin watching, two guided snorkeling stops and a fresh lunch onboard. Swimming near dolphins is possible only when wildlife and sea conditions allow and is never guaranteed.",
    highlights: ["Watch for wild dolphins in their natural Red Sea habitat", "Snorkel at two colorful coral reefs", "Relax aboard a spacious yacht with a sun deck", "Enjoy breakfast, fresh lunch and drinks onboard", "Explore with a snorkeling guide and professional crew"],
    included: ["Pickup and drop-off within Hurghada", "Dolphin watching and possible swim experience when conditions allow", "Mask, fins and snorkel", "Two guided snorkeling stops", "Breakfast buffet", "Fresh lunch onboard including fish and calamari", "Hot drinks, soft drinks, water and refreshments", "Guide, snorkeling instructor and professional boat crew"],
    notIncluded: ["Guaranteed dolphin sighting or swim", "Banana and sofa rides unless purchased as an add-on", "Towels", "Underwater photos", "Optional gratuities", "Long-range pickup from Makadi Bay, Safaga, El Gouna, Sahl Hasheesh or Soma Bay unless quoted"],
    notes: ["Free cancellation is available up to 24 hours before departure.", "Book at least one day before the preferred trip date.", "Wild dolphins are not guaranteed. Swimming depends on dolphin presence, weather, sea conditions and boat traffic.", "Passport details, nationality, hotel name, address and room number may be required for permits.", "Pets are not allowed.", "Child, infant, water-activity and long-range pickup prices require confirmation because they were not shown in the supplied screenshots."],
    itinerary: ["Pickup from the confirmed Hurghada location", "Dolphin House habitat · dolphin watching and possible swimming (about 1 hour)", "Dolphin House reef · guided snorkeling (about 30 minutes)", "Small reef · guided snorkeling (about 30 minutes)", "Return transfer to the confirmed Hurghada location"],
    packageName: "Dolphin House Yacht Trip", packageDescription: "Five-hour yacht trip with dolphin watching, two snorkeling stops, breakfast, lunch, drinks and Hurghada pickup.", packagePrice: "30.11", packageLabel: "Adult", availableTimes: ["Morning pickup confirmed by WhatsApp"], notSuitableFor: ["People with mobility impairments"], whatToBring: ["Swimwear", "Towel", "Camera", "Sunscreen", "Passport or photo ID details when requested"], seoTitle: "Dolphin House Yacht and Snorkeling Trip from Hurghada", metaDescription: "Book a five-hour Dolphin House yacht trip from Hurghada with responsible dolphin watching, two snorkeling stops, breakfast, lunch and drinks."
  },
  {
    slug: "paradise-island", title: "Paradise Island Yacht Cruise, Lunch and Snorkeling", image: "/images/hurghada-island-beach-loungers.jpeg",
    // EUR 16.80 is 20% below the verified GetYourGuide EUR 21 adult price.
    price: "19.16", originalPrice: "23.95", rating: "New", reviews: "New", location: "Giftun Island, Hurghada", duration: "5–9 Hours", category: "Island Trip", badge: "New", bookingMode: "direct", participantPricing: { adults: 19.16 },
    description: "Enjoy a peaceful Paradise Island escape with a Red Sea yacht cruise, snorkeling in clear water, sandy beach time and lunch.", highlights: ["Paradise Island beach stop", "Red Sea snorkeling", "Relaxing yacht cruise", "Lunch during the experience", "Pickup available"], included: ["Pickup and return within the confirmed Hurghada zone", "Yacht cruise and island visit", "Snorkeling equipment", "Lunch", "Guide and life jackets"], notIncluded: ["Transfers outside the confirmed pickup zone", "Personal expenses", "Professional photos"], notes: ["Free cancellation is available up to 24 hours before the trip.", "Book at least one day before the preferred trip date.", "Island timing and snorkeling sites can change with sea conditions.", "The exact pickup time is confirmed by WhatsApp.", "Child and infant prices require confirmation before booking because the supplied comparison only showed one adult."], packageName: "Paradise Island Yacht Cruise", packageDescription: "Yacht cruise, Paradise Island beach time, snorkeling, lunch and pickup in the confirmed Hurghada zone.", packagePrice: "19.16", packageLabel: "Adult", availableTimes: ["Morning pickup confirmed by WhatsApp"], whatToBring: ["Swimwear", "Towel", "Sunscreen", "Cash"], seoTitle: "Paradise Island Yacht Cruise from Hurghada | Lunch and Snorkeling", metaDescription: "Book a Paradise Island yacht cruise from Hurghada with snorkeling, beach time, lunch and pickup, priced 20% below the verified comparison fare."
  },
  {
    slug: "magawish-speedboat", title: "Orange Bay and Magawish Speedboat Trip", image: "/images/hurghada-island-calm-sunset.jpeg", price: "26.40", rating: "New", reviews: "New", location: "Hurghada Marina", duration: "About 4 Hours", category: "Island Trip", badge: "New", bookingMode: "direct", participantPricing: { adults: 26.40 },
    description: "A faster small-group or private speedboat option combining island time around Orange Bay or Magawish with selected snorkeling stops.", highlights: ["Fast speedboat transfer", "Choice of island route", "Small-group or private options", "Snorkeling stop"], included: ["Speedboat and captain", "Life jackets", "Snorkeling equipment", "Water and soft drinks"], notIncluded: ["Island admission unless quoted", "Hotel transfer unless quoted", "Lunch and personal expenses"], notes: ["The captain selects the safest route for wind and sea conditions.", "Private and shared options have different prices and capacities.", "Pregnant guests and people with serious back conditions should not join.", "Cancellation terms are confirmed with the selected package."], availableTimes: ["Morning or afternoon, subject to availability"], notSuitableFor: ["Pregnant guests", "People with serious back or mobility conditions"], whatToBring: ["Swimwear", "Towel", "Sunscreen", "Photo ID"], seoTitle: "Orange Bay and Magawish Speedboat from Hurghada", metaDescription: "Request a small-group or private speedboat trip from Hurghada to Orange Bay or Magawish with snorkeling."
  },
  {
    slug: "royal-seascope-submarine", title: "Royal Seascope Semi-Submarine", image: "/images/hurghada-red-sea-coral-reef.jpeg", price: "17.60", rating: "New", reviews: "New", location: "Hurghada Marina", duration: "About 3 Hours", category: "Family Sea Activity", badge: "New", bookingMode: "direct", participantPricing: { adults: 17.60 },
    description: "See Red Sea coral and marine life through panoramic underwater windows, with an optional short snorkeling stop depending on the selected departure.", highlights: ["Underwater observation deck", "Panoramic viewing windows", "Suitable for non-swimmers", "Short family-friendly duration"], included: ["Semi-submarine cruise", "Safety equipment", "Crew assistance", "Hotel transfer when included in the confirmed package"], notIncluded: ["Food", "Photos", "Transfers outside the confirmed pickup zone"], notes: ["Visibility depends on weather and sea conditions.", "Stairs lead down to the underwater viewing deck.", "Departure time, pickup, cancellation and child policy are confirmed before payment."], availableTimes: ["Multiple departures subject to availability"], notSuitableFor: ["Guests unable to use the stairs to the viewing deck without assistance"], whatToBring: ["Sunglasses", "Camera", "Light jacket in winter"], seoTitle: "Royal Seascope Semi-Submarine in Hurghada", metaDescription: "Request a Royal Seascope semi-submarine trip in Hurghada to view Red Sea coral and marine life through panoramic windows."
  },
  {
    slug: "beginner-scuba-diving", title: "Beginner Scuba Diving Experience", image: "/images/scuba-diving.jpg", price: "24.00", rating: "New", reviews: "New", location: "Hurghada, Egypt", duration: "Full Day", category: "Diving", badge: "New", bookingMode: "direct", participantPricing: { adults: 24 },
    description: "Try scuba diving under direct instructor supervision, with a briefing, equipment and introductory dives at suitable Red Sea sites.", highlights: ["No diving license required", "Instructor supervision", "Introductory Red Sea dives", "Lunch onboard"], included: ["Hotel transfer in the confirmed zone", "Boat trip", "Diving instructor", "Standard diving equipment", "Lunch and soft drinks"], notIncluded: ["Medical clearance if required", "Photos", "Transfers outside Hurghada until quoted"], notes: ["A health questionnaire is required before diving.", "Minimum age and dive depth depend on the certified dive centre's rules.", "Guests must follow the instructor and may be refused for medical or safety reasons.", "Cancellation terms are confirmed with the dive centre."], availableTimes: ["Morning pickup confirmed by WhatsApp"], notSuitableFor: ["Pregnant guests", "Guests with unapproved serious heart, lung or ear conditions"], whatToBring: ["Swimwear", "Towel", "Passport or photo ID", "Sunscreen"], seoTitle: "Beginner Scuba Diving Experience in Hurghada", metaDescription: "Request a supervised beginner scuba diving day in Hurghada with equipment, instructor, boat trip and lunch."
  },
  {
    slug: "padi-open-water-course", title: "3-Day PADI Open Water Diving Course", image: "/images/hurghada-red-sea-scuba-diver.jpeg",
    // EUR 252 is 20% below the verified GetYourGuide EUR 315 advertised price.
    price: "287.44", originalPrice: "359.31", rating: "New", reviews: "New", location: "Hurghada, Egypt", duration: "3 Days", category: "Diving", badge: "New", bookingMode: "direct", participantPricing: { adults: 287.44 }, ageBands: { adults: "Students (ages 10+)", children: "", infants: "" },
    description: "Build essential scuba skills through theory lessons and supervised Red Sea training dives during a three-day PADI Open Water course. Certification is awarded only after successful completion of all required knowledge and water skills.",
    highlights: ["Three-day internationally recognized PADI course", "Two supervised dives per day", "Theory lessons and practical open-water skills", "PADI-certified instructor", "Red Sea reef and marine-life training environment"],
    included: ["Three-day PADI course with two dives per day", "PADI-certified instructor", "Weight belt and 12-litre tanks", "Complete standard diving equipment", "Lunch each course day", "Mineral water, soft drinks, tea and coffee", "Pickup and return within the confirmed hotel zone"],
    notIncluded: ["Marine tax (€5 per person per day; €15 for three days)", "PADI theoretical manual, certification and lifetime membership registration (€100 per person)", "Tips", "Photos", "Flights", "Egypt visa", "Hotel accommodation", "Medical examination if required"],
    notes: ["Free cancellation is available up to 24 hours before the course starts.", "The course starts at 8:00 AM on the first day; daily pickup times are confirmed by WhatsApp.", "A medical questionnaire and adequate swimming ability are required.", "Children under 18 require signed parental approval.", "Course completion and certification depend on successfully meeting PADI knowledge and water-skill requirements.", "Do not fly until the dive centre's required no-fly interval has passed after the final dive.", "Alcohol and drugs are not allowed."],
    packageName: "3-Day PADI Open Water Course", packageDescription: "Three days of theory and practical training with two dives per day, equipment, instructor, lunches, drinks and hotel transfers.", packagePrice: "287.44", packageLabel: "Student", availableTimes: ["08:00"], notSuitableFor: ["Children under 10 years", "Pregnant guests", "People with serious back problems", "People with heart problems", "Guests who cannot meet the medical and swimming requirements"], whatToBring: ["Passport or ID card", "Towel", "Camera", "Sunglasses", "Swimwear"], seoTitle: "3-Day PADI Open Water Diving Course in Hurghada", metaDescription: "Book a three-day PADI Open Water course in Hurghada with two dives daily, certified instruction, equipment, lunches, drinks and transfers."
  },
  {
    slug: "ssi-open-water-course", title: "3-Day SSI Open Water Diver Course", image: "/images/scuba-diving.jpg",
    // Same Daily Red Sea base price as the equivalent PADI course. A crossed-out
    // SSI comparison price is not shown without a verified external source.
    price: "287.44", rating: "New", reviews: "New", location: "Hurghada, Egypt", duration: "3 Days", category: "Diving", badge: "New", bookingMode: "direct", participantPricing: { adults: 287.44 }, ageBands: { adults: "Students (ages 10+)", children: "", infants: "" },
    description: "Learn the knowledge and water skills needed to become an SSI Open Water Diver through digital theory, confined-water practice and supervised Red Sea training dives. Certification is awarded only after successful completion of all SSI requirements.",
    highlights: ["Three-day SSI Open Water Diver program", "Digital learning and practical water training", "Two supervised dives per day", "SSI-certified diving professional", "Red Sea reef and marine-life training environment"],
    included: ["Three-day SSI Open Water Diver training with two dives per day", "SSI-certified diving professional", "SSI digital learning and certification registration", "Weight belt and 12-litre tanks", "Complete standard diving equipment", "Lunch each course day", "Mineral water, soft drinks, tea and coffee", "Pickup and return within the confirmed hotel zone"],
    notIncluded: ["Marine tax (€5 per person per day; €15 for three days)", "Tips", "Photos", "Flights", "Egypt visa", "Hotel accommodation", "Medical examination if required", "Any specialty training or additional dives outside the Open Water Diver program"],
    notes: ["Free cancellation is available up to 24 hours before the course starts.", "The course starts at 8:00 AM on the first day; daily pickup times are confirmed by WhatsApp.", "A medical questionnaire and adequate swimming ability are required.", "Students must be at least 10 years old; anyone under 18 requires signed parental or guardian approval.", "Course completion and certification depend on successfully meeting all SSI knowledge and water-skill requirements.", "Junior certification depth and supervision limits apply to younger students according to current SSI standards and the training centre's assessment.", "Do not fly until the dive centre's required no-fly interval has passed after the final dive.", "Alcohol and drugs are not allowed."],
    packageName: "3-Day SSI Open Water Diver Course", packageDescription: "Three days of SSI digital learning and practical training with two dives per day, equipment, professional instruction, lunches, drinks and hotel transfers.", packagePrice: "287.44", packageLabel: "Student", availableTimes: ["08:00"], notSuitableFor: ["Children under 10 years", "Pregnant guests", "People with serious back problems", "People with heart problems", "Guests who cannot meet the medical and swimming requirements"], whatToBring: ["Passport or ID card", "Towel", "Camera", "Sunglasses", "Swimwear"], seoTitle: "3-Day SSI Open Water Diver Course in Hurghada", metaDescription: "Book a three-day SSI Open Water Diver course in Hurghada with digital learning, two dives daily, equipment, lunches, drinks and transfers."
  },
  {
    slug: "super-safari", title: "Hurghada Super Safari with Quad, Camel and Dinner", image: "/images/desert-safari.jpg", price: "18.40", rating: "New", reviews: "New", location: "Hurghada Desert", duration: "About 7 Hours", category: "Desert Safari", badge: "New", bookingMode: "direct", participantPricing: { adults: 18.40 },
    description: "A longer desert program combining quad biking, a Bedouin village visit, camel riding, sunset views and an evening meal or show.", highlights: ["Quad bike ride", "Camel experience", "Bedouin village", "Sunset, dinner and entertainment"], included: ["Hotel transfer in the confirmed zone", "Safety briefing and quad ride", "Camel ride", "Bedouin tea", "Dinner when included in the selected package"], notIncluded: ["Scarf and goggles", "Transfers outside Hurghada until quoted", "Personal expenses"], notes: ["Drivers must meet the operator's minimum age and safety rules.", "Pregnant guests and people with serious back problems should not ride.", "Exact route, dinner and show inclusions are confirmed with the package.", "Pickup time changes seasonally."], availableTimes: ["Afternoon pickup confirmed by WhatsApp"], notSuitableFor: ["Pregnant guests", "People with serious back, neck or mobility conditions"], whatToBring: ["Closed shoes", "Sunglasses", "Scarf", "Warm layer in winter"], seoTitle: "Hurghada Super Safari with Quad Bike, Camel and Dinner", metaDescription: "Request a Hurghada super safari with quad biking, camel ride, Bedouin village, sunset and dinner."
  },
  {
    slug: "desert-stargazing", title: "Desert Stargazing, Camel Ride and Dinner", image: "/images/hurghada-desert-camel-profile.jpeg", price: "27.20", rating: "New", reviews: "New", location: "Hurghada Desert", duration: "About 6 Hours", category: "Desert Safari", badge: "New", bookingMode: "direct", participantPricing: { adults: 27.20 },
    description: "Travel into the Eastern Desert for sunset, a short camel experience, Bedouin-style dinner and guided observation of the night sky.", highlights: ["Desert sunset", "Camel experience", "Bedouin dinner", "Telescope stargazing when conditions allow"], included: ["Hotel transfer in the confirmed zone", "Desert guide", "Camel ride", "Dinner and hot drink", "Telescope session when available"], notIncluded: ["Transfers outside Hurghada until quoted", "Personal expenses", "Professional astronomy photography"], notes: ["Stars and telescope visibility depend on clouds, moonlight and weather.", "The route may use a jeep or van according to the selected package.", "Pickup and cancellation conditions are confirmed before booking."], availableTimes: ["Afternoon pickup varies by sunset"], whatToBring: ["Closed shoes", "Warm layer", "Water", "Camera"], seoTitle: "Hurghada Desert Stargazing with Camel Ride and Dinner", metaDescription: "Request a Hurghada desert stargazing evening with sunset, camel ride, Bedouin dinner and telescope observation."
  },
  {
    slug: "horse-riding-sea-desert", title: "Hurghada Desert and Sea Horse Riding with Optional Swimming", image: "/images/hurghada-island-family-sunset.jpeg",
    // EUR 12 is 20% below the verified GetYourGuide EUR 15 current from price.
    price: "13.69", originalPrice: "17.11", rating: "New", reviews: "New", location: "Hurghada, Egypt", duration: "2–4 Hours", category: "Outdoor Activity", badge: "New", bookingMode: "direct", participantPricing: { adults: 13.69 }, ageBands: { adults: "Riders (ages 5+)", children: "", infants: "" },
    description: "Explore golden desert trails and the Red Sea coast on a guided horse ride suitable for beginners and experienced riders. Optional shallow-water riding or swimming with the horse is available only with the selected route and safe conditions.",
    highlights: ["Desert and Red Sea coastal trails", "Optional shallow-water horse experience", "Professional local guide", "Routes for different riding abilities", "Small-group experience"],
    included: ["Guided horse-riding experience", "Well-trained horse matched to the rider", "English-speaking guide or instructor", "Helmet and available safety equipment", "Bottled water", "Hotel pickup and return within Hurghada"],
    notIncluded: ["Gratuities", "Personal expenses", "Professional photography unless stated in the confirmed option", "Pickup outside Hurghada, including Makadi Bay, Sahl Hasheesh, El Gouna, Soma Bay and Safaga, unless quoted", "Lunch and extended six-hour program unless selected"],
    notes: ["Free cancellation is available up to 24 hours before departure.", "Book at least one day before the preferred riding date.", "Provide every rider's age, approximate weight and experience before confirmation so the stable can assign a suitable horse.", "Swimming or riding in the sea is optional, route-dependent and may be cancelled for weather, sea, horse-welfare or rider-safety reasons.", "The standard program is approximately two hours of riding; transfer and extended options can increase the total duration.", "Wear long trousers and closed shoes. Follow the guide's instructions at all times."],
    itinerary: ["Pickup from the confirmed Hurghada location", "Transfer to the stable · about 30 minutes", "Safety briefing and horse assignment", "Guided desert and coastal horse ride · about 2 hours", "Optional shallow-water horse experience when selected and safe", "Return transfer · about 30 minutes"],
    packageName: "Hurghada Desert and Sea Horse Ride", packageDescription: "Two-hour guided desert and coastal horse ride with Hurghada transfers, safety equipment and optional shallow-water riding when conditions allow.", packagePrice: "13.69", packageLabel: "Rider", availableTimes: ["Morning departure confirmed by WhatsApp", "Sunset departure confirmed by WhatsApp"], notSuitableFor: ["Children under 5 years", "Pregnant guests", "People with serious back problems", "People with mobility impairments", "Wheelchair users", "Riders over 110 kg unless explicitly approved by the stable"], whatToBring: ["Long trousers", "Closed shoes", "Sunscreen", "Sunglasses", "Water", "Swimwear and towel if selecting the sea option"], seoTitle: "Hurghada Desert and Sea Horse Riding with Optional Swimming", metaDescription: "Book a guided Hurghada desert and Red Sea horse ride with hotel transfers and optional shallow-water riding, priced 20% below the verified comparison fare."
  },
  {
    slug: "sahl-hasheesh-horse-riding", title: "Sahl Hasheesh Desert and Sea Horse Ride with Optional Swimming", image: "/images/hurghada-island-family-sunset.jpeg",
    // EUR 18.40 is 20% below the verified GetYourGuide EUR 23 current from price.
    price: "20.99", originalPrice: "26.24", rating: "New", reviews: "New", location: "Sahl Hasheesh, Egypt", duration: "About 2 Hours", category: "Outdoor Activity", badge: "New", bookingMode: "direct", participantPricing: { adults: 20.99 }, ageBands: { adults: "Riders (age confirmed by stable)", children: "", infants: "" },
    description: "Ride across Sahl Hasheesh desert sands and along the Red Sea shore with an experienced local guide. A shallow-water section may be included when the chosen route, weather and rider ability permit.",
    highlights: ["Sahl Hasheesh desert horse ride", "Red Sea shoreline route", "Optional shallow-water riding", "Experienced local guide", "Suitable route selected for each rider"],
    included: ["Guided desert horse ride", "Guided sea and shoreline horse ride when conditions permit", "Trained horse", "Experienced local guide", "Helmet", "Pickup and return when included in the confirmed option"],
    notIncluded: ["Gratuities", "Personal expenses", "Photography services", "Food and drinks unless stated", "Transfers outside the confirmed pickup zone"],
    notes: ["Free cancellation is available up to 24 hours before departure.", "Book at least one day before the preferred riding date.", "Provide every rider's age, approximate weight and riding experience before confirmation.", "The stable confirms the minimum age and maximum rider weight for the selected horse and route.", "Sea entry and swimming are optional and depend on weather, water conditions, rider ability and horse welfare.", "Galloping is permitted only when the guide determines that the rider, horse and terrain are suitable."],
    itinerary: ["Pickup from the confirmed location", "Transfer to the Sahl Hasheesh stable · about 30 minutes when included", "Safety briefing and horse assignment", "Guided desert and shoreline horse ride · about 2 hours", "Optional shallow-water section when safe", "Return transfer · about 30 minutes when included"],
    packageName: "Sahl Hasheesh Desert and Sea Horse Ride", packageDescription: "Approximately two hours of guided desert and shoreline horse riding with an optional shallow-water section when safe.", packagePrice: "20.99", packageLabel: "Rider", availableTimes: ["Morning departure confirmed by WhatsApp", "Sunset departure confirmed by WhatsApp"], notSuitableFor: ["Pregnant guests", "People with serious back, neck or mobility conditions", "Guests outside the stable's confirmed age or weight limits"], whatToBring: ["Long trousers", "Closed shoes", "Sunscreen", "Sunglasses", "Swimwear and towel if selecting the sea option"], seoTitle: "Sahl Hasheesh Desert and Sea Horse Ride", metaDescription: "Book a guided Sahl Hasheesh desert and Red Sea horse ride with optional shallow-water riding, priced 20% below the verified comparison fare."
  },
  {
    slug: "cairo-giza-day-trip-bus", title: "Cairo and Giza Day Trip by Bus", image: "/images/luxor-day-trip.jpg", price: "60.80", rating: "New", reviews: "New", location: "Cairo and Giza, Egypt", duration: "Full Day", category: "Cultural Day Trip", badge: "New", bookingMode: "direct", participantPricing: { adults: 60.80 },
    description: "Travel overland from Hurghada for a guided day covering the Giza pyramid complex and major Cairo highlights selected in the confirmed itinerary.", highlights: ["Giza Pyramids and Sphinx", "Egyptologist guide", "Cairo museum visit according to package", "Lunch and air-conditioned transport"], included: ["Round-trip transport from the confirmed pickup zone", "Professional guide", "Main entrance tickets stated in the quotation", "Lunch", "Required travel permits"], notIncluded: ["Entry inside pyramids unless quoted", "Drinks", "Optional Nile cruise", "Personal expenses"], notes: ["A passport or valid ID is required in advance for permits.", "This is a very long day with an early pickup and extensive driving.", "Museum choice and entrance tickets must match the final confirmation.", "Cancellation rules may be stricter after permits or tickets are issued."], availableTimes: ["Very early pickup confirmed by WhatsApp"], notSuitableFor: ["Guests unable to manage a very long travel day"], whatToBring: ["Passport or photo ID", "Comfortable shoes", "Sun protection", "Breakfast or snacks"], seoTitle: "Cairo and Giza Day Trip by Bus from Hurghada", metaDescription: "Request a guided Cairo and Giza day trip by bus from Hurghada with pyramids, Sphinx, museum, lunch and transport."
  },
  {
    slug: "cairo-day-trip-flight", title: "Cairo and Giza Day Trip by Plane", image: "/images/karnak-temple.jpg", price: "224.00", rating: "New", reviews: "New", location: "Cairo and Giza, Egypt", duration: "Full Day", category: "Cultural Day Trip", badge: "Premium", bookingMode: "direct", participantPricing: { adults: 224 },
    description: "Fly from Hurghada to Cairo for a private or small-group guided visit to the pyramids, Sphinx and selected museum highlights.", highlights: ["Domestic return flights", "Giza Pyramids and Sphinx", "Egyptologist guide", "More sightseeing time than the bus option"], included: ["Hurghada hotel and airport transfers", "Return domestic flight when quoted", "Guide", "Main admissions listed in the confirmation", "Lunch"], notIncluded: ["Extra baggage", "Entry inside pyramids unless quoted", "Drinks and personal expenses"], notes: ["Passenger names and passport details must exactly match flight documents.", "Airfare is dynamic and the price is not secured until ticketing.", "Flight changes and airline cancellation conditions apply after ticket issue.", "The final museum and itinerary are confirmed before payment."], availableTimes: ["Flight schedule confirmed before payment"], whatToBring: ["Original passport", "Comfortable shoes", "Sun protection"], seoTitle: "Cairo and Giza Day Trip by Plane from Hurghada", metaDescription: "Request a Cairo and Giza day trip by plane from Hurghada with flights, guide, pyramids, Sphinx, museum and lunch."
  },
  {
    slug: "el-gouna-city-boat-tour", title: "El Gouna City, Lagoon Boat and Tuk-Tuk Tour", image: "/images/hurghada-island-calm-sunset.jpeg", price: "36.80", rating: "New", reviews: "New", location: "El Gouna, Egypt", duration: "About 5 Hours", category: "City Tour", badge: "New", bookingMode: "direct", participantPricing: { adults: 36.80 },
    description: "Explore El Gouna's lagoons, marina and town highlights by boat and tuk-tuk, with free time according to the selected package.", highlights: ["Lagoon boat ride", "Tuk-tuk city tour", "Abu Tig Marina", "Downtown free time"], included: ["Transfer from the confirmed pickup zone", "Lagoon boat", "Tuk-tuk tour", "Local host or guide"], notIncluded: ["Meals unless quoted", "Personal shopping", "Transfers outside the confirmed zone"], notes: ["The order of boat, tuk-tuk and walking stops may change.", "Private and shared versions have different prices.", "Pickup, inclusions and cancellation terms are confirmed with your quotation."], availableTimes: ["Morning or afternoon subject to availability"], whatToBring: ["Comfortable shoes", "Sun protection", "Camera", "Cash"], seoTitle: "El Gouna City, Lagoon Boat and Tuk-Tuk Tour", metaDescription: "Request an El Gouna city tour from Hurghada with lagoon boat, tuk-tuk, marina and downtown stops."
  },
  {
    slug: "turkish-bath-spa", title: "Turkish Bath and Spa Experience", image: "/images/hero.jpg", price: "18.40", rating: "New", reviews: "New", location: "Hurghada, Egypt", duration: "About 2–3 Hours", category: "Wellness", badge: "New", bookingMode: "direct", participantPricing: { adults: 18.40 },
    description: "Relax with a hammam-style program that may combine sauna, steam, scrub, foam treatment and massage according to the chosen package.", highlights: ["Sauna and steam", "Body scrub and foam treatment", "Massage package options", "Hotel transfer when included"], included: ["Treatments listed in the confirmed package", "Towel and spa facilities", "Tea or water when provided", "Transfer in the confirmed pickup zone"], notIncluded: ["Extra treatments", "Personal products", "Transfers outside the confirmed zone"], notes: ["Treatment sequence and massage duration vary by package.", "Tell the spa about pregnancy, injuries, allergies or medical conditions before booking.", "Minimum age, privacy arrangements and cancellation terms are confirmed in advance."], availableTimes: ["Multiple appointments subject to availability"], notSuitableFor: ["Guests with medical conditions not cleared for heat or massage treatments"], whatToBring: ["Swimwear", "Dry clothes", "Any essential medication"], seoTitle: "Turkish Bath and Spa Experience in Hurghada", metaDescription: "Request a Turkish bath and spa package in Hurghada with sauna, steam, scrub, foam treatment and massage options."
  },


];
