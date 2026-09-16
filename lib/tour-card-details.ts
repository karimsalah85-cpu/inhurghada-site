import type { Locale } from "@/lib/i18n";

const units = {
  "per person": { en: "per person", ar: "للشخص", de: "pro Person", ru: "за человека", pl: "za osobę", zh: "每人" },
  "per vehicle": { en: "per vehicle", ar: "للمركبة", de: "pro Fahrzeug", ru: "за автомобиль", pl: "za pojazd", zh: "每辆车" },
  "per day": { en: "per day", ar: "لليوم", de: "pro Tag", ru: "за день", pl: "za dzień", zh: "每天" },
} as const;

export function cardPriceUnit(unit: string | undefined, locale: Locale) {
  const key = unit || "per person";
  return key in units ? units[key as keyof typeof units][locale] : key;
}

// Show the actual supplied inclusion, never infer pickup from a departure time.
export function cardInclusions(included: string[] = []) {
  const pickupPattern = /pickup|pick-up|hotel transfer|hotelabholung|hoteltransfer|abholung|трансфер|отеля|odbiór|transfer.*hotel|接送|الاستلام|التوصيل|الفندق|الفنادق/iu;
  const pickup = included.find((item) => pickupPattern.test(item));
  return { pickup, inclusion: included.find((item) => item.trim() && item !== pickup) };
}
