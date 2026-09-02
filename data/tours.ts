import type { BoatOption, BookingExtra } from "@/data/speedboat-booking";
import { eurToUsd, fullDayBoatOptions, halfDayBoatOptions, refreshments, speedboatMeals } from "@/data/speedboat-booking";
import { snorkelingBoatEnglish, snorkelingBoatSlugs } from "@/data/snorkeling-boat-trips";
import { marsaAlamTourSchedules } from "@/data/tour-schedules";
import { applyTourMediaSafety } from "@/lib/tour-media-safety";
import type { DestinationSlug } from "@/lib/destinations";

export type Tour = {
  slug: string;
  /** Commercial visibility is managed separately from the CMS publishing workflow. */
  listingStatus?: "active" | "paused" | "unlisted";
  /** Destination ownership keeps tours ready for expansion beyond Hurghada. */
  destinationSlug: DestinationSlug;
  /** Authoritative catalog currency; legacy products default to USD. */
  currency?: "USD" | "EUR" | "SAR";
  /** JavaScript weekday numbers, Sunday = 0. */
  operatingWeekdays?: number[];
  bookingCutoff?: { daysBefore: number; localTime?: string; timeZone: "Africa/Cairo" | "Asia/Riyadh"; assumption?: boolean };
  fulfillmentType?: import("@/lib/tour-booking").FulfillmentType;
  departureMarina?: string;
  bookingBlocker?: string;
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
  /** Extra selectable packages shown alongside the primary one, for tours with more than one bookable option. */
  additionalPackages?: { name: string; description: string; price: string; label?: string }[];
  priceUnit?: string;
  /** Per-booking prices are charged once regardless of the passenger counter. */
  pricingMode?: "per-person" | "per-booking";
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
  /** Structured catalog placement from broad category to specific trip type. */
  categoryPath?: string[];
  badge?: "Most Popular" | "Best Value" | "New" | "Premium";
  seoTitle?: string;
  metaDescription?: string;
  faqs?: { question: string; answer: string }[];
  /** Inquiry tours are listed publicly but cannot be checked out until a verified price is configured. */
  bookingMode?: "direct" | "inquiry";
  /** Verified, contractually-fixed pricing/schedule that the admin CMS must never override, even if an editor sets these fields. */
  pricingLockedToCode?: boolean;
  boatOptions?: BoatOption[];
  entrancePricing?: { adults: number; youth: number };
  bookingExtras?: BookingExtra[];
  requiresMarinaTransferChoice?: boolean;
  bookingLeadTime?: "next-day-before-15";
  showSpeedboatTerms?: boolean;
  galleryImages?: string[];
  imageAlt?: string;
  galleryImageAlts?: string[];
  imageFocalPoint?: { x: number; y: number };
  galleryImageFocalPoints?: { x: number; y: number }[];
};



const tourCatalog: Array<Omit<Tour, "destinationSlug"> & { destinationSlug?: DestinationSlug }> = [

  {
    slug: "orange-bay",

    title: "Orange Bay Island Snorkeling Boat Trip",

    image: "/images/placeholders/sea-activity.svg",

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
      "Sail the Red Sea on a luxury boat",
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
      "Free cancellation is available up to 48 hours before the trip.",
      "Two-way pickup and transfer are included from Hurghada.",
      "Live guides are available in English, German, Arabic, Russian and French, subject to confirmation.",
      "Pickup from Makadi Bay, Soma Bay, El Gouna, Sahl Hasheesh or Safaga costs €3.75 extra per adult after discount.",
    ],
    packageName: "Orange Bay Island Snorkeling Boat Trip",
    packageDescription: "Escape to Orange Bay Island from Hurghada. Relax, swim and snorkel on a luxury boat with lunch and hotel transfers.",
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
      { question: "What is the cancellation policy?", answer: "Cancellation is free up to 48 hours before the trip. The trip must also be booked at least one day in advance." },
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

    image: "/images/placeholders/sea-activity.svg",

    price: "30",

    rating: "4.7",

    location: "Hurghada Desert",

    duration: "5 Hours",

    description:
      "Leave Hurghada for a five-hour desert safari with a quad-bike ride, camel ride and Bedouin village visit. The afternoon pickup time is confirmed by WhatsApp.",

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
    included: ["Hotel pickup", "Quad-bike ride", "Camel ride", "Bedouin village visit", "Bedouin tea"],
    notIncluded: ["Personal expenses", "Scarf and goggles if required"],
    notes: ["The exact afternoon pickup time is confirmed by WhatsApp.", "Follow the guide's safety briefing throughout the quad-bike ride.", "Bring closed shoes, sunglasses and sun protection."],
    packageName: "Hurghada Desert Safari Adventure",
    packageDescription: "A five-hour desert experience combining a quad-bike ride, camel ride and Bedouin village visit.",
    packagePrice: "30",
    packageLabel: "Per adult",
    whatToBring: ["Closed shoes", "Sunglasses", "Sun protection", "Cash for personal expenses"],
    seoTitle: "Hurghada Desert Safari with Quad Bike and Camel Ride",
    metaDescription: "Book a five-hour Hurghada desert safari with quad biking, a camel ride, Bedouin village visit, hotel pickup and local WhatsApp support.",
    faqs: [
      { question: "What activities are included in the desert safari?", answer: "The published package includes a quad-bike ride, camel ride, Bedouin village visit and Bedouin tea." },
      { question: "What time is hotel pickup?", answer: "Pickup is in the afternoon. Daily Red Sea confirms the exact time by WhatsApp after booking." },
      { question: "What should I wear for the safari?", answer: "Wear closed shoes and comfortable clothing, and bring sunglasses and sun protection." },
    ],

  },

  {
    slug: "professional-underwater-photographer",

    title: "Professional Underwater Photographer",

    image: "/images/placeholders/sea-activity.svg",

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
    image: "/images/placeholders/sea-activity.svg",
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
      "Free cancellation up to 48 hours before the activity starts",
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
      "Free cancellation is available up to 48 hours before the activity starts.",
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
    slug: "mahmya-island", title: "Mahmya Island Boat Trip", image: "/images/placeholders/sea-activity.svg", price: "75", rating: "4.9", reviews: "New", location: "Hurghada, Egypt", duration: "Full Day", category: "Island Trip", badge: "Premium",
    seoTitle: "Mahmya Island Boat Trip from Hurghada | Premium Red Sea Experience", metaDescription: "Visit Mahmya Island from Hurghada for a premium Red Sea day with crystal-clear water, white sandy beaches and memorable snorkeling.",
    description: "Discover the crystal-clear waters of Mahmya Island in the Giftun Island National Park. Relax on white sand, swim in turquoise water, and enjoy a premium island day from Hurghada.", participantPricing: { adults: 75, youth: 45, infants: 0 }, availableTimes: ["08:00"],
    highlights: ["Premium island experience", "White sandy beach", "Crystal-clear water", "Snorkeling", "Lunch", "Boat cruise", "Hotel transfers"], included: ["Hotel pickup and return", "Boat cruise", "Island entry", "Lunch", "Soft drinks"], notIncluded: ["Personal expenses", "Photos and videos"], notes: ["Pickup time is confirmed by WhatsApp.", "Bring swimwear, sunscreen, and a towel."], packageName: "Mahmya Island day trip", packageDescription: "A premium full-day island experience with pickup, boat cruise and lunch.", packagePrice: "75", packageLabel: "Per person", itinerary: ["Hotel pickup", "Boat cruise", "Mahmya beach time", "Lunch", "Return to Hurghada"],
  },
  {
    slug: "full-day-snorkeling", title: "Full Day Snorkeling Trip", image: "/images/placeholders/sea-activity.svg", price: "25", rating: "4.8", reviews: "New", location: "Hurghada, Egypt", duration: "8 Hours", category: "Snorkeling", badge: "Best Value",
    seoTitle: "Full Day Snorkeling Trip in Hurghada | Red Sea Reefs and Lunch", metaDescription: "Explore Red Sea coral reefs on a full-day snorkeling trip from Hurghada with lunch, soft drinks and hotel pickup.",
    description: "Explore beautiful local coral reefs on a full-day snorkeling adventure from Hurghada. The captain selects suitable snorkeling locations according to weather and sea conditions.", highlights: ["Two snorkeling stops", "Local Red Sea reefs", "Buffet lunch", "Soft drinks", "Hotel pickup", "Professional guide"], included: ["Hotel pickup", "Boat trip", "Snorkeling equipment", "Lunch", "Soft drinks"], notIncluded: ["Island visit", "Personal expenses"], notes: ["This trip does not include an island visit.", "Locations depend on weather and sea conditions."], packageName: "Full-day reef snorkeling", packageDescription: "A relaxed Red Sea boat day with two snorkeling stops and lunch.", packagePrice: "25", packageLabel: "Per person", participantPricing: { adults: 25, youth: 15, infants: 0 }, availableTimes: ["08:00"],
  },
  {
    slug: "full-day-diving", title: "Full Day Scuba Diving Trip", image: "/images/placeholders/sea-activity.svg", price: "55", rating: "4.8", reviews: "New", location: "Hurghada, Egypt", duration: "8 Hours", category: "Diving", badge: "Premium",
    seoTitle: "Full Day Scuba Diving Trip in Hurghada | 2 Guided Red Sea Dives", metaDescription: "Discover the Red Sea with two guided dives from Hurghada, lunch onboard, soft drinks and hotel transfers.",
    description: "Join a full-day Red Sea boat trip for certified divers with two guided dives at sites selected for the day's weather and sea conditions. Lunch, soft drinks and Hurghada hotel transfers are included.", highlights: ["Two guided dives", "Professional instructor", "Lunch onboard", "Soft drinks", "Hotel transfers", "Equipment available"], included: ["Hotel transfers", "Boat trip", "Two guided dives", "Professional instructor", "Lunch", "Soft drinks"], notIncluded: ["Diving equipment rental - available for $30", "Personal expenses"], notes: ["A valid scuba diving license is required for every diver and proof must be brought on the trip.", "Equipment is not included in the base price.", "Dive sites depend on weather and sea conditions."], packageName: "Two guided Red Sea dives", packageDescription: "A full-day boat trip with two guided dives for certified divers. Equipment can be added when booking.", packagePrice: "55", packageLabel: "Per person", participantPricing: { adults: 55, youth: 55 }, availableTimes: ["08:00"], whatToBring: ["Valid diving certification", "Passport or photo ID", "Swimwear", "Towel", "Sun protection"], notSuitableFor: ["Guests without a valid scuba-diving certification"], faqs: [{ question: "Do I need a diving certification?", answer: "Yes. This trip is for certified divers, and every diver must bring proof of a valid scuba-diving certification." }, { question: "Is diving equipment included?", answer: "No. Equipment is not included in the base price and is available to rent for $30." }, { question: "Which dive sites will we visit?", answer: "The captain selects suitable Red Sea dive sites according to the day's weather and sea conditions." }, { question: "Are lunch and hotel transfers included?", answer: "Yes. The published package includes lunch, soft drinks and Hurghada hotel transfers." }],
  },
  {
    slug: "quad-safari-morning", title: "Morning Quad Bike Safari", image: "/images/placeholders/sea-activity.svg", price: "20", rating: "4.7", reviews: "New", location: "Hurghada Desert", duration: "5 Hours", category: "Desert Safari", badge: "Best Value",
    seoTitle: "Morning Quad Bike Safari in Hurghada Desert", metaDescription: "Ride through the Eastern Desert on a morning quad bike safari from Hurghada with a Bedouin camp visit and tea.",
    description: "Start your day with a quad bike adventure through the Eastern Desert. Ride across desert tracks, take in mountain views and visit a traditional Bedouin camp.", highlights: ["Quad bike ride", "Desert adventure", "Bedouin camp", "Tea", "Mountain views"], included: ["Hotel pickup", "Quad bike ride", "Safety briefing", "Bedouin tea"], notIncluded: ["Scarf and goggles if required", "Personal expenses"], notes: ["Minimum participant age is 9 years.", "Drivers must follow the safety briefing.", "Bring sunglasses and closed shoes."], packageName: "Morning desert quad safari", packageDescription: "A morning desert ride with Bedouin camp visit. Minimum age: 9 years.", packagePrice: "20", packageLabel: "Per person", participantPricing: { adults: 20, youth: 20 }, availableTimes: ["08:00"],
  },
  {
    slug: "quad-safari-sunset", title: "Sunset Quad Bike Safari", image: "/images/placeholders/sea-activity.svg", price: "22", rating: "4.8", reviews: "New", location: "Hurghada Desert", duration: "5 Hours", category: "Desert Safari", badge: "Most Popular",
    seoTitle: "Sunset Quad Bike Safari in Hurghada Desert", metaDescription: "Experience a Hurghada desert sunset with an exciting quad bike ride, Bedouin visit and mountain panorama.",
    description: "Experience Hurghada's desert at sunset with a memorable quad biking adventure through the mountains followed by a traditional Bedouin visit.", highlights: ["Sunset ride", "Quad bike", "Bedouin camp", "Tea", "Desert panorama"], included: ["Hotel pickup", "Quad bike ride", "Safety briefing", "Bedouin tea"], notIncluded: ["Personal expenses"], notes: ["Minimum participant age is 9 years.", "Pickup is in the afternoon and varies with sunset time. We confirm the exact time by WhatsApp.", "Bring sunglasses and closed shoes."], packageName: "Sunset desert quad safari", packageDescription: "A sunset desert ride with traditional Bedouin hospitality. Minimum age: 9 years.", packagePrice: "22", packageLabel: "Per person", participantPricing: { adults: 22, youth: 22 }, availableTimes: ["Afternoon - exact pickup confirmed by WhatsApp"],
  },
  {
    slug: "hurghada-airport-transfer", title: "Hurghada Airport Private Transfer", image: "/images/placeholders/sea-activity.svg", price: "20", rating: "5.0", reviews: "New", location: "Hurghada International Airport", duration: "Flexible", category: "Airport Transfer", badge: "Best Value",
    seoTitle: "Hurghada Airport Private Transfer | Hotel Pickup and Drop-off", metaDescription: "Book a private transfer between Hurghada International Airport and your hotel with fixed pricing and reliable local drivers.",
    description: "One-way private airport transfer for a fixed $20 within Hurghada. Makadi Bay, Soma Bay, El Gouna, and Sahl Hasheesh add $7.", highlights: ["Fixed one-way fare", "Meet and greet", "Flight monitoring", "Private air-conditioned vehicle", "Automatic vehicle sizing"], included: ["Private vehicle", "Driver", "Fuel and parking"], notIncluded: ["Additional stops", "Return journey"], notes: ["1–2 passengers travel by small car with a maximum of 2 bags.", "Groups above 2 passengers receive a larger vehicle with up to 2 travel bags per person.", "Send your flight number and hotel name when booking."], packageName: "Airport one-way private transfer", packageDescription: "$20 within Hurghada; add $7 for Makadi Bay, Soma Bay, El Gouna, or Sahl Hasheesh.", packagePrice: "20", packageLabel: "Fixed one-way fare", availableTimes: ["Time confirmed from your flight details"],
  },
  {
    slug: "senzo-transfer", title: "Private Transfer To and From Senzo Mall Hurghada", image: "/images/placeholders/sea-activity.svg", price: "10", rating: "New", location: "Hurghada, Egypt", duration: "Flexible", category: "Shopping Transfer", badge: "New",
    seoTitle: "Senzo Mall Transfer from Hurghada Hotels", metaDescription: "Convenient private transfer from your Hurghada hotel to Senzo Mall for shopping, dining and entertainment.",
    description: "One-way private Senzo Mall transfer for a fixed $10 within Hurghada. Makadi Bay, Soma Bay, El Gouna, and Sahl Hasheesh add $7.", highlights: ["Fixed one-way fare", "Private vehicle", "Hotel pickup", "Flexible pickup time", "Air-conditioned car"], included: ["Private transfer", "Driver", "Fuel and parking"], notIncluded: ["Return journey", "Travel bags", "Shopping and meals"], notes: ["Maximum 4 passengers.", "Travel bags are not accepted on this service.", "Book each direction separately if you need a return journey."], packageName: "Senzo Mall one-way transfer", packageDescription: "$10 within Hurghada; add $7 for Makadi Bay, Soma Bay, El Gouna, or Sahl Hasheesh.", packagePrice: "10", packageLabel: "Fixed one-way fare", availableTimes: ["Preferred time confirmed by WhatsApp"],
  },

  {
    slug: "dolphin-house-snorkeling", title: "Dolphin House Snorkeling Boat Trip Hurghada", image: "/images/placeholders/sea-activity.svg",
    price: "25", rating: "New", reviews: "New", location: "Hurghada, Egypt", duration: "7 Hours", category: "Snorkeling", badge: "New", bookingMode: "direct",
    participantPricing: { adults: 25, youth: 15, infants: 0 }, ageBands: { adults: "Adults (ages 11+)", children: "Children (ages 4–10)", infants: "Infants (ages 0–3)" },
    description: "Set sail from Hurghada to the famous Dolphin House area, home to wild dolphins. Enjoy two coral-reef snorkeling stops, lunch and drinks aboard a comfortable boat, with hotel transfers included.",
    highlights: ["Look for wild dolphins in their natural Red Sea habitat", "Enjoy two snorkeling stops at colorful coral reefs", "Relax on a spacious boat between activities", "Enjoy a freshly prepared lunch and drinks onboard", "Travel with a professional crew and included safety equipment"],
    included: ["Hotel pickup and drop-off in Hurghada", "Luxury boat cruise", "Dolphin House visit", "Two snorkeling stops", "Snorkeling equipment", "Lunch onboard", "Water, soft drinks, tea and coffee", "Professional crew", "Life jackets and safety equipment"],
    notIncluded: ["Underwater photos", "Beach towels", "Swimwear", "Personal expenses"],
    notes: ["The supplier estimates an approximately 80% chance of seeing dolphins, but wildlife sightings and swimming are never guaranteed.", "The route and activity order may change with weather, sea conditions, dolphin presence and boat traffic.", "The exact hotel pickup time is confirmed by WhatsApp after booking."],
    itinerary: ["Pickup from your Hurghada hotel", "Transfer to the marina and boat departure", "Dolphin House · responsible dolphin watching when conditions allow", "First guided coral-reef snorkeling stop", "Lunch and drinks onboard", "Second guided coral-reef snorkeling stop", "Return cruise, marina arrival and hotel drop-off"],
    packageName: "Dolphin House Snorkeling Boat Trip", packageDescription: "Seven-hour boat trip with Dolphin House, two snorkeling stops, lunch, drinks and Hurghada hotel transfers.", packagePrice: "25", packageLabel: "Adult", availableTimes: ["Morning pickup confirmed by WhatsApp"], whatToBring: ["Passport or a copy", "Swimwear", "Beach towel", "Sunscreen", "Sunglasses and sun hat"], seoTitle: "Dolphin House Snorkeling Boat Trip from Hurghada", metaDescription: "Book a seven-hour Dolphin House boat trip from Hurghada with two snorkeling stops, lunch, drinks, equipment and hotel transfers."
  },
  {
    slug: "hula-hula-island-snorkeling", title: "Hula Hula Island Boat Trip & Snorkeling Hurghada", image: "/images/placeholders/sea-activity.svg",
    price: "25", rating: "New", reviews: "New", location: "Hurghada, Egypt", duration: "8 Hours", category: "Island Trip", badge: "New", bookingMode: "direct",
    participantPricing: { adults: 25, youth: 15, infants: 0 }, ageBands: { adults: "Adults (ages 11+)", children: "Children (ages 4–10)", infants: "Infants (ages 0–3)" },
    description: "Escape to the Red Sea on a full-day Hula Hula Island snorkeling trip from Hurghada. Cruise by luxury boat, relax for an hour on the island, explore two coral reefs and enjoy lunch and soft drinks onboard.",
    highlights: ["Relax for one hour on Hula Hula Island", "Cruise across the Red Sea on a luxury boat", "Snorkel at two vibrant coral-reef locations", "Enjoy a fresh buffet lunch and unlimited soft drinks", "Hotel pickup and return included from Hurghada"],
    included: ["Hotel pickup and drop-off in Hurghada", "Luxury boat cruise", "Hula Hula Island access", "Two snorkeling stops", "Snorkeling equipment", "Expert snorkeling guide", "Fresh buffet lunch", "Unlimited soft drinks", "Life jackets", "Onboard crew assistance"],
    notIncluded: ["Underwater photos and videos", "Beach towels", "Swimwear", "Sunscreen", "Personal expenses"],
    notes: ["The exact hotel pickup time is confirmed by WhatsApp after booking.", "Snorkeling is suitable for beginners and experienced snorkelers.", "Sea conditions may change the reef locations or order of activities."],
    itinerary: ["Pickup from your Hurghada hotel", "Transfer to the marina and luxury boat departure", "First guided snorkeling stop", "Hula Hula Island · approximately one hour of beach and swimming time", "Fresh buffet lunch and soft drinks onboard", "Second guided snorkeling stop", "Return cruise, marina arrival and hotel drop-off"],
    packageName: "Hula Hula Island Boat Trip", packageDescription: "Eight-hour island and snorkeling boat trip with two reef stops, lunch, drinks and Hurghada hotel transfers.", packagePrice: "25", packageLabel: "Adult", availableTimes: ["Morning pickup confirmed by WhatsApp"], whatToBring: ["Passport or a copy", "Swimwear", "Beach towel", "Sunscreen", "Sunglasses and sun hat"], seoTitle: "Hula Hula Island Boat Trip and Snorkeling from Hurghada", metaDescription: "Book an eight-hour Hula Hula Island boat trip from Hurghada with two snorkeling stops, lunch, drinks, equipment and hotel transfers."
  },
  {
    slug: "paradise-island", title: "Paradise Island Boat Cruise, Lunch and Snorkeling", image: "/images/placeholders/sea-activity.svg",
    // EUR 16.80 is 20% below the verified GetYourGuide EUR 21 adult price.
    price: "19.16", originalPrice: "23.95", rating: "New", reviews: "New", location: "Giftun Island, Hurghada", duration: "5–9 Hours", category: "Island Trip", badge: "New", bookingMode: "direct", participantPricing: { adults: 19.16 },
    description: "Enjoy a peaceful Paradise Island escape with a Red Sea boat cruise, snorkeling in clear water, sandy beach time and lunch.", highlights: ["Paradise Island beach stop", "Red Sea snorkeling", "Relaxing boat cruise", "Lunch during the experience", "Pickup available"], included: ["Pickup and return within the confirmed Hurghada zone", "Boat cruise and island visit", "Snorkeling equipment", "Lunch", "Guide and life jackets"], notIncluded: ["Transfers outside the confirmed pickup zone", "Personal expenses", "Professional photos"], notes: ["Free cancellation is available up to 48 hours before the trip.", "Book at least one day before the preferred trip date.", "Island timing and snorkeling sites can change with sea conditions.", "The exact pickup time is confirmed by WhatsApp.", "Child and infant prices require confirmation before booking because the supplied comparison only showed one adult."], packageName: "Paradise Island Boat Cruise", packageDescription: "Boat cruise, Paradise Island beach time, snorkeling, lunch and pickup in the confirmed Hurghada zone.", packagePrice: "19.16", packageLabel: "Adult", availableTimes: ["Morning pickup confirmed by WhatsApp"], whatToBring: ["Swimwear", "Towel", "Sunscreen", "Cash"], seoTitle: "Paradise Island Boat Cruise from Hurghada | Lunch and Snorkeling", metaDescription: "Book a Paradise Island boat cruise from Hurghada with snorkeling, beach time, lunch and pickup, priced 20% below the verified comparison fare."
  },
  {
    slug: "orange-bay-half-day-speedboat",
    title: "Orange Bay Half Day (Up to 5 Hours)",
    image: "/images/placeholders/sea-activity.svg",
    galleryImages: [],
    price: String(halfDayBoatOptions[0].price), rating: "New", reviews: "New", location: "Hurghada Marina", duration: "Up to 5 hours", category: "Speedboat Trip", badge: "New", bookingMode: "direct", pricingMode: "per-booking", priceUnit: "per private boat",
    boatOptions: halfDayBoatOptions, entrancePricing: { adults: eurToUsd(10), youth: eurToUsd(5) }, bookingExtras: [...speedboatMeals, refreshments], requiresMarinaTransferChoice: true, bookingLeadTime: "next-day-before-15", showSpeedboatTerms: true,
    description: "Experience the magic of Orange Bay in half a day with flexible departure times, snorkeling in crystal-clear water, and a private speedboat with a dedicated skipper and guide.",
    highlights: ["Flexible departure times - choose a morning or afternoon schedule", "Speedboat cruise to Orange Bay", "Soft sands and shimmering turquoise water", "Included snorkeling gear for exploring marine life", "Private boat, dedicated skipper/guide and life jackets"],
    included: ["Snorkeling equipment", "Private skipper/guide", "Life jackets", "Fuel"],
    notIncluded: ["Soft drinks, fruits and snacks", "Hotel pickup and drop-off", "Lunch", "Orange Bay Island entrance ticket - added per participant when booking"],
    notes: ["Confirmation is received at the time of booking.", "Children must be accompanied by an adult.", "This is a private activity; only your group participates.", "No same-day bookings. After 3:00 PM, next-day departures can no longer be booked.", "Recommended departure times are 8:00 AM and 2:00 PM."],
    packageName: "Private Orange Bay Half-Day Speedboat", packageDescription: "Select one private boat, participant entrance tickets, optional catering and marina transfer.", packagePrice: String(halfDayBoatOptions[0].price), packageLabel: "Private boat from", availableTimes: ["08:00", "14:00"], ageBands: { adults: "Adults - Orange Bay entrance €10 each", children: "Children - Orange Bay entrance €5 each", infants: "" },
    seoTitle: "Orange Bay Half-Day Private Speedboat from Hurghada", metaDescription: "Book a private half-day Orange Bay speedboat from Hurghada with flexible departures, snorkeling equipment and selectable boat options."
  },
  {
    slug: "orange-bay-full-day-speedboat",
    listingStatus: "unlisted",
    title: "Orange Bay Full Day (Up to 9 Hours)",
    image: "/images/placeholders/sea-activity.svg",
    galleryImages: [],
    price: String(fullDayBoatOptions[0].price), rating: "New", reviews: "New", location: "Hurghada Marina", duration: "Up to 9 hours", category: "Speedboat Trip", badge: "Premium", bookingMode: "direct", pricingMode: "per-booking", priceUnit: "per private boat",
    boatOptions: fullDayBoatOptions, entrancePricing: { adults: eurToUsd(10), youth: eurToUsd(5) }, bookingExtras: [...speedboatMeals, refreshments], requiresMarinaTransferChoice: true, showSpeedboatTerms: true,
    description: "Spend a full day at Orange Bay on a private Bullet speedboat with snorkeling equipment, an expert captain/guide and life jackets. Your boat waits while you enjoy the island at your own pace.",
    highlights: ["Fabulous Beach", "Reliable Services", "Restaurant", "Children Area", "Colorful reef snorkeling with equipment included", "Private boat stays with your group throughout the day", "Optional lunch packages"],
    included: ["Snorkeling equipment", "Private skipper/guide", "Life jackets", "Fuel"],
    notIncluded: ["Soft drinks, bottled water, fruits and snacks unless selected", "Lunch unless selected", "Hotel pickup and drop-off", "Orange Bay Island entrance ticket - added per participant when booking"],
    notes: ["Confirmation is received at the time of booking.", "Children must be accompanied by an adult.", "This is a private speedboat activity; only your group participates.", "Recommended departure is between 8:00 AM and 11:00 AM.", "The latest return time is 6:30 PM."],
    packageName: "Private Orange Bay Full-Day Speedboat", packageDescription: "Select one private boat, participant entrance tickets, optional catering and marina transfer.", packagePrice: String(eurToUsd(150)), packageLabel: "Private boat from", availableTimes: ["08:00", "09:00", "10:00", "11:00"], ageBands: { adults: "Adults - Orange Bay entrance €10 each", children: "Children - Orange Bay entrance €5 each", infants: "" },
    seoTitle: "Orange Bay Full-Day Private Speedboat from Hurghada", metaDescription: "Book a private full-day Orange Bay Bullet speedboat with selectable boats, snorkeling gear and optional catering."
  },
  {
    slug: "paradise-island-speedboat",
    title: "Paradise Island (Duration Up To 5 Hours)",
    image: "/images/placeholders/sea-activity.svg",
    galleryImages: [],
    price: String(halfDayBoatOptions[0].price), rating: "New", reviews: "New", location: "Hurghada New Marina", duration: "Up to 5 hours", category: "Speedboat Trip", badge: "New", bookingMode: "direct", pricingMode: "per-booking", priceUnit: "per private boat",
    boatOptions: halfDayBoatOptions, entrancePricing: { adults: eurToUsd(20), youth: eurToUsd(10) }, bookingExtras: [refreshments, { id: "open-buffet", label: "Open Buffet", price: eurToUsd(15), unit: "person" }], requiresMarinaTransferChoice: true, showSpeedboatTerms: true,
    description: "Discover Paradise Island on a private half-day speedboat tour with white sand, turquoise water, coral-reef snorkeling and an optional beach buffet meal.",
    highlights: ["Flexible Schedule", "Custom Requests", "Local Guidance", "Private speedboat ride", "Coral-reef snorkeling", "Two hours of Paradise Island beach use"],
    included: ["Snorkeling equipment", "Private skipper/guide", "Life jackets", "Fuel"],
    notIncluded: ["Soft drinks, fruits and snacks unless selected", "Hotel pickup and drop-off", "Lunch unless selected", "Paradise Island entrance ticket - added per participant when booking"],
    notes: ["Confirmation is received at the time of booking.", "Children must be accompanied by an adult.", "This is a private activity; only your group participates.", "Alcoholic beverages are not available on the island."],
    itinerary: ["Hurghada New Marina · Speedboat departure", "Red Sea · Snorkeling stop", "Paradise Island · Beach use (2 hours)", "Return to Hurghada New Marina"],
    packageName: "Private Paradise Island Speedboat", packageDescription: "Select one private boat, participant island entrance, optional refreshments or buffet, and marina transfer.", packagePrice: String(halfDayBoatOptions[0].price), packageLabel: "Private boat from", availableTimes: ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00"], ageBands: { adults: "Adults - Paradise Island entrance €20 each", children: "Children - Paradise Island entrance €10 each", infants: "" },
    seoTitle: "Paradise Island Private Speedboat from Hurghada", metaDescription: "Book a private five-hour Paradise Island speedboat with snorkeling, beach use and optional buffet."
  },
  {
    slug: "hula-hula-speedboat",
    title: "Hula Hula (Duration Up To 5 Hours)",
    image: "/images/placeholders/sea-activity.svg",
    galleryImages: [],
    price: String(halfDayBoatOptions[0].price), rating: "New", reviews: "New", location: "Hurghada Marina", duration: "Up to 5 hours", category: "Speedboat Trip", badge: "New", bookingMode: "direct", pricingMode: "per-booking", priceUnit: "per private boat",
    boatOptions: halfDayBoatOptions, entrancePricing: { adults: eurToUsd(10), youth: eurToUsd(5) }, bookingExtras: [refreshments, { id: "open-buffet", label: "Include lunch - Open Buffet", price: eurToUsd(15), unit: "person" }], showSpeedboatTerms: true,
    description: "Visit Hula Hula Island by private speedboat for white sand, clear water, sun loungers, snorkeling, beach activities, live music and a family-friendly beach bar atmosphere.",
    highlights: ["Private island a short ride from Hurghada", "White sand and clear Red Sea water", "Sun loungers and beach activities", "Snorkeling, live music and beach bar", "Suitable for couples, families and groups"],
    included: ["Snorkeling equipment", "Private skipper/guide", "Life jackets", "Fuel"],
    notIncluded: ["Soft drinks unless selected", "Hotel pickup and drop-off", "Lunch unless selected", "Hula Hula Island entrance ticket - added per participant when booking"],
    notes: ["Confirmation is received at the time of booking.", "Children must be accompanied by an adult.", "This is a private activity; only your group participates.", "Alcoholic beverages are not available on the island.", "Lunch can be added as an Open Buffet option."],
    itinerary: ["Hurghada Marina · Private speedboat departure", "Red Sea · Snorkeling stop", "Hula Hula Island · Beach use (2 hours)", "Return to Hurghada Marina"],
    packageName: "Private Hula Hula Speedboat", packageDescription: "Select one private boat, participant island entrance and optional refreshments or buffet lunch.", packagePrice: String(halfDayBoatOptions[0].price), packageLabel: "Private boat from", availableTimes: ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00"], ageBands: { adults: "Adults - Hula Hula entrance €10 each", children: "Children - Hula Hula entrance €5 each", infants: "" },
    seoTitle: "Hula Hula Island Private Speedboat from Hurghada", metaDescription: "Book a private Hula Hula Island speedboat with snorkeling, beach use and optional buffet lunch."
  },
  {
    slug: "magawish-speedboat", listingStatus: "unlisted", title: "Orange Bay and Magawish Speedboat Trip", image: "/images/placeholders/sea-activity.svg",
    galleryImages: [],
    price: String(halfDayBoatOptions[0].price), rating: "New", reviews: "New", location: "Hurghada Marina", duration: "Approximately 4 Hours", category: "Speedboat Trip", badge: "Premium", bookingMode: "direct", pricingMode: "per-booking", priceUnit: "per private boat",
    boatOptions: halfDayBoatOptions, entrancePricing: { adults: eurToUsd(10) + 10, youth: eurToUsd(5) + 10 }, bookingExtras: [...speedboatMeals, refreshments], requiresMarinaTransferChoice: true, bookingLeadTime: "next-day-before-15", showSpeedboatTerms: true,
    description: "Explore Orange Bay and Magawish on one private speedboat trip from Hurghada. Choose the boat that fits your group, stop to snorkel at a Red Sea reef and enjoy island time with optional catering and marina transfer.",
    highlights: ["Private speedboat reserved for your group", "Orange Bay and Magawish island stops", "Coral-reef snorkeling with equipment", "Eight boat sizes for groups of up to nine", "Optional meals, refreshments and marina transfer"],
    included: ["Selected private speedboat", "Experienced skipper/guide", "Fuel", "Snorkeling stop and equipment", "Life jackets and safety equipment"],
    notIncluded: ["Orange Bay entrance (€10 per adult or €5 per child) and Magawish entrance ($10 per person) — added during booking", "Food and refreshments unless selected", "Hotel pickup and drop-off unless selected", "Personal expenses", "Professional photography or videos"],
    notes: ["Choose one boat according to your group size; capacity is enforced during booking.", "Children must be accompanied by an adult.", "No same-day bookings. After 3:00 PM, next-day departures can no longer be booked.", "The route and stop order may change with sea conditions.", "Bring a passport or copy for every passenger."],
    itinerary: ["Hurghada Marina · private speedboat departure", "Red Sea · guided coral-reef snorkeling stop", "Orange Bay · island time", "Magawish Island · free time", "Private speedboat return to Hurghada Marina"],
    packageName: "Private Orange Bay and Magawish Speedboat", packageDescription: "Select a private boat, participant island entrances, optional catering and marina transfer.", packagePrice: String(halfDayBoatOptions[0].price), packageLabel: "Private boat from", availableTimes: ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00"], ageBands: { adults: "Adults — Orange Bay €10 + Magawish $10 entrance", children: "Children — Orange Bay €5 + Magawish $10 entrance", infants: "" }, whatToBring: ["Passport or a copy", "Swimwear", "Towel", "Sunscreen", "Sunglasses", "Sun hat"],
    seoTitle: "Orange Bay and Magawish Private Speedboat Hurghada", metaDescription: "Book a private Orange Bay and Magawish speedboat trip from Hurghada with selectable boats, reef snorkeling, island time and optional catering."
  },
  {
    slug: "royal-seascope-submarine", listingStatus: "active", title: "Hurghada Glass-Bottom Boat and Snorkeling Trip", image: "/images/owned/hurghada-glass-bottom-boat.jpg", price: "25", rating: "New", reviews: "New", location: "Hurghada Marina", duration: "2.5 Hours", category: "Family Sea Activity", badge: "New", bookingMode: "direct", priceUnit: "per person", departureMarina: "Hurghada Marina", participantPricing: { adults: 25, youth: 12.5, infants: 0 }, ageBands: { adults: "Adults — $25", children: "Children — 50% of the adult price ($12.50)", infants: "Infants — free" },
    description: "Depart from Hurghada Marina for a 2.5-hour glass-bottom boat trip combining panoramic views of the Red Sea reef with a 30-minute snorkeling stop.",
    highlights: ["Four daily departures", "45 minutes exploring through panoramic glass windows", "30-minute snorkeling stop", "Family-friendly 2.5-hour trip", "Departs directly from Hurghada Marina"],
    included: ["2.5-hour glass-bottom boat trip", "45-minute glass-bottom reef viewing experience", "30-minute snorkeling stop"],
    notIncluded: ["Hotel pickup and drop-off — available for an extra charge", "Food and drinks", "Personal expenses"],
    notes: ["Meet at Hurghada Marina; the boat trip starts from the marina.", "Hotel transfer is not included and can be arranged for an extra charge.", "Child tickets cost 50% of the adult price. Infants travel free.", "Exact child and infant age eligibility is confirmed before booking.", "The route, snorkeling access and underwater visibility depend on weather, sea conditions and crew safety instructions."],
    packageName: "Hurghada Glass-Bottom Boat Trip", packageDescription: "A 2.5-hour marina departure with panoramic glass-bottom reef viewing and a snorkeling stop.", packagePrice: "25", packageLabel: "Adult",
    availableTimes: ["09:00", "10:30", "12:30", "15:00"],
    itinerary: ["Meet at Hurghada Marina", "Boat journey to the viewing site (30 minutes)", "Explore the reef through the glass-bottom viewing area (45 minutes)", "Snorkeling stop (30 minutes)", "Return to Hurghada Marina"],
    notSuitableFor: ["Guests unable to use the stairs to the glass-bottom viewing area without assistance", "Guests who cannot enter or leave the water safely for the snorkeling stop"],
    whatToBring: ["Swimwear", "Towel", "Sunscreen", "Sunglasses", "Camera"],
    faqs: [{ question: "Is hotel transfer included?", answer: "No. The trip starts from Hurghada Marina. Hotel transfer can be arranged for an extra charge." }, { question: "How much do children and infants pay?", answer: "Children pay 50% of the $25 adult price ($12.50), and infants travel free. Exact age eligibility is confirmed before booking." }, { question: "How long is the glass-bottom viewing experience?", answer: "The trip includes approximately 45 minutes exploring the reef through the glass-bottom viewing area, plus a 30-minute snorkeling stop." }],
    seoTitle: "Hurghada Glass-Bottom Boat Trip with Snorkeling", metaDescription: "Book a 2.5-hour Hurghada glass-bottom boat trip from the marina with 45 minutes of reef viewing, a 30-minute snorkeling stop and four daily departures."
  },
  {
    slug: "beginner-scuba-diving", title: "Beginner Scuba Diving Experience", image: "/images/placeholders/sea-activity.svg", price: "24.00", rating: "New", reviews: "New", location: "Hurghada, Egypt", duration: "Full Day", category: "Diving", badge: "New", bookingMode: "direct", participantPricing: { adults: 24 },
    description: "Try scuba diving under direct instructor supervision, with a briefing, equipment and introductory dives at suitable Red Sea sites.", highlights: ["No diving license required", "Instructor supervision", "Introductory Red Sea dives", "Lunch onboard"], included: ["Hotel transfer in the confirmed zone", "Boat trip", "Diving instructor", "Standard diving equipment", "Lunch and soft drinks"], notIncluded: ["Medical clearance if required", "Photos", "Transfers outside Hurghada until quoted"], notes: ["A health questionnaire is required before diving.", "Minimum age and dive depth depend on the certified dive centre's rules.", "Guests must follow the instructor and may be refused for medical or safety reasons.", "Free cancellation is available up to 48 hours before the trip."], availableTimes: ["Morning pickup confirmed by WhatsApp"], notSuitableFor: ["Pregnant guests", "Guests with unapproved serious heart, lung or ear conditions"], whatToBring: ["Swimwear", "Towel", "Passport or photo ID", "Sunscreen"], seoTitle: "Beginner Scuba Diving Experience in Hurghada", metaDescription: "Request a supervised beginner scuba diving day in Hurghada with equipment, instructor, boat trip and lunch."
  },
  {
    slug: "padi-open-water-course", title: "3-Day PADI Open Water Diving Course", image: "/images/placeholders/sea-activity.svg",
    // Catalog prices use USD as the site base currency. At the configured EUR
    // conversion rate, USD 342.20 displays as approximately EUR 300.
    price: "342.20", rating: "New", reviews: "New", location: "Hurghada, Egypt", duration: "3 Days", category: "Diving", badge: "New", bookingMode: "direct", participantPricing: { adults: 342.20 }, ageBands: { adults: "Students (ages 10+)", children: "", infants: "" },
    description: "Build essential scuba skills through theory lessons and supervised Red Sea training dives during a three-day PADI Open Water course. Certification is awarded only after successful completion of all required knowledge and water skills.",
    highlights: ["Three-day internationally recognized PADI course", "Two supervised dives per day", "Theory lessons and practical open-water skills", "PADI-certified instructor", "Red Sea reef and marine-life training environment"],
    included: ["Three-day PADI course with two dives per day", "PADI-certified instructor", "Weight belt and 12-litre tanks", "Complete standard diving equipment", "Lunch each course day", "Mineral water, soft drinks, tea and coffee", "Pickup and return within the confirmed hotel zone"],
    notIncluded: ["PADI training materials and certification registration (€100 per person, paid separately)", "Marine tax (€5 per person per day; €15 for three days)", "Tips", "Photos", "Flights", "Egypt visa", "Hotel accommodation", "Medical examination if required"],
    notes: ["The €300 course price excludes the separate €100 PADI training-materials and certification-registration charge.", "Free cancellation is available up to 48 hours before the course starts.", "The course starts at 8:00 AM on the first day; daily pickup times are confirmed by WhatsApp.", "A medical questionnaire and adequate swimming ability are required.", "Children under 18 require signed parental approval.", "Course completion and certification depend on successfully meeting PADI knowledge and water-skill requirements.", "Do not fly until the dive centre's required no-fly interval has passed after the final dive.", "Alcohol and drugs are not allowed."],
    packageName: "3-Day PADI Open Water Course", packageDescription: "Three days of theory and practical training with two dives per day, equipment, instructor, lunches, drinks and hotel transfers. The separate €100 PADI training-materials and certification charge is excluded.", packagePrice: "342.20", packageLabel: "Student", availableTimes: ["08:00"], notSuitableFor: ["Children under 10 years", "Pregnant guests", "People with serious back problems", "People with heart problems", "Guests who cannot meet the medical and swimming requirements"], whatToBring: ["Passport or ID card", "Towel", "Camera", "Sunglasses", "Swimwear"], seoTitle: "3-Day PADI Open Water Diving Course in Hurghada", metaDescription: "Book a three-day PADI Open Water course in Hurghada for €300, excluding the separate €100 training-materials and certification charge."
  },
  {
    slug: "ssi-open-water-course", title: "3-Day SSI Open Water Diver Course", image: "/images/placeholders/sea-activity.svg",
    // Same EUR 300 course price as the equivalent PADI course, converted from
    // the site's USD base currency at the configured EUR rate.
    price: "342.20", rating: "New", reviews: "New", location: "Hurghada, Egypt", duration: "3 Days", category: "Diving", badge: "New", bookingMode: "direct", participantPricing: { adults: 342.20 }, ageBands: { adults: "Students (ages 10+)", children: "", infants: "" },
    description: "Learn the knowledge and water skills needed to become an SSI Open Water Diver through digital theory, confined-water practice and supervised Red Sea training dives. Certification is awarded only after successful completion of all SSI requirements.",
    highlights: ["Three-day SSI Open Water Diver program", "Digital learning and practical water training", "Two supervised dives per day", "SSI-certified diving professional", "Red Sea reef and marine-life training environment"],
    included: ["Three-day SSI Open Water Diver training with two dives per day", "SSI-certified diving professional", "Weight belt and 12-litre tanks", "Complete standard diving equipment", "Lunch each course day", "Mineral water, soft drinks, tea and coffee", "Pickup and return within the confirmed hotel zone"],
    notIncluded: ["SSI digital training materials and certification registration (€100 per person, paid separately)", "Marine tax (€5 per person per day; €15 for three days)", "Tips", "Photos", "Flights", "Egypt visa", "Hotel accommodation", "Medical examination if required", "Any specialty training or additional dives outside the Open Water Diver program"],
    notes: ["The €300 course price excludes the separate €100 SSI digital training-materials and certification-registration charge.", "Free cancellation is available up to 48 hours before the course starts.", "The course starts at 8:00 AM on the first day; daily pickup times are confirmed by WhatsApp.", "A medical questionnaire and adequate swimming ability are required.", "Students must be at least 10 years old; anyone under 18 requires signed parental or guardian approval.", "Course completion and certification depend on successfully meeting all SSI knowledge and water-skill requirements.", "Junior certification depth and supervision limits apply to younger students according to current SSI standards and the training centre's assessment.", "Do not fly until the dive centre's required no-fly interval has passed after the final dive.", "Alcohol and drugs are not allowed."],
    packageName: "3-Day SSI Open Water Diver Course", packageDescription: "Three days of digital theory and practical training with two dives per day, equipment, professional instruction, lunches, drinks and hotel transfers. The separate €100 SSI training-materials and certification charge is excluded.", packagePrice: "342.20", packageLabel: "Student", availableTimes: ["08:00"], notSuitableFor: ["Children under 10 years", "Pregnant guests", "People with serious back problems", "People with heart problems", "Guests who cannot meet the medical and swimming requirements"], whatToBring: ["Passport or ID card", "Towel", "Camera", "Sunglasses", "Swimwear"], seoTitle: "3-Day SSI Open Water Diver Course in Hurghada", metaDescription: "Book a three-day SSI Open Water Diver course in Hurghada for €300, excluding the separate €100 training-materials and certification charge."
  },
  {
    slug: "super-safari", title: "Hurghada Super Safari with Quad, Camel and Dinner", image: "/images/placeholders/sea-activity.svg", price: "18.40", rating: "New", reviews: "New", location: "Hurghada Desert", duration: "About 7 Hours", category: "Desert Safari", badge: "New", bookingMode: "direct", participantPricing: { adults: 18.40 },
    description: "A longer desert program combining quad biking, a Bedouin village visit, camel riding, sunset views and an evening meal or show.", highlights: ["Quad bike ride", "Camel experience", "Bedouin village", "Sunset, dinner and entertainment"], included: ["Hotel transfer in the confirmed zone", "Safety briefing and quad ride", "Camel ride", "Bedouin tea", "Dinner when included in the selected package"], notIncluded: ["Scarf and goggles", "Transfers outside Hurghada until quoted", "Personal expenses"], notes: ["Drivers must meet the operator's minimum age and safety rules.", "Pregnant guests and people with serious back problems should not ride.", "Exact route, dinner and show inclusions are confirmed with the package.", "Pickup time changes seasonally."], availableTimes: ["Afternoon pickup confirmed by WhatsApp"], notSuitableFor: ["Pregnant guests", "People with serious back, neck or mobility conditions"], whatToBring: ["Closed shoes", "Sunglasses", "Scarf", "Warm layer in winter"], seoTitle: "Hurghada Super Safari with Quad Bike, Camel and Dinner", metaDescription: "Request a Hurghada super safari with quad biking, camel ride, Bedouin village, sunset and dinner."
  },
  {
    slug: "desert-stargazing", title: "Desert Stargazing, Camel Ride and Dinner", image: "/images/placeholders/sea-activity.svg", price: "27.20", rating: "New", reviews: "New", location: "Hurghada Desert", duration: "About 6 Hours", category: "Desert Safari", badge: "New", bookingMode: "direct", participantPricing: { adults: 27.20 },
    description: "Travel into the Eastern Desert for sunset, a short camel experience, Bedouin-style dinner and guided observation of the night sky.", highlights: ["Desert sunset", "Camel experience", "Bedouin dinner", "Telescope stargazing when conditions allow"], included: ["Hotel transfer in the confirmed zone", "Desert guide", "Camel ride", "Dinner and hot drink", "Telescope session when available"], notIncluded: ["Transfers outside Hurghada until quoted", "Personal expenses", "Professional astronomy photography"], notes: ["Stars and telescope visibility depend on clouds, moonlight and weather.", "The route may use a jeep or van according to the selected package.", "Free cancellation is available up to 48 hours before the trip."], availableTimes: ["Afternoon pickup varies by sunset"], whatToBring: ["Closed shoes", "Warm layer", "Water", "Camera"], seoTitle: "Hurghada Desert Stargazing with Camel Ride and Dinner", metaDescription: "Request a Hurghada desert stargazing evening with sunset, camel ride, Bedouin dinner and telescope observation."
  },
  {
    slug: "horse-riding-sea-desert", title: "Hurghada Desert and Sea Horse Riding with Optional Swimming", image: "/images/hurghada-island-family-sunset.jpeg",
    // EUR 12 is 20% below the verified GetYourGuide EUR 15 current from price.
    price: "13.69", originalPrice: "17.11", rating: "New", reviews: "New", location: "Hurghada, Egypt", duration: "2–4 Hours", category: "Outdoor Activity", badge: "New", bookingMode: "direct", participantPricing: { adults: 13.69 }, ageBands: { adults: "Riders (ages 5+)", children: "", infants: "" },
    description: "Explore golden desert trails and the Red Sea coast on a guided horse ride suitable for beginners and experienced riders. Optional shallow-water riding or swimming with the horse is available only with the selected route and safe conditions.",
    highlights: ["Desert and Red Sea coastal trails", "Optional shallow-water horse experience", "Professional local guide", "Routes for different riding abilities", "Small-group experience"],
    included: ["Guided horse-riding experience", "Well-trained horse matched to the rider", "English-speaking guide or instructor", "Helmet and available safety equipment", "Bottled water", "Hotel pickup and return within Hurghada"],
    notIncluded: ["Gratuities", "Personal expenses", "Professional photography unless stated in the confirmed option", "Pickup outside Hurghada, including Makadi Bay, Sahl Hasheesh, El Gouna, Soma Bay and Safaga, unless quoted", "Lunch and extended six-hour program unless selected"],
    notes: ["Free cancellation is available up to 48 hours before departure.", "Book at least one day before the preferred riding date.", "Provide every rider's age, approximate weight and experience before confirmation so the stable can assign a suitable horse.", "Swimming or riding in the sea is optional, route-dependent and may be cancelled for weather, sea, horse-welfare or rider-safety reasons.", "The standard program is approximately two hours of riding; transfer and extended options can increase the total duration.", "Wear long trousers and closed shoes. Follow the guide's instructions at all times."],
    itinerary: ["Pickup from the confirmed Hurghada location", "Transfer to the stable · about 30 minutes", "Safety briefing and horse assignment", "Guided desert and coastal horse ride · about 2 hours", "Optional shallow-water horse experience when selected and safe", "Return transfer · about 30 minutes"],
    packageName: "Hurghada Desert and Sea Horse Ride", packageDescription: "Two-hour guided desert and coastal horse ride with Hurghada transfers, safety equipment and optional shallow-water riding when conditions allow.", packagePrice: "13.69", packageLabel: "Rider", availableTimes: ["Morning departure confirmed by WhatsApp", "Sunset departure confirmed by WhatsApp"], notSuitableFor: ["Children under 5 years", "Pregnant guests", "People with serious back problems", "People with mobility impairments", "Wheelchair users", "Riders over 110 kg unless explicitly approved by the stable"], whatToBring: ["Long trousers", "Closed shoes", "Sunscreen", "Sunglasses", "Water", "Swimwear and towel if selecting the sea option"], seoTitle: "Hurghada Desert and Sea Horse Riding with Optional Swimming", metaDescription: "Book a guided Hurghada desert and Red Sea horse ride with hotel transfers and optional shallow-water riding, priced 20% below the verified comparison fare."
  },
  {
    slug: "sahl-hasheesh-horse-riding", listingStatus: "unlisted", title: "Sahl Hasheesh Desert and Sea Horse Ride with Optional Swimming", image: "/images/placeholders/sea-activity.svg",
    // EUR 18.40 is 20% below the verified GetYourGuide EUR 23 current from price.
    price: "20.99", originalPrice: "26.24", rating: "New", reviews: "New", location: "Sahl Hasheesh, Egypt", duration: "About 2 Hours", category: "Outdoor Activity", badge: "New", bookingMode: "direct", participantPricing: { adults: 20.99 }, ageBands: { adults: "Riders (age confirmed by stable)", children: "", infants: "" },
    description: "Ride across Sahl Hasheesh desert sands and along the Red Sea shore with an experienced local guide. A shallow-water section may be included when the chosen route, weather and rider ability permit.",
    highlights: ["Sahl Hasheesh desert horse ride", "Red Sea shoreline route", "Optional shallow-water riding", "Experienced local guide", "Suitable route selected for each rider"],
    included: ["Guided desert horse ride", "Guided sea and shoreline horse ride when conditions permit", "Trained horse", "Experienced local guide", "Helmet", "Pickup and return when included in the confirmed option"],
    notIncluded: ["Gratuities", "Personal expenses", "Photography services", "Food and drinks unless stated", "Transfers outside the confirmed pickup zone"],
    notes: ["Free cancellation is available up to 48 hours before departure.", "Book at least one day before the preferred riding date.", "Provide every rider's age, approximate weight and riding experience before confirmation.", "The stable confirms the minimum age and maximum rider weight for the selected horse and route.", "Sea entry and swimming are optional and depend on weather, water conditions, rider ability and horse welfare.", "Galloping is permitted only when the guide determines that the rider, horse and terrain are suitable."],
    itinerary: ["Pickup from the confirmed location", "Transfer to the Sahl Hasheesh stable · about 30 minutes when included", "Safety briefing and horse assignment", "Guided desert and shoreline horse ride · about 2 hours", "Optional shallow-water section when safe", "Return transfer · about 30 minutes when included"],
    packageName: "Sahl Hasheesh Desert and Sea Horse Ride", packageDescription: "Approximately two hours of guided desert and shoreline horse riding with an optional shallow-water section when safe.", packagePrice: "20.99", packageLabel: "Rider", availableTimes: ["Morning departure confirmed by WhatsApp", "Sunset departure confirmed by WhatsApp"], notSuitableFor: ["Pregnant guests", "People with serious back, neck or mobility conditions", "Guests outside the stable's confirmed age or weight limits"], whatToBring: ["Long trousers", "Closed shoes", "Sunscreen", "Sunglasses", "Swimwear and towel if selecting the sea option"], seoTitle: "Sahl Hasheesh Desert and Sea Horse Ride", metaDescription: "Book a guided Sahl Hasheesh desert and Red Sea horse ride with optional shallow-water riding, priced 20% below the verified comparison fare."
  },
  {
    slug: "cairo-giza-day-trip-bus", title: "Cairo and Giza Day Trip by Bus", image: "/images/placeholders/sea-activity.svg", price: "60.80", rating: "New", reviews: "New", location: "Cairo and Giza, Egypt", duration: "Full Day", category: "Cultural Day Trip", badge: "New", bookingMode: "direct", participantPricing: { adults: 60.80 },
    description: "Travel overland from Hurghada for a guided day covering the Giza pyramid complex and major Cairo highlights selected in the confirmed itinerary.", highlights: ["Giza Pyramids and Sphinx", "Egyptologist guide", "Cairo museum visit according to package", "Lunch and air-conditioned transport"], included: ["Round-trip transport from the confirmed pickup zone", "Professional guide", "Main entrance tickets stated in the quotation", "Lunch", "Required travel permits"], notIncluded: ["Entry inside pyramids unless quoted", "Drinks", "Optional Nile cruise", "Personal expenses"], notes: ["A passport or valid ID is required in advance for permits.", "This is a very long day with an early pickup and extensive driving.", "Museum choice and entrance tickets must match the final confirmation.", "Free cancellation is available up to 48 hours before the trip."], availableTimes: ["Very early pickup confirmed by WhatsApp"], notSuitableFor: ["Guests unable to manage a very long travel day"], whatToBring: ["Passport or photo ID", "Comfortable shoes", "Sun protection", "Breakfast or snacks"], seoTitle: "Cairo and Giza Day Trip by Bus from Hurghada", metaDescription: "Request a guided Cairo and Giza day trip by bus from Hurghada with pyramids, Sphinx, museum, lunch and transport."
  },
  {
    slug: "cairo-day-trip-flight", listingStatus: "unlisted", title: "Cairo and Giza Day Trip by Plane", image: "/images/placeholders/sea-activity.svg", price: "224.00", rating: "New", reviews: "New", location: "Cairo and Giza, Egypt", duration: "Full Day", category: "Cultural Day Trip", badge: "Premium", bookingMode: "direct", participantPricing: { adults: 224 },
    description: "Fly from Hurghada to Cairo for a private or small-group guided visit to the pyramids, Sphinx and selected museum highlights.", highlights: ["Domestic return flights", "Giza Pyramids and Sphinx", "Egyptologist guide", "More sightseeing time than the bus option"], included: ["Hurghada hotel and airport transfers", "Return domestic flight when quoted", "Guide", "Main admissions listed in the confirmation", "Lunch"], notIncluded: ["Extra baggage", "Entry inside pyramids unless quoted", "Drinks and personal expenses"], notes: ["Passenger names and passport details must exactly match flight documents.", "Airfare is dynamic and the price is not secured until ticketing.", "Flight changes and airline cancellation conditions apply after ticket issue.", "The final museum and itinerary are confirmed before payment."], availableTimes: ["Flight schedule confirmed before payment"], whatToBring: ["Original passport", "Comfortable shoes", "Sun protection"], seoTitle: "Cairo and Giza Day Trip by Plane from Hurghada", metaDescription: "Request a Cairo and Giza day trip by plane from Hurghada with flights, guide, pyramids, Sphinx, museum and lunch."
  },
  {
    slug: "el-gouna-city-boat-tour", listingStatus: "unlisted", title: "El Gouna City, Lagoon Boat and Tuk-Tuk Tour", image: "/images/placeholders/sea-activity.svg", price: "36.80", rating: "New", reviews: "New", location: "El Gouna, Egypt", duration: "About 5 Hours", category: "City Tour", badge: "New", bookingMode: "direct", participantPricing: { adults: 36.80 },
    description: "Explore El Gouna's lagoons, marina and town highlights by boat and tuk-tuk, with free time according to the selected package.", highlights: ["Lagoon boat ride", "Tuk-tuk city tour", "Abu Tig Marina", "Downtown free time"], included: ["Transfer from the confirmed pickup zone", "Lagoon boat", "Tuk-tuk tour", "Local host or guide"], notIncluded: ["Meals unless quoted", "Personal shopping", "Transfers outside the confirmed zone"], notes: ["The order of boat, tuk-tuk and walking stops may change.", "Private and shared versions have different prices.", "Pickup and inclusions are confirmed with your quotation. Free cancellation is available up to 48 hours before the trip."], availableTimes: ["Morning or afternoon subject to availability"], whatToBring: ["Comfortable shoes", "Sun protection", "Camera", "Cash"], seoTitle: "El Gouna City, Lagoon Boat and Tuk-Tuk Tour", metaDescription: "Request an El Gouna city tour from Hurghada with lagoon boat, tuk-tuk, marina and downtown stops."
  },
  {
    slug: "turkish-bath-spa", title: "Turkish Hammam and Spa Experience", image: "/images/owned/turkish-hammam-spa.jpg", currency: "EUR", price: "25", priceUnit: "per person", rating: "New", reviews: "New", location: "Hurghada, Egypt", duration: "60–120 Minutes", category: "Wellness", badge: "New", bookingMode: "direct", participantPricing: { adults: 25 },
    packageName: "Turkish Hammam Ritual – 120 Minutes", packageDescription: "About This Treatment: An authentic Turkish hammam designed to revive body and spirit. After the sauna, steam, and jacuzzi, a loofah scrub with Moroccan soap clears away toxins. The indulgent foam scrub enhances circulation and leaves the skin soft and luminous. A soothing full-body massage and a nourishing face mask provide the perfect finish to this revitalizing ritual. Features & Highlights: sauna, steam, and jacuzzi circuit; traditional loofah and Moroccan soap cleansing; luxurious foam scrub ritual; full-body massage for tension release; refreshing face mask.", packagePrice: "50", packageLabel: "Per person, 120 minutes",
    additionalPackages: [
      { name: "Relaxing Massage – 60 Minutes", description: "About This Treatment: The classic massage for relaxation and renewal. Swedish massage uses long, flowing strokes, kneading, and circular motions to release tension and improve circulation. It's the all-purpose technique for stress relief and overall wellbeing. Features & Highlights: traditional full-body therapy; enhances blood flow and oxygenation; gentle yet effective relaxation.", price: "25", label: "Per person, 60 minutes" },
      { name: "Relaxing Massage – 90 Minutes", description: "About This Treatment: The classic massage for relaxation and renewal. Swedish massage uses long, flowing strokes, kneading, and circular motions to release tension and improve circulation. It's the all-purpose technique for stress relief and overall wellbeing. Features & Highlights: traditional full-body therapy; enhances blood flow and oxygenation; gentle yet effective relaxation.", price: "40", label: "Per person, 90 minutes" },
    ],
    description: "Two ways to unwind in Hurghada: the classic Relaxing Massage, available in 60 or 90 minutes, or the full Turkish Hammam Ritual with sauna, steam, jacuzzi, scrub and massage. Choose your package below.", highlights: ["Relaxing Massage – 60 minutes (25 EUR) or 90 minutes (40 EUR)", "Turkish Hammam Ritual – 120 minutes (50 EUR)", "Sauna, steam and jacuzzi circuit", "Traditional loofah and Moroccan soap cleansing", "Full-body massage for tension release"], included: ["Treatments listed in the confirmed package", "Towel and spa facilities", "Tea or water when provided", "Transfer in the confirmed pickup zone"], notIncluded: ["Extra treatments", "Personal products", "Transfers outside the confirmed zone"], notes: ["Relaxing Massage: 60 minutes for 25 EUR or 90 minutes for 40 EUR, per person.", "Turkish Hammam Ritual: 120 minutes for 50 EUR, per person.", "Open daily from 9:00 AM to 11:00 PM.", "Tell the spa about pregnancy, injuries, allergies or medical conditions before booking.", "Minimum age and privacy arrangements are confirmed in advance. Free cancellation is available up to 48 hours before the activity."], availableTimes: ["Daily, 9:00 AM – 11:00 PM"], notSuitableFor: ["Guests with medical conditions not cleared for heat or massage treatments"], whatToBring: ["Swimwear", "Dry clothes", "Any essential medication"], seoTitle: "Turkish Hammam and Relaxing Massage in Hurghada", metaDescription: "Book a Relaxing Massage (60 min for 25 EUR, 90 min for 40 EUR) or the full Turkish Hammam ritual (120 min for 50 EUR) in Hurghada, open daily 9:00 AM–11:00 PM."
  },
  {
    slug: "basic-diver-jeddah",
    listingStatus: "active",
    destinationSlug: "jeddah",
    currency: "USD",
    title: "SSI Basic Diver — Try Scuba Diving",
    image: "/images/owned/basic-diver-jeddah.jpg",
    price: "140.25",
    originalPrice: "165",
    priceUnit: "per person",
    rating: "New",
    reviews: "New",
    location: "Al-Haddad Scuba Shop, Jeddah",
    duration: "Approximately 4 hours",
    category: "Diving",
    categoryPath: ["Diving & Snorkeling", "Beginner Diving"],
    badge: "New",
    bookingMode: "direct",
    pricingLockedToCode: true,
    participantPricing: { adults: 140.25 },
    availableTimes: ["10:15 AM", "11:00 AM", "12:00 AM"],
    operatingWeekdays: [0, 1, 2, 3, 4, 5, 6],
    description: "Try scuba diving in Jeddah in a half-day SSI Basic Diver program for first-time, non-certified participants, including theory, confined-water skills and a 30–45 minute open-water dive.",
    highlights: [
      "Designed for first-time and non-certified divers",
      "Three phases: theory, confined-water skills and an open-water dive",
      "Approximately 30–45 minutes in open water",
      "Dive to a maximum of 12 metres, according to comfort and instructor guidance",
      "SSI Basic Diver recognition valid for 6 months",
      "Professional instructor supervision throughout",
    ],
    included: ["Scuba diving equipment", "Resort fees", "Classroom safety and theory session", "Confined-water skills session", "Instructor-led open-water dive"],
    notIncluded: ["Snacks and beverages", "Towels", "Transport to the meeting point unless separately confirmed"],
    notes: [
      "Meet at Al-Haddad Scuba Shop and arrive at least 15 minutes before the scheduled start for check-in and the safety briefing.",
      "Reserve at least 24 hours before the experience.",
      "Participants must disclose medical conditions. The supplied terms specifically identify heart conditions and high blood pressure as concerns.",
      "Do not fly for at least 24 hours after the dive.",
      "Final depth and dive duration depend on participant comfort, conditions and the instructor's safety decision.",
    ],
    itinerary: [
      "Arrive at Al-Haddad Scuba Shop at least 15 minutes early",
      "Complete check-in, health screening and a classroom safety briefing",
      "Learn how to use the scuba equipment",
      "Practise essential skills in a pool or confined water",
      "Complete an instructor-led open-water dive for approximately 30–45 minutes",
      "Receive SSI Basic Diver recognition after successful completion",
    ],
    notSuitableFor: ["Guests with medical conditions that make scuba diving unsafe", "Guests who plan to fly within 24 hours after the experience"],
    whatToBring: ["Towel", "Dry change of clothes", "Sunscreen", "Swimwear", "Valid identification", "Any required medical clearance"],
    packageName: "SSI Basic Diver — Try Scuba Diving",
    packageDescription: "A half-day first scuba experience with theory, confined-water training, equipment and an instructor-led open-water dive.",
    packagePrice: "140.25",
    packageLabel: "Per person",
    ageBands: { adults: "Participant", children: "Contact us to confirm minimum age", infants: "Not applicable" },
    seoTitle: "Try Scuba Diving in Jeddah | SSI Basic Diver",
    metaDescription: "Book an SSI Basic Diver try-scuba experience in Jeddah: theory, confined-water skills, equipment and a 30–45 minute open-water dive, now USD 140.25 (was USD 165).",
    imageAlt: "SSI Basic Diver course artwork showing scuba divers underwater",
  },
  {
    slug: "certified-diver-boat-trip-jeddah",
    listingStatus: "active",
    destinationSlug: "jeddah",
    currency: "SAR",
    title: "Certified Diver Boat Trip — Two Guided Dives",
    image: "/images/owned/certified-diver-boat-trip-jeddah.jpg",
    price: "340",
    originalPrice: "400",
    priceUnit: "per person",
    rating: "New",
    reviews: "New",
    location: "Al-Haddad Scuba Shop, Jeddah",
    duration: "6–8 hours",
    category: "Diving",
    categoryPath: ["Diving & Snorkeling", "Certified Diving"],
    badge: "New",
    bookingMode: "direct",
    participantPricing: { adults: 340 },
    availableTimes: ["Gathering 9:15 AM (Sunday–Thursday)", "Gathering 7:15 AM (Friday–Saturday)"],
    operatingWeekdays: [0, 1, 2, 3, 4, 5, 6],
    description: "Two guided boat dives for certified divers only, exploring the Red Sea's wreck and coral sites near Jeddah on a half-day trip departing from Al-Haddad Scuba Shop.",
    highlights: [
      "Certified divers only — proof of certification required",
      "Two guided boat dives at wreck or coral sites",
      "Potential sites include Anas Reef, Duqais, Ann Ann Wreck, Chicken Wreck and Crazy 8",
      "Scuba tanks, weight belts, snacks and drinks included",
      "Maximum 20 divers per trip",
    ],
    included: ["Scuba tanks and weight belts", "Snacks and beverages"],
    notIncluded: ["Diving equipment — available for rent separately", "Transport to Al-Haddad Scuba Shop unless separately confirmed"],
    notes: [
      "Certified divers only; proof of certification is required.",
      "Book at least 24 hours in advance.",
      "Arrivals more than 15 minutes late are marked as served, with no refund.",
      "Trips may be rescheduled or refunded in case of severe weather.",
      "Maximum 20 seats per trip.",
    ],
    itinerary: [
      "Gather at Al-Haddad Scuba Shop for check-in and a safety briefing (30 minutes)",
      "Equipment fitting and a brief safety demonstration (15 minutes)",
      "Boat transfer to the dive site (about 30–40 minutes)",
      "First guided boat dive",
      "Surface interval, then a second guided boat dive",
      "Return to Al-Haddad Scuba Shop, estimated between 3:00 PM and 5:30 PM",
    ],
    notSuitableFor: ["Non-certified divers", "Guests without valid proof of scuba certification"],
    whatToBring: ["Valid dive certification card", "A dry cloth", "A towel", "Sunscreen"],
    packageName: "Certified Diver Boat Trip — Two Dives",
    packageDescription: "Two guided boat dives for certified divers with tanks, weight belts, snacks and drinks included.",
    packagePrice: "340",
    packageLabel: "Per person",
    ageBands: { adults: "Certified divers", children: "", infants: "" },
    seoTitle: "Certified Diver Boat Trip in Jeddah | Two Guided Dives",
    metaDescription: "Book a two-dive guided boat trip for certified divers in Jeddah, exploring wreck and coral sites near Al-Haddad Scuba Shop, now SAR 340 per person (was SAR 400), including tanks and snacks.",
    imageAlt: "Certified scuba divers geared up on a boat before a guided dive trip in Jeddah",
  },
  {
    slug: "jeddah-yacht-sunset-cruise",
    listingStatus: "active",
    destinationSlug: "jeddah",
    pricingLockedToCode: true,
    currency: "SAR",
    title: "Jeddah Yacht Sunset Cruise on Shorouk Sat",
    image: "/images/owned/jeddah-yacht-sunset-cruise.jpg",
    price: "102",
    originalPrice: "120",
    priceUnit: "per adult",
    rating: "New",
    reviews: "New",
    location: "Obhur Bay, Jeddah",
    duration: "Approximately 2–2.5 hours including check-in",
    category: "Boat Cruise",
    categoryPath: ["Boat Cruises", "Sunset Cruise"],
    badge: "New",
    bookingMode: "direct",
    participantPricing: { adults: 102, youth: 51, infants: 0 },
    ageBands: { adults: "Adults (ages 13+)", children: "Children (ages 3–12)", infants: "Infants (ages 0–2) — free" },
    availableTimes: ["5:00 PM sunset cruise"],
    operatingWeekdays: [1, 3, 4],
    bookingCutoff: { daysBefore: 1, localTime: "17:00", timeZone: "Asia/Riyadh", assumption: true },
    fulfillmentType: "meeting_point",
    departureMarina: "Rixos Resort Gate 2, Obhur Bay",
    description: "Cruise through Jeddah's Obhur Bay aboard the three-deck Shorouk Sat yacht during golden hour, with coastal views, an air-conditioned salon, fresh sandwiches and complimentary hot and cold drinks.",
    highlights: [
      "Golden-hour cruise through Obhur Bay",
      "Three spacious outdoor viewing decks",
      "Air-conditioned indoor salon",
      "Fresh sandwiches and complimentary beverages",
      "Coastal and sunset photography opportunities",
      "Capacity limited to 40 guests per departure",
    ],
    included: ["Shorouk Sat yacht cruise", "Air-conditioned indoor salon", "Access to three outdoor viewing decks", "Two onboard restrooms", "Fresh cold-cut sandwiches", "Complimentary hot and cold beverages"],
    notIncluded: ["Full-course meals", "Transport to the assembly point", "Personal expenses"],
    notes: [
      "Meet at Rixos Resort Gate 2 (side door): https://maps.app.goo.gl/aQxvPuxEWmXLFcDR6",
      "Arrive at least 15 minutes before departure for check-in, the safety briefing and Coast Guard permit processing.",
      "The 7:00 PM evening cruise is not currently available and is not offered for booking.",
      "Late arrival beyond the stated 15-minute policy forfeits the booking without refund or rescheduling under the supplied operator terms.",
      "All guests must meet the official Coast Guard clearance requirements stated by the operator.",
      "Guests may bring light finger foods; heavy full-course meals are not provided.",
    ],
    itinerary: [
      "Check in at Rixos Resort Gate 2 and complete the security briefing and permit process",
      "Board Shorouk Sat and depart into Obhur Bay",
      "Cruise for approximately 1.5–2 hours with sightseeing, photography and onboard refreshments",
      "Return to the original dock for disembarkation",
    ],
    notSuitableFor: ["Guests who cannot satisfy the operator's Coast Guard clearance requirements", "Guests unable to board and move safely around a multi-deck vessel"],
    whatToBring: ["Valid Saudi national ID, Iqama or passport", "Smart-casual resort wear", "Sunglasses", "Camera or smartphone"],
    faqs: [
      { question: "When does the Jeddah yacht cruise operate?", answer: "The currently bookable sunset cruise departs at 5:00 PM on Monday, Wednesday and Thursday. Arrive at least 15 minutes early." },
      { question: "Is the 7:00 PM evening cruise available?", answer: "No. The supplied operator schedule marks the evening departure as not yet available." },
      { question: "What identification is required?", answer: "A valid Saudi national ID, Iqama or passport is mandatory for Coast Guard clearance." },
    ],
    packageName: "Shorouk Sat Sunset Cruise",
    packageDescription: "A golden-hour yacht cruise through Obhur Bay with three viewing decks, an air-conditioned salon, sandwiches and beverages.",
    packagePrice: "102",
    packageLabel: "Per adult",
    seoTitle: "Jeddah Yacht Sunset Cruise in Obhur Bay",
    metaDescription: "Book the Shorouk Sat Jeddah yacht sunset cruise in Obhur Bay, now SAR 102 per adult (was SAR 120), with sandwiches, beverages and three viewing decks.",
    imageAlt: "Shorouk Sat yacht cruising through Jeddah's Obhur Bay at sunset",
    imageFocalPoint: { x: 0.53, y: 0.5 },
  },
  {
    slug: "bayada-snorkeling-trip-jeddah",
    listingStatus: "active",
    destinationSlug: "jeddah",
    currency: "SAR",
    title: "Bayada Daily Snorkeling Boat Trip from Jeddah",
    image: "/images/owned/jeddah-bayada-snorkeler.jpg",
    price: "298",
    originalPrice: "350",
    priceUnit: "per person",
    rating: "New",
    reviews: "New",
    location: "Al-Haddad Scuba Shop, Jeddah",
    duration: "5–6 hours",
    category: "Snorkeling",
    categoryPath: ["Diving & Snorkeling", "Snorkeling"],
    badge: "New",
    bookingMode: "direct",
    fulfillmentType: "meeting_point",
    departureMarina: "Al-Haddad Scuba Shop, Jeddah",
    participantPricing: { adults: 298 },
    operatingWeekdays: [0, 1, 2, 3, 4, 5, 6],
    bookingCutoff: { daysBefore: 1, timeZone: "Asia/Riyadh", assumption: true },
    availableTimes: ["Gathering 9:15 AM (Sunday–Thursday)", "Gathering 7:15 AM (Friday–Saturday)"],
    description:
      "Spend a half day snorkeling the reefs of the Bayada area near Jeddah on Al-Haddad Scuba's daily boat trip. Each departure visits a rotating choice of Red Sea sites with a professional snorkeling instructor, and equipment, snacks and drinks are included.",
    highlights: [
      "Daily departures to a rotating choice of Bayada-area snorkeling sites",
      "Professional snorkeling instructor guiding and supporting you in the water",
      "Snorkel over vibrant marine life and healthy coral reefs",
      "About 30 to 40 minutes by boat to the day's site",
      "Four to five hours of in-water and sightseeing time with regular breaks",
      "Snorkeling equipment, snacks and beverages included",
      "Small group capped at 20 guests per trip",
    ],
    included: [
      "Boat trip to the selected Bayada-area site",
      "Professional snorkeling instructor",
      "Snorkeling equipment: mask, snorkel and fins",
      "Snacks",
      "Soft drinks and water",
      "Pre-trip safety briefing and equipment fitting",
    ],
    notIncluded: [
      "Scuba diving equipment, available for rent separately",
      "Transport to Al-Haddad Scuba Shop unless separately confirmed",
      "Towels",
      "Personal expenses and gratuities",
    ],
    notes: [
      "Meet at Al-Haddad Scuba Shop and arrive at least 15 minutes before the gathering time for check-in and the safety briefing.",
      "Reserve at least 24 hours before the trip.",
      "All participants must have no travel ban and must not be on a government wanted list.",
      "Arrivals more than 15 minutes late are treated as served, with no refund.",
      "Trips may be rescheduled or refunded in the event of severe weather.",
      "The specific site is chosen on the day according to sea and weather conditions.",
      "Maximum 20 seats per trip.",
    ],
    itinerary: [
      "Gather at Al-Haddad Scuba Shop for check-in, briefing and final preparations, about 30 minutes",
      "Collect and fit snorkeling equipment with a short safety demonstration, about 15 minutes",
      "Board the boat and sail about 30 to 40 minutes to the day's site",
      "Snorkel and explore with the instructor, with regular breaks, about four to five hours of total activity time",
      "Return to shore, arriving back between roughly 2:00 PM and 4:30 PM depending on conditions",
    ],
    notSuitableFor: [
      "Guests subject to a travel ban or listed on a government wanted list",
      "Guests who are not comfortable in open water",
      "Unaccompanied young children; contact us to confirm the minimum age",
    ],
    whatToBring: ["Dry change of clothes", "Towel", "Sunscreen", "Swimwear", "Valid identification"],
    faqs: [
      { question: "What time does the Bayada snorkeling trip start?", answer: "Gathering is at 9:15 AM from Sunday to Thursday and at 7:15 AM on Friday and Saturday. Arrive at least 15 minutes early for check-in and the safety briefing." },
      { question: "Which site will we visit?", answer: "Bayada trips rotate between several snorkeling spots around the Bayada area. The exact site is decided on the day according to sea and weather conditions." },
      { question: "Is snorkeling equipment provided?", answer: "Yes. Mask, snorkel and fins are included, along with a professional snorkeling instructor. Scuba diving equipment is not included but can be rented separately." },
      { question: "Do I need to be a strong swimmer?", answer: "You should be comfortable in open water. A professional instructor guides and supports the group throughout the trip." },
    ],
    ageBands: { adults: "Participant", children: "Contact us to confirm the minimum age", infants: "Not applicable" },
    packageName: "Bayada Daily Snorkeling Boat Trip",
    packageDescription: "A half-day guided snorkeling boat trip to a rotating choice of Bayada-area Red Sea sites, with instructor, equipment, snacks and drinks.",
    packagePrice: "298",
    packageLabel: "Per person",
    seoTitle: "Bayada Daily Snorkeling Boat Trip from Jeddah",
    metaDescription: "Book Al-Haddad Scuba's daily Bayada snorkeling boat trip from Jeddah: a rotating choice of Red Sea reef sites with a professional instructor, plus equipment, snacks and drinks, now SAR 298 per person (was SAR 350).",
    imageAlt: "Snorkeler giving peace signs underwater above a Red Sea reef near Jeddah",
    imageFocalPoint: { x: 0.5, y: 0.4 },
  },
  {
    slug: "dolphin-house-marsa-alam", listingStatus: "active", destinationSlug: "marsa-alam", currency: "EUR", title: "Dolphin House Full-Day Snorkeling Boat Trip from Marsa Alam", image: "/images/placeholders/dolphin-house.svg", price: "99", rating: "New", reviews: "New", location: "Marsa Alam Marina, Marsa Alam", duration: "Full day", category: "Snorkeling", badge: "New", bookingMode: "direct", priceUnit: "per person", participantPricing: { adults: 99, youth: 50, infants: 0 }, ageBands: { adults: "Adults (ages 12+)", children: "Children (ages 2–11)", infants: "Infants (under 2) — free" }, availableTimes: ["07:00 pickup · 08:30 boat departure"], operatingWeekdays: [1, 5], bookingCutoff: { daysBefore: 1, localTime: "18:00", timeZone: "Africa/Cairo" }, departureMarina: "Marsa Alam Marina",
    description: "Travel from your hotel in Marsa Alam, Port Ghalib or Coraya Bay to Marsa Alam Marina for a full-day boat journey to the Dolphin House habitat area, with two snorkeling sessions and lunch. Dolphin sightings and water entry are never guaranteed and depend on wildlife behaviour, sea conditions and crew safety instructions.", highlights: ["Monday and Friday departures", "Two snorkeling sessions", "Lunch on the boat", "Known dolphin habitat area without a sighting guarantee", "Included pickup from Marsa Alam, Port Ghalib and Coraya Bay"], included: ["Hotel pickup from Marsa Alam, Port Ghalib or Coraya Bay", "Boat trip from Marsa Alam Marina", "Two snorkeling sessions", "Lunch"], notIncluded: ["Personal expenses", "Any equipment not explicitly confirmed"], notes: ["Pickup is included from hotels in Marsa Alam, Port Ghalib and Coraya Bay with no extra supplement.", "Do not touch, chase, feed or crowd wildlife. Follow the crew's instructions at all times.", "The route and snorkeling access may change with wildlife behaviour, weather, sea conditions and safety requirements.", "Bookings close at 18:00 Africa/Cairo time on the previous day.", "Free cancellation is available up to 48 hours before departure unless supplier commitments have already become non-refundable.", "Adults are ages 12+, children are ages 2–11, and infants under 2 travel free."], itinerary: ["Hotel pickup at approximately 07:00", "Arrival at Marsa Alam Marina at approximately 08:00", "Boat departure at approximately 08:30", "Approximately one hour by boat to the Dolphin House area", "First snorkeling session", "Lunch on board", "Second snorkeling session", "Return to the marina at approximately 16:00", "Hotel return transfer follows marina arrival"], whatToBring: ["Passport or photo ID", "Swimwear", "Towel", "Sun protection", "Personal medication"], notSuitableFor: ["Guests unable to swim safely without the assistance they require", "Guests whose medical condition is incompatible with a full-day boat trip"], faqs: [{ question: "Are dolphins guaranteed?", answer: "No. Dolphin House is a known habitat area, but sightings and any opportunity to enter the water depend on wildlife behaviour, sea conditions and safety instructions." }, { question: "Which hotels include pickup?", answer: "Pickup is included from hotels in Marsa Alam, Port Ghalib and Coraya Bay with no extra supplement." }], seoTitle: "Dolphin House Snorkeling from Marsa Alam", metaDescription: "Book the Monday and Friday Dolphin House boat trip from Marsa Alam with two snorkeling sessions, lunch and included hotel transfer. Wildlife sightings are not guaranteed."
  },
  {
    slug: "marsa-mubarak-snorkeling", listingStatus: "active", destinationSlug: "marsa-alam", currency: "EUR", title: "Marsa Mubarak Full-Day Snorkeling Boat Trip from Marsa Alam", image: "/images/placeholders/island-trip.svg", price: "60", rating: "New", reviews: "New", location: "Port Ghalib Marina, Marsa Alam", duration: "Full day", category: "Snorkeling", badge: "New", bookingMode: "direct", priceUnit: "per person", participantPricing: { adults: 60, youth: 40, infants: 0 }, ageBands: { adults: "Adults (ages 12+)", children: "Children (ages 2–11)", infants: "Infants (under 2) — free" }, availableTimes: ["07:00 pickup · 08:30 boat departure"], operatingWeekdays: [0, 2, 3, 4, 6], bookingCutoff: { daysBefore: 1, localTime: "18:00", timeZone: "Africa/Cairo" }, departureMarina: "Port Ghalib Marina",
    description: "Depart from Port Ghalib Marina for a full-day boat trip to Marsa Mubarak, with two snorkeling sessions and lunch. Turtles, dugongs and other wildlife are wild animals, so sightings cannot be guaranteed.", highlights: ["Operates daily except Monday and Friday", "Two snorkeling sessions", "Lunch and entrance fee included", "Port Ghalib Marina departure", "Included pickup from Marsa Alam, Port Ghalib and Coraya Bay"], included: ["Hotel pickup from Marsa Alam, Port Ghalib or Coraya Bay", "Boat trip", "Two snorkeling sessions", "Lunch", "Entrance fee"], notIncluded: ["Personal expenses", "Any equipment not explicitly confirmed"], notes: ["Pickup is included from hotels in Marsa Alam, Port Ghalib and Coraya Bay with no extra supplement.", "Wildlife sightings depend on natural conditions and are not guaranteed.", "The route and snorkeling access depend on weather, sea conditions and safety instructions.", "Bookings close at 18:00 Africa/Cairo time on the previous day.", "Adults are ages 12+, children are ages 2–11, and infants under 2 travel free."], itinerary: ["Hotel pickup at approximately 07:00", "Arrival at Port Ghalib Marina at approximately 08:00", "Boat departure at approximately 08:30", "Approximately one hour by boat to Marsa Mubarak", "First snorkeling session", "Lunch on board", "Second snorkeling session", "Return to the marina at approximately 16:00", "Hotel return transfer follows marina arrival"], whatToBring: ["Passport or photo ID", "Swimwear", "Towel", "Sun protection", "Personal medication"], faqs: [{ question: "Are turtles or dugongs guaranteed?", answer: "No. Marsa Mubarak is a natural habitat and all wildlife sightings depend on natural conditions." }, { question: "Is the entrance fee included?", answer: "Yes, the supplied package includes the entrance fee." }], seoTitle: "Marsa Mubarak Snorkeling Boat Trip", metaDescription: "Book the Marsa Mubarak snorkeling boat trip from Port Ghalib, operating daily except Monday and Friday with lunch, entrance and included hotel transfer."
  },
  {
    slug: "abu-dabbab-snorkeling", listingStatus: "active", destinationSlug: "marsa-alam", currency: "EUR", title: "Abu Dabbab Beach Snorkeling Trip by Bus from Marsa Alam", image: "/images/placeholders/island-trip.svg", price: "50", rating: "New", reviews: "New", location: "Abu Dabbab Beach, Marsa Alam", duration: "Approximately 6 hours", category: "Snorkeling", badge: "New", bookingMode: "direct", priceUnit: "per person", participantPricing: { adults: 50, youth: 30, infants: 0 }, ageBands: { adults: "Adults (ages 12+)", children: "Children (ages 2–11)", infants: "Infants (under 2) — free" }, availableTimes: ["07:00 pickup"], operatingWeekdays: [1, 3, 5], bookingCutoff: { daysBefore: 1, localTime: "18:00", timeZone: "Africa/Cairo" },
    description: "Travel by bus or shared transfer to Abu Dabbab Beach for an easy-access snorkeling visit. Departure from the beach is at approximately 13:00. Sea turtles are often seen in the area, but sightings are not guaranteed.", highlights: ["Monday, Wednesday and Friday departures", "Easy beach access", "Suitable for families with normal swimming ability and supervision", "Beach entrance included", "Included pickup from Marsa Alam, Port Ghalib and Coraya Bay"], included: ["Hotel pickup from Marsa Alam, Port Ghalib or Coraya Bay", "Abu Dabbab Beach entrance fee"], notIncluded: ["Lunch", "Personal expenses", "Optional equipment unless explicitly confirmed"], notes: ["Pickup is included from hotels in Marsa Alam, Port Ghalib and Coraya Bay with no extra supplement.", "Departure from Abu Dabbab Beach is at approximately 13:00.", "Never touch, feed, chase or disturb turtles or other wildlife.", "Swimming suitability depends on ability, adult supervision, weather and sea conditions.", "Bookings close at 18:00 Africa/Cairo time on the previous day.", "Adults are ages 12+, children are ages 2–11, and infants under 2 travel free."], itinerary: ["Hotel pickup at approximately 07:00", "Arrival at Abu Dabbab Beach at approximately 07:45", "Beach time and independent snorkeling according to conditions", "Depart Abu Dabbab Beach at approximately 13:00"], whatToBring: ["Passport or photo ID", "Swimwear", "Towel", "Sun protection", "Water", "Personal snorkeling equipment if desired"], notSuitableFor: ["Children without responsible adult supervision", "Guests unable to enter or leave the water safely under the day's conditions"], faqs: [{ question: "Will we see sea turtles?", answer: "Sightings are common but never guaranteed because turtles are wild animals." }, { question: "Is lunch included?", answer: "No. Lunch is not included in the supplied package." }], seoTitle: "Abu Dabbab Beach Snorkeling from Marsa Alam", metaDescription: "Book the Monday, Wednesday and Friday Abu Dabbab Beach snorkeling trip from Marsa Alam with included hotel transfer and beach entrance. Turtle sightings are not guaranteed."
  },


];

// Legacy catalogue entries are all Hurghada-owned. Normalizing at the data
// boundary makes destination ownership explicit everywhere else in the app.
export const tours: Tour[] = tourCatalog.map((tour) => ({
  ...tour,
  destinationSlug: tour.destinationSlug ?? "hurghada",
}));

for (const slug of snorkelingBoatSlugs) {
  const tour = tours.find((item) => item.slug === slug);
  if (tour) Object.assign(tour, snorkelingBoatEnglish[slug]);
}

for (const [slug, schedule] of Object.entries(marsaAlamTourSchedules)) {
  const tour = tours.find((item) => item.slug === slug);
  if (tour) Object.assign(tour, schedule);
}

for (let index = 0; index < tours.length; index += 1) {
  tours[index] = applyTourMediaSafety(tours[index], "en");
}
