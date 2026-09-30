import { describe, expect, it } from "vitest";
import {
  buildHotelIndex, createZoneLookup, findUnmatchedHotels, loadPickupZoneData, matchHotel, normalizeHotelName, parseAliases, shortTime,
  validateHotel, validateZone, validateZoneTime, type HotelRow, type PickupZoneData,
} from "@/lib/pickup-zones";

const ZONE_SAHL = "10000000-0000-4000-8000-000000000001";
const ZONE_CENTRE = "10000000-0000-4000-8000-000000000002";
const hotel = (over: Partial<HotelRow> & { name: string }): HotelRow => ({ id: over.name, normalized_name: normalizeHotelName(over.name), aliases: [], zone_id: null, active: true, ...over });

const hotels: HotelRow[] = [
  hotel({ id: "h1", name: "Steigenberger Aqua Magic", zone_id: ZONE_CENTRE, aliases: ["Aqua Magic", "Steigenberger Aquamagic"] }),
  hotel({ id: "h2", name: "Baron Palace Sahl Hasheesh", zone_id: ZONE_SAHL }),
  hotel({ id: "h3", name: "Hilton Hurghada Plaza", zone_id: ZONE_CENTRE }),
  hotel({ id: "h4", name: "Hilton Hurghada Resort", zone_id: ZONE_CENTRE }),
  hotel({ id: "h5", name: "Albatros Citadel Resort", zone_id: ZONE_SAHL, active: false }),
];

describe("normalizeHotelName", () => {
  it("lower-cases, strips punctuation, and drops filler words", () => {
    expect(normalizeHotelName("Steigenberger Aqua Magic")).toBe("steigenberger aqua magic");
    expect(normalizeHotelName("  steigenberger aqua magic hotel ")).toBe("steigenberger aqua magic");
    expect(normalizeHotelName("The Steigenberger Aqua-Magic Hotel & Resort")).toBe("steigenberger aqua magic");
    expect(normalizeHotelName("Sunrise Holidays Resort and Spa")).toBe("sunrise holidays");
  });

  it("strips accents and apostrophes", () => {
    expect(normalizeHotelName("Mövenpick Resort El Quseir")).toBe("movenpick el quseir");
    expect(normalizeHotelName("Premier Le Rêve Hotel & Spa")).toBe("premier le reve");
    expect(normalizeHotelName("Jaz Aquamarine's")).toBe("jaz aquamarines");
  });

  it("keeps the words when only filler is left, and handles empty input", () => {
    expect(normalizeHotelName("The Resort")).toBe("the resort");
    expect(normalizeHotelName("   ")).toBe("");
    expect(normalizeHotelName(null)).toBe("");
  });
});

describe("matchHotel", () => {
  const index = buildHotelIndex(hotels);

  it("matches the same hotel however it was typed", () => {
    expect(matchHotel("Steigenberger Aqua Magic", index)?.id).toBe("h1");
    expect(matchHotel("steigenberger aqua magic hotel", index)?.id).toBe("h1");
    expect(matchHotel("STEIGENBERGER AQUA MAGIC.", index)?.id).toBe("h1");
    expect(matchHotel("Baron Palace Sahl Hasheesh", index)?.id).toBe("h2");
    expect(matchHotel("The Baron Palace Resort Sahl Hasheesh", index)?.id).toBe("h2");
  });

  it("matches aliases", () => {
    expect(matchHotel("Aqua Magic", index)?.id).toBe("h1");
    expect(matchHotel("Steigenberger AquaMagic Hotel", index)?.id).toBe("h1");
  });

  it("allows a room number after the name", () => {
    expect(matchHotel("Steigenberger Aqua Magic room 214", index)?.id).toBe("h1");
    expect(matchHotel("Baron Palace Sahl Hasheesh, 1023", index)?.id).toBe("h2");
  });

  it("does not guess between similar hotels", () => {
    expect(matchHotel("Hilton Hurghada Plaza", index)?.id).toBe("h3");
    expect(matchHotel("Hilton Resort Hurghada", index)?.id).toBe("h4");
    expect(matchHotel("Hilton Hurghada Plaza Beach", index)).toBeNull();
    expect(matchHotel("Hilton", index)).toBeNull();
    expect(matchHotel("Baron Palace", index)).toBeNull();
    expect(matchHotel("Steigenberger Aqua Magic Beach Club", index)).toBeNull();
    expect(matchHotel("", index)).toBeNull();
  });
});

describe("createZoneLookup", () => {
  const data: PickupZoneData = {
    zones: [{ id: ZONE_SAHL, name: "Sahl Hasheesh", destination: "hurghada", active: true }, { id: ZONE_CENTRE, name: "Hurghada centre", destination: "hurghada", active: true }],
    hotels,
    times: [{ zone_id: ZONE_SAHL, tour_slug: "orange-bay", pickup_time: "07:15:00" }, { zone_id: ZONE_CENTRE, tour_slug: "orange-bay", pickup_time: "07:45:00" }],
  };

  it("gives the zone and its time for the tour", () => {
    const lookup = createZoneLookup(data);
    expect(lookup("Baron Palace Sahl Hasheesh", "orange-bay")).toMatchObject({ zone: { name: "Sahl Hasheesh" }, time: "07:15" });
    expect(lookup("steigenberger aqua magic hotel", "orange-bay")).toMatchObject({ zone: { name: "Hurghada centre" }, time: "07:45" });
  });

  it("gives the zone without a time when the tour has none", () => {
    expect(createZoneLookup(data)("Aqua Magic", "safari")).toMatchObject({ zone: { name: "Hurghada centre" }, time: null });
  });

  it("ignores inactive hotels and zones, and missing data", () => {
    expect(createZoneLookup(data)("Albatros Citadel", "orange-bay")).toMatchObject({ zone: null, time: null });
    const inactiveZone = { ...data, zones: data.zones.map((zone) => ({ ...zone, active: false })) };
    expect(createZoneLookup(inactiveZone)("Aqua Magic", "orange-bay")).toMatchObject({ zone: null, time: null });
    expect(createZoneLookup(null)("Aqua Magic", "orange-bay")).toEqual({ hotel: null, zone: null, time: null });
  });
});

describe("findUnmatchedHotels", () => {
  it("groups spellings of the same unknown hotel and skips known ones", () => {
    const rows = findUnmatchedHotels([
      { hotel: "Steigenberger Aqua Magic", date: "2026-09-01" },
      { hotel: "Sunrise Holidays Resort", date: "2026-09-02" },
      { hotel: "sunrise holidays", date: "2026-10-05" },
      { hotel: "Sunrise Holidays Resort", date: "2026-08-20" },
      { hotel: "Jaz Aquamarine", date: "2026-09-10" },
      { hotel: "  ", date: "2026-09-10" },
      { hotel: null, date: "2026-09-10" },
    ], hotels);
    expect(rows).toEqual([
      { text: "Sunrise Holidays Resort", normalized: "sunrise holidays", bookings: 3, firstDate: "2026-08-20", lastDate: "2026-10-05" },
      { text: "Jaz Aquamarine", normalized: "jaz aquamarine", bookings: 1, firstDate: "2026-09-10", lastDate: "2026-09-10" },
    ]);
  });
});

describe("validation", () => {
  it("validates zones", () => {
    expect(validateZone({ name: " Sahl Hasheesh ", destination: "hurghada" })).toEqual({ ok: true, value: { name: "Sahl Hasheesh", destination: "hurghada", notes: null, active: true } });
    expect(validateZone({ name: "", destination: "hurghada" }).ok).toBe(false);
    expect(validateZone({ name: "Luxor", destination: "luxor" }).ok).toBe(false);
  });

  it("validates hotels and computes the normalized name", () => {
    const result = validateHotel({ name: "Steigenberger Aqua Magic Hotel", zone_id: ZONE_CENTRE, aliases: "Aqua Magic, aqua magic, Steigenberger Aqua Magic" });
    expect(result).toEqual({ ok: true, value: { name: "Steigenberger Aqua Magic Hotel", normalized_name: "steigenberger aqua magic", aliases: ["Aqua Magic"], zone_id: ZONE_CENTRE, active: true } });
    expect(validateHotel({ name: "X", zone_id: "not-a-uuid" }).ok).toBe(false);
    expect(validateHotel({ name: "  " }).ok).toBe(false);
    expect(validateHotel({ name: "Jaz Aquamarine", zone_id: "" })).toMatchObject({ ok: true, value: { zone_id: null } });
  });

  it("parses aliases from lists or text", () => {
    expect(parseAliases(["A One", "a-one", "B"])).toEqual(["A One", "B"]);
    expect(parseAliases("A; B\nC")).toEqual(["A", "B", "C"]);
  });

  it("validates zone pickup times", () => {
    const slugs = new Set(["orange-bay"]);
    expect(validateZoneTime({ zone_id: ZONE_SAHL, tour_slug: "orange-bay", pickup_time: "07:30" }, slugs)).toEqual({ ok: true, value: { zone_id: ZONE_SAHL, tour_slug: "orange-bay", pickup_time: "07:30" } });
    expect(validateZoneTime({ zone_id: ZONE_SAHL, tour_slug: "orange-bay", pickup_time: "" }, slugs)).toMatchObject({ ok: true, value: { pickup_time: null } });
    expect(validateZoneTime({ zone_id: ZONE_SAHL, tour_slug: "orange-bay", pickup_time: "25:00" }, slugs).ok).toBe(false);
    expect(validateZoneTime({ zone_id: ZONE_SAHL, tour_slug: "orange-bay", pickup_time: "7:30am" }, slugs).ok).toBe(false);
    expect(validateZoneTime({ zone_id: ZONE_SAHL, tour_slug: "unknown", pickup_time: "07:30" }, slugs).ok).toBe(false);
    expect(validateZoneTime({ zone_id: "x", tour_slug: "orange-bay", pickup_time: "07:30" }, slugs).ok).toBe(false);
  });

  it("shortens times", () => {
    expect(shortTime("07:30:00")).toBe("07:30");
    expect(shortTime("24:10")).toBeNull();
    expect(shortTime(null)).toBeNull();
  });
});

describe("loadPickupZoneData", () => {
  const client = (error: { code: string; message: string } | null) => {
    const result = { data: error ? null : [], error };
    const chain: Record<string, unknown> = {};
    for (const method of ["select", "in", "limit"]) chain[method] = () => chain;
    chain.then = (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve);
    return { from: () => chain } as unknown as Parameters<typeof loadPickupZoneData>[0];
  };

  it("returns null when the tables are not migrated yet", async () => {
    expect(await loadPickupZoneData(client({ code: "42P01", message: "missing" }), ["orange-bay"])).toBeNull();
    expect(await loadPickupZoneData(client({ code: "PGRST205", message: "missing" }), ["orange-bay"])).toBeNull();
  });

  it("returns empty lists when the tables exist, and skips the query with no tours", async () => {
    expect(await loadPickupZoneData(client(null), ["orange-bay"])).toEqual({ zones: [], hotels: [], times: [] });
    expect(await loadPickupZoneData(client({ code: "42P01", message: "missing" }), [])).toBeNull();
  });
});
