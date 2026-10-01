import { describe, expect, it } from "vitest";
import {
  compactRequirementsSummary, readGuestRequirements, requirementRows, validateGuestRequirements,
} from "@/lib/guest-requirements";

describe("guest requirements validation", () => {
  it("accepts and trims a full requirements object, dropping empty fields", () => {
    const result = validateGuestRequirements({ nonSwimmers: 2, medical: "  Asthma,   inhaler on board ", dietary: "", certification: "open_water", certificationNumber: " SSI 123 ", other: null });
    expect(result).toEqual({ ok: true, value: { nonSwimmers: 2, medical: "Asthma, inhaler on board", certification: "open_water", certificationNumber: "SSI 123" } });
  });

  it("accepts an empty object (clears requirements) and treats 0 non-swimmers as none", () => {
    expect(validateGuestRequirements({})).toEqual({ ok: true, value: {} });
    expect(validateGuestRequirements({ nonSwimmers: 0 })).toEqual({ ok: true, value: {} });
    expect(validateGuestRequirements({ nonSwimmers: "3" })).toEqual({ ok: true, value: { nonSwimmers: 3 } });
  });

  it("rejects out-of-range or fractional non-swimmer counts", () => {
    for (const nonSwimmers of [-1, 1.5, 51, "abc", true]) expect(validateGuestRequirements({ nonSwimmers }).ok, String(nonSwimmers)).toBe(false);
  });

  it("enforces text lengths and types", () => {
    expect(validateGuestRequirements({ medical: "x".repeat(501) })).toMatchObject({ ok: false });
    expect(validateGuestRequirements({ medical: "x".repeat(500) }).ok).toBe(true);
    expect(validateGuestRequirements({ dietary: "x".repeat(201) })).toMatchObject({ ok: false });
    expect(validateGuestRequirements({ other: 12 })).toMatchObject({ ok: false });
  });

  it("rejects unknown keys, bad certification levels and non-objects", () => {
    expect(validateGuestRequirements({ swimmers: 1 })).toMatchObject({ ok: false });
    expect(validateGuestRequirements({ certification: "master" })).toMatchObject({ ok: false });
    expect(validateGuestRequirements(null)).toMatchObject({ ok: false });
    expect(validateGuestRequirements([])).toMatchObject({ ok: false });
  });

  it("requires a certification level when a certification number is given", () => {
    expect(validateGuestRequirements({ certificationNumber: "123" })).toMatchObject({ ok: false });
    expect(validateGuestRequirements({ certification: "none", certificationNumber: "123" })).toMatchObject({ ok: false });
  });

  it("strips control characters", () => {
    expect(validateGuestRequirements({ other: "late\u0007 pickup\u0000" })).toEqual({ ok: true, value: { other: "late pickup" } });
  });
});

describe("reading stored requirements", () => {
  it("keeps valid fields and drops malformed ones without throwing", () => {
    expect(readGuestRequirements({ nonSwimmers: 1, medical: 7, certification: "bogus", dietary: "Veg" })).toEqual({ nonSwimmers: 1, dietary: "Veg" });
    expect(readGuestRequirements(undefined)).toEqual({});
    expect(readGuestRequirements("nope")).toEqual({});
  });
});

describe("requirement summaries", () => {
  it("builds a compact manifest line", () => {
    expect(compactRequirementsSummary({ nonSwimmers: 1, dietary: "Veg", certification: "open_water" })).toBe("1 non-swimmer · Diet: Veg · OW cert");
    expect(compactRequirementsSummary({ nonSwimmers: 2, medical: "Asthma" })).toBe("2 non-swimmers · Medical: Asthma");
    expect(compactRequirementsSummary({})).toBe("");
  });

  it("shortens long free text in the compact line", () => {
    const line = compactRequirementsSummary({ other: "a".repeat(100) });
    expect(line.length).toBe(60);
    expect(line.endsWith("…")).toBe(true);
  });

  it("builds supplier rows with the certification number", () => {
    expect(requirementRows({ nonSwimmers: 1, medical: "Diabetic", certification: "advanced", certificationNumber: "PADI-9", dietary: "Halal" })).toEqual([
      ["Non-swimmers", "1"], ["Medical", "Diabetic"], ["Diving certification", "Advanced Open Water (#PADI-9)"], ["Dietary", "Halal"],
    ]);
  });
});
