/**
 * Authoritative pricing + vehicle-allocation for Hurghada private airport transfers.
 *
 * This module is pure and shared by the browser (live quote in the booking form)
 * and the server (booking validation). The server MUST re-run `calculateTransferQuote`
 * from the submitted inputs and never trust a client-sent total.
 *
 * Allocation is constraint-based, not passenger-count-based:
 *   - every adult, child and infant occupies a seat;
 *   - large bags + oversized-item equivalents must fit the boot;
 *   - the smallest safe single vehicle wins; only if none fits do we split;
 *   - powered / fixed wheelchairs, unmapped routes, oversized items above their
 *     threshold and groups beyond the auto-allocation ceiling return
 *     `requiresManualConfirmation` with no invented price.
 */

import {
  ALLOCATION_CONFIG,
  EXTRAS_CONFIG,
  OVERSIZED_LUGGAGE_EQUIVALENT,
  OVERSIZED_MANUAL_CONFIRMATION_THRESHOLD,
  PRICING_VERSION,
  ROUTE_PRICING,
  TRANSFER_CURRENCY,
  VEHICLE_CLASSES,
  ZONE_LABEL_KEYS,
  enabledVehicleClasses,
  type ChildSeatType,
  type OversizedItemType,
  type TransferDirection,
  type TransferTripType,
  type TransferVehicleClass,
  type TransferZoneKey,
  type WheelchairRequirement,
} from "@/lib/transfer-config";

export type OversizedItemInput = { type: OversizedItemType; quantity: number };
export type ChildSeatInput = Partial<Record<ChildSeatType, number>>;

export type TransferQuoteInput = {
  direction: TransferDirection;
  /** Resolved pricing zone. `null` means the route could not be mapped. */
  zone: TransferZoneKey | null;
  tripType: TransferTripType;
  adults: number;
  children: number;
  infants: number;
  largeBags: number;
  cabinBags: number;
  oversizedItems?: OversizedItemInput[];
  childSeats?: ChildSeatInput;
  wheelchair?: WheelchairRequirement;
};

export type AllocatedVehicle = {
  vehicleClass: TransferVehicleClass;
  labelKey: string;
  passengerCapacity: number;
  largeBagCapacity: number;
  legFare: number;
};

export type ManualConfirmationReason =
  | "route_not_mapped"
  | "zone_unpriced"
  | "hotel_to_hotel"
  | "powered_wheelchair"
  | "oversized_needs_confirmation"
  | "group_exceeds_fleet"
  | "luggage_exceeds_fleet"
  | "invalid_passengers";

export type TransferQuote = {
  ok: boolean;
  currency: typeof TRANSFER_CURRENCY;
  pricingVersion: string;
  zone: TransferZoneKey | null;
  zoneLabelKey: string | null;
  tripType: TransferTripType;
  totalPassengers: number;
  largeBags: number;
  cabinBags: number;
  effectiveLargeBagUnits: number;
  /** Vehicles for ONE leg. */
  legVehicles: AllocatedVehicle[];
  /** Vehicles for the whole journey (legVehicles for one way, doubled for round trip). */
  allocatedVehicles: { vehicleClass: TransferVehicleClass; labelKey: string; count: number }[];
  vehicleCount: number;
  legSubtotal: number;
  subtotal: number;
  extras: number;
  total: number;
  requiresManualConfirmation: boolean;
  reason: ManualConfirmationReason | null;
  /** Machine-readable keys the UI turns into friendly warnings. */
  warnings: string[];
};

function toWholeNumber(value: unknown, min: number, max: number): number {
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed) || parsed < min) return min;
  return Math.min(parsed, max);
}

function manualQuote(
  input: TransferQuoteInput,
  reason: ManualConfirmationReason,
  totalPassengers: number,
  warnings: string[],
): TransferQuote {
  return {
    ok: false,
    currency: TRANSFER_CURRENCY,
    pricingVersion: PRICING_VERSION,
    zone: input.zone,
    zoneLabelKey: input.zone ? ZONE_LABEL_KEYS[input.zone] : null,
    tripType: input.tripType,
    totalPassengers,
    largeBags: toWholeNumber(input.largeBags, 0, ALLOCATION_CONFIG.maxLargeBags),
    cabinBags: toWholeNumber(input.cabinBags, 0, ALLOCATION_CONFIG.maxCabinBags),
    effectiveLargeBagUnits: 0,
    legVehicles: [],
    allocatedVehicles: [],
    vehicleCount: 0,
    legSubtotal: 0,
    subtotal: 0,
    extras: 0,
    total: 0,
    requiresManualConfirmation: true,
    reason,
    warnings,
  };
}

/** Large-suitcase-equivalent slots consumed by declared oversized items. */
export function oversizedBagUnits(items: OversizedItemInput[] | undefined): number {
  if (!items?.length) return 0;
  return items.reduce((sum, item) => {
    const quantity = toWholeNumber(item.quantity, 0, 40);
    return sum + quantity * (OVERSIZED_LUGGAGE_EQUIVALENT[item.type] ?? 2);
  }, 0);
}

function oversizedForcesManualConfirmation(items: OversizedItemInput[] | undefined): boolean {
  if (!items?.length) return false;
  return items.some((item) => {
    const threshold = OVERSIZED_MANUAL_CONFIRMATION_THRESHOLD[item.type] ?? 0;
    return threshold > 0 && toWholeNumber(item.quantity, 0, 40) >= threshold;
  });
}

type Demand = { passengers: number; largeBagUnits: number; cabinBags: number };

/**
 * Smallest safe combination of enabled vehicles that satisfies the demand.
 * Returns null when the demand cannot be met within the auto-allocation ceiling.
 */
export function allocateVehicles(demand: Demand): TransferVehicleClass[] | null {
  const fleet = enabledVehicleClasses();
  if (!fleet.length) return null;

  // 1. Try a single vehicle: the smallest class that covers passengers AND bags.
  const single = fleet.find(
    (config) =>
      config.passengerCapacity >= demand.passengers &&
      config.largeBagCapacity >= demand.largeBagUnits &&
      config.cabinBagCapacity >= demand.cabinBags,
  );
  if (single) return [single.vehicleClass];

  // 2. Split across multiple vehicles, largest-first, up to the configured ceiling.
  const largest = fleet[fleet.length - 1];
  const chosen: TransferVehicleClass[] = [];
  let passengers = demand.passengers;
  let bagUnits = demand.largeBagUnits;
  let cabinBags = demand.cabinBags;

  while ((passengers > 0 || bagUnits > 0 || cabinBags > 0) && chosen.length < ALLOCATION_CONFIG.maxVehiclesAutoAllocated) {
    const remainingSlots = ALLOCATION_CONFIG.maxVehiclesAutoAllocated - chosen.length;
    // On the final allowed vehicle, downsize to the smallest class that finishes the job.
    const finisher =
      remainingSlots === 1
        ? fleet.find(
            (config) =>
              config.passengerCapacity >= passengers &&
              config.largeBagCapacity >= bagUnits &&
              config.cabinBagCapacity >= cabinBags,
          )
        : undefined;
    const pick = finisher ?? largest;
    chosen.push(pick.vehicleClass);
    passengers -= pick.passengerCapacity;
    bagUnits -= pick.largeBagCapacity;
    cabinBags -= pick.cabinBagCapacity;
  }

  if (passengers > 0 || bagUnits > 0 || cabinBags > 0) return null;
  return chosen.sort(
    (left, right) => VEHICLE_CLASSES[right].passengerCapacity - VEHICLE_CLASSES[left].passengerCapacity,
  );
}

function childSeatExtras(childSeats: ChildSeatInput | undefined): number {
  if (!childSeats) return 0;
  return (Object.keys(EXTRAS_CONFIG.childSeatPrice) as ChildSeatType[]).reduce((sum, seatType) => {
    const quantity = toWholeNumber(childSeats[seatType], 0, 20);
    return sum + quantity * EXTRAS_CONFIG.childSeatPrice[seatType];
  }, 0);
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateTransferQuote(rawInput: TransferQuoteInput): TransferQuote {
  const input: TransferQuoteInput = {
    ...rawInput,
    adults: toWholeNumber(rawInput.adults, 0, ALLOCATION_CONFIG.maxAdults),
    children: toWholeNumber(rawInput.children, 0, ALLOCATION_CONFIG.maxChildren),
    infants: toWholeNumber(rawInput.infants, 0, ALLOCATION_CONFIG.maxInfants),
    largeBags: toWholeNumber(rawInput.largeBags, 0, ALLOCATION_CONFIG.maxLargeBags),
    cabinBags: toWholeNumber(rawInput.cabinBags, 0, ALLOCATION_CONFIG.maxCabinBags),
    wheelchair: rawInput.wheelchair ?? "none",
    oversizedItems: rawInput.oversizedItems ?? [],
    childSeats: rawInput.childSeats ?? {},
  };

  const totalPassengers = input.adults + input.children + input.infants;
  const warnings: string[] = [];

  if (totalPassengers < 1) {
    return manualQuote(input, "invalid_passengers", totalPassengers, ["add_passengers"]);
  }

  if (input.direction === "hotel_to_hotel") {
    return manualQuote(input, "hotel_to_hotel", totalPassengers, ["hotel_to_hotel_manual"]);
  }
  if (!input.zone) {
    return manualQuote(input, "route_not_mapped", totalPassengers, ["route_not_mapped"]);
  }
  if (input.wheelchair === "powered_or_fixed") {
    return manualQuote(input, "powered_wheelchair", totalPassengers, ["accessible_vehicle_confirmation"]);
  }
  if (oversizedForcesManualConfirmation(input.oversizedItems)) {
    return manualQuote(input, "oversized_needs_confirmation", totalPassengers, ["oversized_confirmation"]);
  }
  if (totalPassengers > ALLOCATION_CONFIG.manualConfirmationPassengerThreshold) {
    return manualQuote(input, "group_exceeds_fleet", totalPassengers, ["large_group_confirmation"]);
  }

  const foldingWheelchairUnits = input.wheelchair === "folding_manual" ? OVERSIZED_LUGGAGE_EQUIVALENT.wheelchair : 0;
  const oversizedUnits = oversizedBagUnits(input.oversizedItems);
  const effectiveLargeBagUnits = input.largeBags + oversizedUnits + foldingWheelchairUnits;

  const allocation = allocateVehicles({
    passengers: totalPassengers,
    largeBagUnits: effectiveLargeBagUnits,
    cabinBags: input.cabinBags,
  });

  if (!allocation) {
    const fleet = enabledVehicleClasses();
    const maxPassengers = fleet.length
      ? fleet[fleet.length - 1].passengerCapacity * ALLOCATION_CONFIG.maxVehiclesAutoAllocated
      : 0;
    const reason: ManualConfirmationReason = totalPassengers > maxPassengers ? "group_exceeds_fleet" : "luggage_exceeds_fleet";
    return manualQuote(input, reason, totalPassengers, [reason]);
  }

  const zone = input.zone;
  const legVehicles: AllocatedVehicle[] = [];
  for (const vehicleClass of allocation) {
    const config = VEHICLE_CLASSES[vehicleClass];
    const legFare = ROUTE_PRICING[zone][vehicleClass];
    if (typeof legFare !== "number") {
      return manualQuote(input, "zone_unpriced", totalPassengers, ["zone_unpriced"]);
    }
    legVehicles.push({
      vehicleClass,
      labelKey: config.labelKey,
      passengerCapacity: config.passengerCapacity,
      largeBagCapacity: config.largeBagCapacity,
      legFare,
    });
  }

  // Warnings that still allow an instant quote.
  const smallestSingle = enabledVehicleClasses()[0];
  if (legVehicles.length > 1) warnings.push("multiple_vehicles");
  if (
    legVehicles.length === 1 &&
    smallestSingle &&
    legVehicles[0].vehicleClass !== smallestSingle.vehicleClass &&
    totalPassengers <= smallestSingle.passengerCapacity
  ) {
    // Upsized purely because of luggage, not passenger count.
    warnings.push("vehicle_upsized_for_luggage");
  }
  if (input.wheelchair === "folding_manual") warnings.push("folding_wheelchair_space");
  if ((input.oversizedItems?.length ?? 0) > 0) warnings.push("oversized_declared");

  const legTerms = input.tripType === "round_trip" ? 2 : 1;
  const legSubtotal = round2(legVehicles.reduce((sum, vehicle) => sum + vehicle.legFare, 0));
  const subtotal = round2(legSubtotal * legTerms);
  const extras = round2(childSeatExtras(input.childSeats) * legTerms);
  const total = round2(subtotal + extras);

  const grouped = new Map<TransferVehicleClass, { labelKey: string; count: number }>();
  for (const vehicle of legVehicles) {
    const existing = grouped.get(vehicle.vehicleClass);
    if (existing) existing.count += legTerms;
    else grouped.set(vehicle.vehicleClass, { labelKey: vehicle.labelKey, count: legTerms });
  }

  return {
    ok: true,
    currency: TRANSFER_CURRENCY,
    pricingVersion: PRICING_VERSION,
    zone,
    zoneLabelKey: ZONE_LABEL_KEYS[zone],
    tripType: input.tripType,
    totalPassengers,
    largeBags: input.largeBags,
    cabinBags: input.cabinBags,
    effectiveLargeBagUnits,
    legVehicles,
    allocatedVehicles: [...grouped.entries()].map(([vehicleClass, value]) => ({
      vehicleClass,
      labelKey: value.labelKey,
      count: value.count,
    })),
    vehicleCount: legVehicles.length * legTerms,
    legSubtotal,
    subtotal,
    extras,
    total,
    requiresManualConfirmation: false,
    reason: null,
    warnings,
  };
}
