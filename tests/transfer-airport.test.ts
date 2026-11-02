import { describe, expect, it } from "vitest";
import { hasUncontractedAirport, isHurghadaAirport } from "@/lib/transfer-airport";

describe("contracted airport identification", () => {
  it.each(["Hurghada International Airport (HRG)", "Flughafen Hurghada (HRG)", "Международный аэропорт Хургады (HRG)", "مطار الغردقة الدولي (HRG)", "Międzynarodowe lotnisko w Hurghadzie (HRG)", "赫尔格达国际机场 (HRG)"])("recognises localized suggestion %s", (place) => {
    expect(isHurghadaAirport(place)).toBe(true);
  });
  it.each(["Marsa Alam Airport", "Cairo airport", "Airport Road Hotel", "Hotel near Hurghada Airport", "RMF", "مطار مرسى علم"])("does not apply Hurghada fares to %s", (place) => {
    expect(isHurghadaAirport(place)).toBe(false);
    expect(hasUncontractedAirport(place)).toBe(true);
  });
});
