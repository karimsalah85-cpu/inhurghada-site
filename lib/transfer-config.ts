/**
 * Central configuration for Hurghada private airport transfers.
 *
 * Everything commercial about airport transfers lives here: the fleet, the
 * per-vehicle / per-journey price matrix, luggage capacities, child-seat and
 * oversized-baggage rules, the group threshold that forces manual confirmation,
 * and the hotel-name -> pricing-zone mapping.
 *
 * Rules for editing this file:
 *  - Prices are USD, PER VEHICLE, ONE WAY. Never per person.
 *  - A child or infant still occupies a seat, so all count toward capacity.
 *  - Only vehicle classes with `enabled: true` are offered to customers.
 *    Disabled classes stay here (with data) so they can be switched on later
 *    without a code change once the supplier fleet supports them.
 *  - Bump PRICING_VERSION whenever the matrix or capacities change so booking
 *    snapshots remain auditable.
 */

export const PRICING_VERSION = "2026-09-transfer-v1";
export const TRANSFER_CURRENCY = "USD" as const;

export type TransferVehicleClass = "sedan" | "suv" | "minivan" | "hiace" | "minibus";

export type TransferZoneKey =
  | "hurghada_city"
  | "el_ahyaa"
  | "sahl_hasheesh"
  | "makadi_bay"
  | "el_gouna"
  | "soma_bay"
  | "safaga"
  | "el_quseir"
  | "port_ghalib"
  | "marsa_alam";

export type TransferDirection = "airport_to_hotel" | "hotel_to_airport" | "hotel_to_hotel";
export type TransferTripType = "one_way" | "round_trip";
export type WheelchairRequirement = "none" | "folding_manual" | "powered_or_fixed";

export type OversizedItemType =
  | "golf_bag"
  | "kitesurf"
  | "windsurf"
  | "diving_equipment"
  | "bicycle"
  | "surfboard"
  | "wheelchair"
  | "baby_stroller"
  | "other";

export type ChildSeatType = "infant" | "child" | "booster";

export type VehicleClassConfig = {
  vehicleClass: TransferVehicleClass;
  /** Whether Daily Red Sea suppliers can currently dispatch this class. */
  enabled: boolean;
  /** Localisation key resolved by the transfer UI copy table. */
  labelKey: string;
  /** Maximum seated passengers (adults + children + infants). Never exceeded. */
  passengerCapacity: number;
  /** Large / checked suitcase-equivalent slots. Oversized items convert into these. */
  largeBagCapacity: number;
  /** Small cabin bags / backpacks the vehicle can take on top of the large bags. */
  cabinBagCapacity: number;
};

/**
 * Fleet. Order matters: allocation walks classes from smallest to largest.
 * Current supplier availability: Sedan and Hiace only (confirmed by operations).
 */
export const VEHICLE_CLASSES: Record<TransferVehicleClass, VehicleClassConfig> = {
  sedan: { vehicleClass: "sedan", enabled: true, labelKey: "vehicle.sedan", passengerCapacity: 3, largeBagCapacity: 2, cabinBagCapacity: 3 },
  suv: { vehicleClass: "suv", enabled: false, labelKey: "vehicle.suv", passengerCapacity: 4, largeBagCapacity: 4, cabinBagCapacity: 4 },
  minivan: { vehicleClass: "minivan", enabled: false, labelKey: "vehicle.minivan", passengerCapacity: 7, largeBagCapacity: 6, cabinBagCapacity: 7 },
  hiace: { vehicleClass: "hiace", enabled: true, labelKey: "vehicle.hiace", passengerCapacity: 10, largeBagCapacity: 8, cabinBagCapacity: 10 },
  minibus: { vehicleClass: "minibus", enabled: false, labelKey: "vehicle.minibus", passengerCapacity: 18, largeBagCapacity: 12, cabinBagCapacity: 18 },
};

export function enabledVehicleClasses(): VehicleClassConfig[] {
  return (Object.keys(VEHICLE_CLASSES) as TransferVehicleClass[])
    .map((key) => VEHICLE_CLASSES[key])
    .filter((config) => config.enabled)
    .sort((left, right) => left.passengerCapacity - right.passengerCapacity);
}

/**
 * PER-VEHICLE, ONE-WAY USD fares. Contracted supplier rates.
 * Every enabled vehicle class must have a price for every zone.
 * Disabled classes keep their column here for future activation.
 */
export const ROUTE_PRICING: Record<TransferZoneKey, Record<TransferVehicleClass, number | null>> = {
  hurghada_city: { sedan: 15, suv: 18, minivan: 20, hiace: 30, minibus: 40 },
  el_ahyaa: { sedan: 18, suv: 20, minivan: 23, hiace: 32, minibus: 42 },
  sahl_hasheesh: { sedan: 20, suv: 23, minivan: 25, hiace: 35, minibus: 45 },
  makadi_bay: { sedan: 20, suv: 23, minivan: 25, hiace: 35, minibus: 45 },
  el_gouna: { sedan: 20, suv: 23, minivan: 25, hiace: 35, minibus: 45 },
  soma_bay: { sedan: 30, suv: 32, minivan: 35, hiace: 45, minibus: 55 },
  safaga: { sedan: 35, suv: 38, minivan: 40, hiace: 50, minibus: 60 },
  el_quseir: { sedan: 55, suv: 60, minivan: 65, hiace: 80, minibus: null },
  port_ghalib: { sedan: 75, suv: 80, minivan: 90, hiace: 110, minibus: null },
  marsa_alam: { sedan: 85, suv: 90, minivan: 105, hiace: 125, minibus: null },
};

export const ZONE_LABEL_KEYS: Record<TransferZoneKey, string> = {
  hurghada_city: "zone.hurghada_city",
  el_ahyaa: "zone.el_ahyaa",
  sahl_hasheesh: "zone.sahl_hasheesh",
  makadi_bay: "zone.makadi_bay",
  el_gouna: "zone.el_gouna",
  soma_bay: "zone.soma_bay",
  safaga: "zone.safaga",
  el_quseir: "zone.el_quseir",
  port_ghalib: "zone.port_ghalib",
  marsa_alam: "zone.marsa_alam",
};

export const TRANSFER_ZONE_KEYS = Object.keys(ROUTE_PRICING) as TransferZoneKey[];

/**
 * Senzo Mall shuttle. Short-haul hotel <-> mall within Hurghada; priced per
 * vehicle by passenger count using the same structure as the Hurghada-city
 * airport column. Travel bags are not carried on this service.
 */
export const SENZO_MALL_FARE: Record<TransferVehicleClass, number | null> = {
  sedan: 15,
  suv: 18,
  minivan: 20,
  hiace: 30,
  minibus: 40,
};
export const SENZO_RESORT_SUPPLEMENT = 7;

export function lowestVehicleFare(): number {
  let lowest = Number.POSITIVE_INFINITY;
  for (const zone of TRANSFER_ZONE_KEYS) {
    for (const config of enabledVehicleClasses()) {
      const fare = ROUTE_PRICING[zone][config.vehicleClass];
      if (typeof fare === "number" && fare < lowest) lowest = fare;
    }
  }
  return Number.isFinite(lowest) ? lowest : 0;
}

/**
 * Extras pricing. Child seats are free unless operations sets a fee here.
 * `oversizedItemFee` is charged per declared oversized item on top of the fare;
 * kept at 0 today because oversized items are handled by upsizing the vehicle,
 * not by surcharge.
 */
export const EXTRAS_CONFIG = {
  childSeatPrice: { infant: 0, child: 0, booster: 0 } as Record<ChildSeatType, number>,
  oversizedItemFee: 0,
};

/**
 * How many large-suitcase-equivalent slots each oversized item consumes.
 * Deliberately conservative. Not a safety guarantee — large declarations still
 * upsize the vehicle or trigger manual confirmation.
 */
export const OVERSIZED_LUGGAGE_EQUIVALENT: Record<OversizedItemType, number> = {
  golf_bag: 2,
  kitesurf: 2,
  windsurf: 3,
  diving_equipment: 2,
  bicycle: 3,
  surfboard: 3,
  wheelchair: 2,
  baby_stroller: 1,
  other: 2,
};

/**
 * Declaring this many of an oversized type (or more) routes the booking to
 * manual confirmation instead of an instant quote. 0 disables the check.
 */
export const OVERSIZED_MANUAL_CONFIRMATION_THRESHOLD: Record<OversizedItemType, number> = {
  golf_bag: 0,
  kitesurf: 3,
  windsurf: 2,
  diving_equipment: 0,
  bicycle: 1,
  surfboard: 2,
  wheelchair: 0,
  baby_stroller: 0,
  other: 1,
};

export const ALLOCATION_CONFIG = {
  /** Maximum vehicles the allocator will dispatch automatically before it asks for manual confirmation. */
  maxVehiclesAutoAllocated: 2,
  /** Hard ceiling on passengers for an instant quote regardless of fleet maths. */
  manualConfirmationPassengerThreshold: 20,
  /** Upper bounds for form inputs. */
  maxAdults: 20,
  maxChildren: 20,
  maxInfants: 10,
  maxLargeBags: 30,
  maxCabinBags: 30,
};

/**
 * Hotel / accommodation name -> pricing zone. First matching pattern wins;
 * patterns are matched case-insensitively as substrings. If nothing matches
 * the address is treated as central Hurghada. Callers that need an explicit
 * "unknown -> price confirmation required" outcome pass the zone directly.
 */
const HOTEL_ZONE_PATTERNS: { zone: TransferZoneKey; patterns: string[] }[] = [
  { zone: "makadi_bay", patterns: ["makadi"] },
  { zone: "sahl_hasheesh", patterns: ["sahl hasheesh", "sahl hashish", "citadel azur", "pyramisa beach", "premier le reve", "tropitel sahl"] },
  { zone: "el_gouna", patterns: ["el gouna", "elgouna", "el-gouna", "gouna", "abu tig", "mosaique", "steigenberger golf", "captain's inn", "captains inn"] },
  { zone: "soma_bay", patterns: ["soma bay", "somabay", "kempinski soma", "sheraton soma", "la residence des cascades", "the breakers"] },
  { zone: "safaga", patterns: ["safaga", "safage", "lotus bay", "shams safaga", "menaville"] },
  { zone: "el_quseir", patterns: ["quseir", "qusseir", "el qoseir", "movenpick el quseir", "flamenco beach"] },
  { zone: "port_ghalib", patterns: ["port ghalib", "port-ghalib", "portghalib", "marina lodge", "sands port ghalib"] },
  { zone: "marsa_alam", patterns: ["marsa alam", "marsa-alam", "coraya bay", "madinat coraya", "abu dabbab", "wadi lahmy", "hamata", "shagra", "marsa nakari"] },
  { zone: "el_ahyaa", patterns: ["el ahyaa", "el ahia", "ahyaa", "el ahaya", "el-ahyaa", "north hurghada", "northern hurghada"] },
  {
    zone: "hurghada_city",
    patterns: [
      "hurghada", "el dahar", "dahar", "sekalla", "sakkala", "el mamsha", "mamsha", "village road", "marina boulevard",
      "sheraton road", "sheraton street", "el kawther", "kawthar", "el helal", "intercontinental hurghada", "sunrise garden",
      "steigenberger aqua magic", "steigenberger al dau", "aldau", "sunny days", "titanic", "arabia azur", "sindbad",
      "hurghada marina", "old vic", "senzo",
    ],
  },
];

export function mapHotelToZone(hotelText: string | undefined | null): TransferZoneKey | null {
  const normalized = String(hotelText ?? "").trim().toLowerCase();
  if (!normalized) return null;
  for (const entry of HOTEL_ZONE_PATTERNS) {
    if (entry.patterns.some((pattern) => normalized.includes(pattern))) return entry.zone;
  }
  return null;
}

export function isTransferZoneKey(value: unknown): value is TransferZoneKey {
  return typeof value === "string" && (TRANSFER_ZONE_KEYS as string[]).includes(value);
}

export function routeFare(zone: TransferZoneKey, vehicleClass: TransferVehicleClass): number | null {
  return ROUTE_PRICING[zone]?.[vehicleClass] ?? null;
}
