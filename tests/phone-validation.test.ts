import { describe, expect, it } from "vitest";
import { validatePhoneNumber } from "@/lib/phone";

describe("validatePhoneNumber", () => {
  it.each([
    ["+201012345678", "+201012345678"],
    // Note: +447700900123 (from the brief) is Ofcom's reserved "fictional drama
    // use" range, so libphonenumber-js correctly treats it as not a real,
    // issuable UK number. A genuinely valid UK mobile is used here instead.
    ["+447400123456", "+447400123456"],
    ["+4915123456789", "+4915123456789"],
    ["+20 10 1234 5678", "+201012345678"],
    ["+44 7400 123456", "+447400123456"],
  ])("accepts %s", (input, expected) => {
    const result = validatePhoneNumber(input);
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.e164).toBe(expected);
  });

  it.each([
    ["123"],
    ["0000000000"],
    ["111111111111"],
    ["20202020202020202020"],
    ["+2020202020202020202020"],
    ["abc123456"],
    ["++++++++"],
    [""],
    ["0020200202020202020202020"],
    ["+202020202020"],
  ])("rejects %s", (input) => {
    const result = validatePhoneNumber(input);
    expect(result.valid).toBe(false);
  });

  it("normalizes a local Egyptian number to E.164 when Egypt is the default country", () => {
    const result = validatePhoneNumber("01012345678", "EG");
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.e164).toBe("+201012345678");
  });

  it("normalizes a local Saudi number to E.164 when Saudi Arabia is the default country", () => {
    const result = validatePhoneNumber("0501234567", "SA");
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.e164).toBe("+966501234567");
  });

  it("lets an explicit country code override the default country", () => {
    const result = validatePhoneNumber("+447400123456", "EG");
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.e164).toBe("+447400123456");
  });

  it("accepts numbers typed with Arabic-Indic digits", () => {
    const result = validatePhoneNumber("+٢٠١٠١٢٣٤٥٦٧٨");
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.e164).toBe("+201012345678");
  });

  it("strips harmless separators before validating", () => {
    const result = validatePhoneNumber("+20 (10) 123-4567-8");
    expect(result.valid).toBe(true);
  });

  it.each([
    // Right length and an allowed operator prefix for Egypt, so isValid()
    // alone would pass these — the pattern guard is what rejects them.
    ["+201111111111"],
    ["+201212121212"],
    ["01111111111"],
  ])("rejects repeating / patterned digits %s", (input) => {
    const result = validatePhoneNumber(input, "EG");
    expect(result.valid).toBe(false);
  });

  it("rejects a strictly sequential number", () => {
    expect(validatePhoneNumber("+201234567890", "EG").valid).toBe(false);
  });
});
