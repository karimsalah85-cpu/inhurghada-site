import { describe, expect, it } from "vitest";
import { calculateTransferQuote, calculateSenzoQuote, allocateVehicles, type TransferQuoteInput } from "@/lib/transfer-quote";
import { ROUTE_PRICING, VEHICLE_CLASSES, enabledVehicleClasses, lowestVehicleFare } from "@/lib/transfer-config";
import { validateBookingInput } from "@/lib/booking-validation";
import { calculateBookingPrice } from "@/lib/booking-pricing";

const base: TransferQuoteInput = {
  direction: "airport_to_hotel",
  zone: "hurghada_city",
  tripType: "one_way",
  adults: 1,
  children: 0,
  infants: 0,
  largeBags: 0,
  cabinBags: 0,
};

const quote = (overrides: Partial<TransferQuoteInput>) => calculateTransferQuote({ ...base, ...overrides });
const classesOf = (input: Partial<TransferQuoteInput>) => quote(input).legVehicles.map((vehicle) => vehicle.vehicleClass);
const fare = (zone: keyof typeof ROUTE_PRICING, cls: "sedan" | "hiace") => ROUTE_PRICING[zone][cls] as number;

describe("transfer fleet configuration", () => {
  it("exposes only Sedan and Hiace as bookable classes", () => {
    expect(enabledVehicleClasses().map((config) => config.vehicleClass)).toEqual(["sedan", "hiace"]);
  });

  it("derives the advertised 'from' fare from the central matrix", () => {
    expect(lowestVehicleFare()).toBe(fare("hurghada_city","sedan"));
    expect(lowestVehicleFare()).toBe(15);
  });
});

describe("vehicle allocation (constraint based, not passenger count)", () => {
  it("1 passenger, city -> Sedan", () => {
    expect(classesOf({ adults: 1 })).toEqual(["sedan"]);
    expect(quote({ adults: 1 }).total).toBe(fare("hurghada_city","sedan"));
  });

  it("3 passengers, city -> Sedan", () => {
    expect(classesOf({ adults: 3 })).toEqual(["sedan"]);
    expect(quote({ adults: 3 }).total).toBe(15);
  });

  it("4 passengers -> upgrades past the Sedan to a Hiace", () => {
    expect(classesOf({ adults: 4 })).toEqual(["hiace"]);
    expect(quote({ adults: 4 }).total).toBe(fare("hurghada_city","hiace"));
  });

  it("7 passengers, city -> single Hiace", () => {
    expect(classesOf({ adults: 7 })).toEqual(["hiace"]);
  });

  it("8 passengers -> Hiace", () => {
    expect(classesOf({ adults: 8 })).toEqual(["hiace"]);
  });

  it("10 passengers -> Hiace", () => {
    expect(classesOf({ adults: 10 })).toEqual(["hiace"]);
  });

  it("11 passengers -> two vehicles (Hiace + Sedan), priced from the real allocation", () => {
    const result = quote({ adults: 11 });
    expect(result.legVehicles.map((vehicle) => vehicle.vehicleClass)).toEqual(["hiace", "sedan"]);
    expect(result.vehicleCount).toBe(2);
    expect(result.total).toBe(fare("hurghada_city","hiace") + fare("hurghada_city","sedan"));
    expect(result.warnings).toContain("multiple_vehicles");
    expect(result.requiresManualConfirmation).toBe(false);
  });

  it("3 passengers + 6 large suitcases -> larger vehicle than a Sedan", () => {
    const result = quote({ adults: 3, largeBags: 6 });
    expect(result.legVehicles.map((vehicle) => vehicle.vehicleClass)).toEqual(["hiace"]);
    expect(result.warnings).toContain("vehicle_upsized_for_luggage");
  });

  it("counts infants toward seating capacity", () => {
    expect(quote({ adults: 2, infants: 2 }).totalPassengers).toBe(4);
    expect(classesOf({ adults: 2, infants: 2 })).toEqual(["hiace"]);
  });

  it("counts children toward seating capacity", () => {
    expect(classesOf({ adults: 2, children: 2 })).toEqual(["hiace"]);
  });

  it("treats a folding manual wheelchair as luggage, not a blocker", () => {
    const result = quote({ adults: 2, wheelchair: "folding_manual" });
    expect(result.requiresManualConfirmation).toBe(false);
    expect(result.legVehicles.map((vehicle) => vehicle.vehicleClass)).toEqual(["sedan"]);
    expect(result.warnings).toContain("folding_wheelchair_space");
  });

  it("considers a stroller as declared luggage that can upsize the vehicle", () => {
    const result = quote({ adults: 2, largeBags: 2, oversizedItems: [{ type: "baby_stroller", quantity: 1 }] });
    expect(result.effectiveLargeBagUnits).toBe(3);
    expect(result.legVehicles.map((vehicle) => vehicle.vehicleClass)).toEqual(["hiace"]);
    expect(result.warnings).toContain("oversized_declared");
  });

  it("considers oversized sports equipment against luggage capacity", () => {
    expect(classesOf({ adults: 2, oversizedItems: [{ type: "golf_bag", quantity: 1 }] })).toEqual(["sedan"]);
    expect(classesOf({ adults: 2, largeBags: 1, oversizedItems: [{ type: "golf_bag", quantity: 1 }] })).toEqual(["hiace"]);
  });
});

describe("manual confirmation states (no invented price)", () => {
  const expectManual = (result: ReturnType<typeof calculateTransferQuote>, reason: string) => {
    expect(result.ok).toBe(false);
    expect(result.requiresManualConfirmation).toBe(true);
    expect(result.reason).toBe(reason);
    expect(result.total).toBe(0);
  };

  it("powered / fixed wheelchair -> accessible vehicle confirmation", () => {
    expectManual(quote({ adults: 3, wheelchair: "powered_or_fixed" }), "powered_wheelchair");
  });

  it("unmapped route -> manual confirmation", () => {
    expectManual(quote({ zone: null }), "route_not_mapped");
  });

  it("hotel-to-hotel -> manual confirmation", () => {
    expectManual(quote({ direction: "hotel_to_hotel" }), "hotel_to_hotel");
  });

  it("a declared bicycle -> manual confirmation", () => {
    expectManual(quote({ adults: 2, oversizedItems: [{ type: "bicycle", quantity: 1 }] }), "oversized_needs_confirmation");
  });

  it("luggage beyond the two-vehicle boot capacity -> manual confirmation", () => {
    expectManual(quote({ adults: 6, largeBags: 30 }), "luggage_exceeds_fleet");
  });

  it("a group beyond the auto-allocation ceiling -> manual confirmation", () => {
    expectManual(quote({ adults: 15, children: 15 }), "group_exceeds_fleet");
  });
});

describe("child seats", () => {
  it("keeps child seats free and out of the passenger count", () => {
    const result = quote({ adults: 2, children: 1, childSeats: { infant: 1, booster: 1 } });
    expect(result.totalPassengers).toBe(3);
    expect(result.extras).toBe(0);
    expect(result.total).toBe(fare("hurghada_city","sedan"));
  });
});

describe("round trip pricing", () => {
  it("is outbound + return with no invented discount", () => {
    const oneWay = quote({ adults: 2, zone: "el_gouna" });
    const roundTrip = quote({ adults: 2, zone: "el_gouna", tripType: "round_trip" });
    expect(roundTrip.total).toBe(oneWay.total * 2);
    expect(roundTrip.vehicleCount).toBe(2);
    expect(roundTrip.allocatedVehicles).toEqual([{ vehicleClass: "sedan", labelKey: VEHICLE_CLASSES.sedan.labelKey, count: 2 }]);
  });
});

describe("final QA scenarios", () => {
  it("Scenario 1: Airport -> Hurghada, 2 adults, 2 suitcases => Sedan $15", () => {
    const result = quote({ adults: 2, largeBags: 2 });
    expect(result.legVehicles.map((vehicle) => vehicle.vehicleClass)).toEqual(["sedan"]);
    expect(result.total).toBe(15);
  });

  it("Scenario 3: Airport -> El Gouna, 6 passengers, 5 suitcases => single Hiace at the El Gouna Hiace fare", () => {
    // Fleet is Sedan + Hiace only (no Minivan), so 4-7 pax ride a Hiace.
    const result = quote({ adults: 6, largeBags: 5, zone: "el_gouna" });
    expect(result.legVehicles.map((vehicle) => vehicle.vehicleClass)).toEqual(["hiace"]);
    expect(result.total).toBe(fare("el_gouna","hiace"));
  });

  it("Scenario 4: Airport -> Sahl Hasheesh, 9 passengers, 7 suitcases => Hiace $35", () => {
    const result = quote({ adults: 9, largeBags: 7, zone: "sahl_hasheesh" });
    expect(result.legVehicles.map((vehicle) => vehicle.vehicleClass)).toEqual(["hiace"]);
    expect(result.total).toBe(35);
  });

  it("Scenario 5: Airport -> Hurghada, 12 passengers => two vehicles, never overloaded", () => {
    const result = quote({ adults: 12 });
    expect(result.vehicleCount).toBe(2);
    const seats = result.legVehicles.reduce((sum, vehicle) => sum + vehicle.passengerCapacity, 0);
    expect(seats).toBeGreaterThanOrEqual(12);
  });

  it("Scenario 9: round trip Airport <-> El Gouna, 5 passengers => Hiace both legs, total = outbound + inbound", () => {
    const result = quote({ adults: 5, zone: "el_gouna", tripType: "round_trip" });
    expect(result.allocatedVehicles).toEqual([{ vehicleClass: "hiace", labelKey: VEHICLE_CLASSES.hiace.labelKey, count: 2 }]);
    expect(result.total).toBe(fare("el_gouna","hiace") * 2);
  });
});

describe("server authority: a client-sent price cannot change the fare", () => {
  const now = new Date("2026-01-10T08:00:00Z");
  const future = "2026-02-01";
  const submitted = {
    type: "transfer",
    transferProduct: "airport-v2",
    idempotencyKey: "11111111-1111-4111-8111-111111111111",
    locale: "en",
    customerName: "Test Traveller",
    phone: "+201000000000",
    customerEmail: "traveller@example.com",
    hotel: "Steigenberger Aqua Magic, Hurghada",
    direction: "airport_to_hotel",
    zone: "hurghada_city",
    tripType: "one_way",
    date: future,
    time: "12:00",
    adults: 2,
    children: 0,
    infants: 0,
    largeBags: 2,
    cabinBags: 1,
    // Hostile fields the browser must not be able to use:
    price: "$1.00 total",
    amount: 1,
    total: 1,
  };

  it("recomputes the total from inputs, ignoring the submitted price", () => {
    const validation = validateBookingInput(submitted, now);
    expect("data" in validation && validation.data).toBeTruthy();
    if (!("data" in validation) || !validation.data) throw new Error("validation failed");
    expect(validation.data.transfer).toBeDefined();

    const pricing = calculateBookingPrice(validation.data);
    expect("data" in pricing && pricing.data).toBeTruthy();
    if (!("data" in pricing) || !pricing.data) throw new Error("pricing failed");
    expect(pricing.data.amount).toBe(fare("hurghada_city", "sedan"));
    expect(pricing.data.amount).not.toBe(1);
    expect(pricing.data.currency).toBe("USD");
  });

  it("maps the hotel name to a pricing zone when no explicit zone is sent", () => {
    const validation = validateBookingInput({ ...submitted, zone: undefined, hotel: "Kempinski Hotel Soma Bay" }, now);
    if (!("data" in validation) || !validation.data?.transfer) throw new Error("validation failed");
    expect(validation.data.transfer.zone).toBe("soma_bay");
    const pricing = calculateBookingPrice(validation.data);
    if (!("data" in pricing) || !pricing.data) throw new Error("pricing failed");
    expect(pricing.data.amount).toBe(fare("soma_bay", "sedan"));
  });

  it("returns a zero-amount manual-confirmation quote for a powered wheelchair", () => {
    const validation = validateBookingInput({ ...submitted, wheelchair: "powered_or_fixed" }, now);
    if (!("data" in validation) || !validation.data) throw new Error("validation failed");
    const pricing = calculateBookingPrice(validation.data);
    if (!("data" in pricing) || !pricing.data) throw new Error("pricing failed");
    expect(pricing.data.amount).toBe(0);
    expect(pricing.data.price.toLowerCase()).toContain("quote");
  });
});

describe("Senzo Mall shuttle: passenger count drives vehicle and price", () => {
  it("1-3 passengers -> private sedan at the Senzo sedan fare", () => {
    for (const passengers of [1, 2, 3]) {
      const quote = calculateSenzoQuote({ passengers });
      expect(quote.ok).toBe(true);
      expect(quote.allocatedVehicles).toEqual([{ vehicleClass: "sedan", labelKey: VEHICLE_CLASSES.sedan.labelKey, count: 1 }]);
      expect(quote.total).toBe(15);
    }
  });

  it("4-10 passengers -> private van at the Senzo hiace fare", () => {
    for (const passengers of [4, 7, 10]) {
      const quote = calculateSenzoQuote({ passengers });
      expect(quote.allocatedVehicles).toEqual([{ vehicleClass: "hiace", labelKey: VEHICLE_CLASSES.hiace.labelKey, count: 1 }]);
      expect(quote.total).toBe(30);
    }
  });

  it("11+ passengers -> two vehicles, summed from the real allocation", () => {
    const quote = calculateSenzoQuote({ passengers: 12 });
    expect(quote.vehicleCount).toBe(2);
    expect(quote.total).toBe(30 + 15);
  });

  it("adds the resort supplement once and rejects travel bags", () => {
    expect(calculateSenzoQuote({ passengers: 2, resortZone: true }).total).toBe(22);
    expect(calculateSenzoQuote({ passengers: 2, travelBags: 1 }).ok).toBe(false);
    expect(calculateSenzoQuote({ passengers: 2, travelBags: 1 }).reason).toBe("bags_not_allowed");
  });

  it("returns a no-price group_exceeds_fleet result beyond the ceiling", () => {
    const quote = calculateSenzoQuote({ passengers: 40 });
    expect(quote.ok).toBe(false);
    expect(quote.reason).toBe("group_exceeds_fleet");
    expect(quote.total).toBe(0);
  });
});

describe("allocateVehicles primitive", () => {
  it("prefers one vehicle over two when a single class is safe", () => {
    expect(allocateVehicles({ passengers: 3, largeBagUnits: 2, cabinBags: 0 })).toEqual(["sedan"]);
    expect(allocateVehicles({ passengers: 9, largeBagUnits: 8, cabinBags: 0 })).toEqual(["hiace"]);
  });

  it("returns null when demand cannot be met within the ceiling", () => {
    expect(allocateVehicles({ passengers: 40, largeBagUnits: 0, cabinBags: 0 })).toBeNull();
  });
});
