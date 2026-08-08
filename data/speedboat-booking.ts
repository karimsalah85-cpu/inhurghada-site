export type BoatOption = { id: string; label: string; capacity: number; price: number };
export type BookingExtra = { id: string; label: string; price: number; unit: "person" | "item" };

// Catalog prices are stored in USD and converted by the global currency selector.
const EUR_RATE = 0.876691;
export const eurToUsd = (euros: number) => Number((euros / EUR_RATE).toFixed(2));

export const halfDayBoatOptions: BoatOption[] = [
  ["boat-1", "Boat 1 - up to 4 passengers", 4, 100],
  ["boat-2", "Boat 2 - up to 5 passengers", 5, 115],
  ["boat-3", "Boat 3 - up to 5 passengers", 5, 125],
  ["boat-4", "Boat 4 - up to 7 passengers", 7, 140],
  ["boat-5", "Boat 5 - up to 7 passengers", 7, 140],
  ["boat-6", "Boat 6 - up to 7 passengers", 7, 160],
  ["boat-7", "Boat 7 - up to 7 passengers", 7, 160],
  ["boat-8", "Boat 8 - up to 9 passengers", 9, 200],
].map(([id, label, capacity, euros]) => ({ id: String(id), label: String(label), capacity: Number(capacity), price: eurToUsd(Number(euros)) }));

export const fullDayBoatOptions: BoatOption[] = [
  ["boat-1", "Boat 1 - up to 4 passengers", 4, 150],
  ["boat-2", "Boat 2 - up to 5 passengers", 5, 165],
  ["boat-3", "Boat 3 - up to 5 passengers", 5, 175],
  ["boat-4", "Boat 4 - up to 7 passengers", 7, 190],
  ["boat-5", "Boat 5 - up to 7 passengers", 7, 190],
  ["boat-6", "Boat 6 - up to 7 passengers", 7, 210],
  ["boat-7", "Boat 7 - up to 7 passengers", 7, 210],
  ["boat-8", "Boat 8 - up to 9 passengers", 9, 250],
].map(([id, label, capacity, euros]) => ({ id: String(id), label: String(label), capacity: Number(capacity), price: eurToUsd(Number(euros)) }));

export const speedboatMeals: BookingExtra[] = [
  { id: "mix-grill", label: "Mix Grill", price: eurToUsd(15), unit: "person" },
  { id: "seafood", label: "Seafood", price: eurToUsd(20), unit: "person" },
  { id: "seafood-salmon", label: "Seafood + Salmon Steak", price: eurToUsd(25), unit: "person" },
  { id: "kids-meal", label: "Kids Meal", price: eurToUsd(10), unit: "person" },
];

export const refreshments: BookingExtra = {
  id: "refreshments",
  label: "Bottled water, soft drinks, snacks & fruits",
  price: eurToUsd(6),
  unit: "person",
};

export const marinaTransferOptions = ["Hurghada Hotels", "Makadi Bay", "Sahl Hasheesh", "El Gouna", "Soma Bay", "Safaga"] as const;

export const speedboatTerms = [
  "Confirmation will be received within 48 hours of booking, subject to availability.",
  "Subject to favorable weather conditions. If cancelled due to poor weather, you may choose an alternative date or a full refund.",
  "Children must be accompanied by an adult.",
  "Not recommended for participants with heart complaints or other serious medical conditions.",
  "Alcoholic beverages are prohibited on board.",
  "Cancellations made at least 48 hours before the experience start time receive a 100% refund.",
  "Cancellations made within 48 hours of the experience start time receive no refund.",
  "Passenger names and ages are required when booking.",
  "Hotel details are required when booking.",
];
