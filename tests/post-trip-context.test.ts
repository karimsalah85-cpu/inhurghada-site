import { describe, expect, it, vi } from "vitest";
import { tours } from "@/data/tours";
import { getPostTripContext, selectPostTripContext } from "@/lib/post-trip-context";

describe("post-trip recommendations", () => {
  it("only recommends other active trips in the booked destination", () => {
    const source = tours.find(t => t.destinationSlug === "jeddah")!;
    const context = selectPostTripContext(tours, { tour_slug: source.slug });
    expect(context?.image).toMatch(/^https:\/\//);
    expect(context?.related.length).toBeGreaterThan(0);
    for (const card of context!.related) {
      const found = tours.find(t => card.url.endsWith(`/tours/${t.slug}`))!;
      expect(found.slug).not.toBe(source.slug);
      expect(found.destinationSlug).toBe(source.destinationSlug);
      expect(found.listingStatus || "active").toBe("active");
    }
  });
  it("does not guess unknown bookings or advertise paused and blocked trips", () => {
    expect(selectPostTripContext(tours, { tour_slug: "unknown" })).toBeUndefined();
    const source = tours[0];
    const catalog = [source, { ...source, slug: "paused", listingStatus: "paused" as const }, { ...source, slug: "blocked", bookingBlocker: "unavailable" }];
    expect(selectPostTripContext(catalog, { tour_slug: source.slug })?.related).toEqual([]);
  });
  it("localizes trip links", () => {
    expect(selectPostTripContext(tours, { tour_slug: tours[0].slug, locale: "ar" })?.url).toContain("/ar/tours/");
  });
});

vi.mock("@/lib/live-content", () => ({ getLiveTours: vi.fn(), getUnavailableTrip: vi.fn() }));
it("omits recommendations when live availability cannot be verified", async () => {
  const { getLiveTours, getUnavailableTrip } = await import("@/lib/live-content");
  vi.mocked(getLiveTours).mockResolvedValue(tours);
  vi.mocked(getUnavailableTrip).mockRejectedValue(new Error("catalog unavailable"));
  const result = await getPostTripContext({ tour_slug: "orange-bay" });
  expect(result?.title).toBeTruthy();
  expect(result?.related).toEqual([]);
});
it("removes a recommendation that is paused in the CMS", async () => {
  const { getLiveTours, getUnavailableTrip } = await import("@/lib/live-content");
  vi.mocked(getLiveTours).mockResolvedValue(tours);
  vi.mocked(getUnavailableTrip).mockImplementation(async slugs => ({ slug: slugs[0], status: "paused" }));
  expect((await getPostTripContext({ tour_slug: "orange-bay" }))?.related).toEqual([]);
});

it("matches the palette to the trip and localizes destination names", () => {
  const desert = tours.find(t => t.category === "Desert Safari")!;
  expect(selectPostTripContext(tours, { tour_slug: desert.slug })?.theme).toBe("desert");
  expect(selectPostTripContext(tours, { tour_slug: "orange-bay", locale: "ar" })?.destination).toBe("الغردقة");
});
it("offers visually distinct recommendations when the destination has a choice", () => {
  const context = selectPostTripContext(tours, { tour_slug: "orange-bay" })!;
  expect(context.related).toHaveLength(2);
  expect(context.related[0].image).not.toBe(context.related[1].image);
});
