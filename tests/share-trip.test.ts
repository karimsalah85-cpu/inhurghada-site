import { describe, expect, it } from "vitest";
import { buildTripShareUrl, isSharedTripUrl, tripShareText, whatsappShareUrl } from "@/lib/share-trip";
import { availabilityStatus } from "@/lib/tour-booking";

describe("trip sharing", () => {
  it("builds a canonical English link with a valid selected date", () => {
    expect(buildTripShareUrl("https://dailyredsea.com", "en", "jeddah-yacht-sunset-cruise", "2026-08-31"))
      .toBe("https://dailyredsea.com/tours/jeddah-yacht-sunset-cruise?date=2026-08-31&shared=1");
  });

  it("preserves locale and rejects malformed dates", () => {
    const url = buildTripShareUrl("https://dailyredsea.com", "ar", "jeddah-yacht-sunset-cruise", "not-a-date");
    expect(url).toBe("https://dailyredsea.com/ar/tours/jeddah-yacht-sunset-cruise?shared=1");
    expect(isSharedTripUrl(new URL(url).search)).toBe(true);
  });

  it("never places customer data in the generated URL", () => {
    const url = buildTripShareUrl("https://dailyredsea.com", "en", "jeddah-yacht-sunset-cruise", "2026-09-02");
    for (const key of ["name", "email", "phone", "reference", "passport", "booking"]) expect(url.toLowerCase()).not.toContain(`${key}=`);
  });

  it("provides Arabic copy and safely encoded WhatsApp text", () => {
    const text = tripShareText("ar");
    expect(text).toContain("رحلة غروب");
    expect(decodeURIComponent(whatsappShareUrl(text, "https://dailyredsea.com").split("text=")[1])).toContain(text);
  });
});

describe("availability labels", () => {
  it("distinguishes unmanaged, limited, sold-out and blocked inventory", () => {
    expect(availabilityStatus(false, null)).toBe("request_confirmation");
    expect(availabilityStatus(true, 3)).toBe("limited");
    expect(availabilityStatus(true, 0)).toBe("sold_out");
    expect(availabilityStatus(true, 8, true)).toBe("unavailable");
  });
});
