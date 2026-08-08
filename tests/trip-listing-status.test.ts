import { beforeEach, describe, expect, it, vi } from "vitest";
import { tours } from "@/data/tours";

let rows: Array<Record<string, unknown>> = [];

vi.mock("@/utils/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => {
        let filters = 0;
        const query = {
          eq: () => {
            filters += 1;
            return filters === 2 ? Promise.resolve({ data: rows, error: null }) : query;
          },
        };
        return query;
      },
    }),
  }),
}));

describe("trip listing status", () => {
  beforeEach(() => { rows = []; });

  it("keeps paused trips visible and marks them unavailable", async () => {
    const source = tours[0];
    rows = [{ slug: source.slug, status: "published", listing_status: "paused", title: source.title, excerpt: source.description, body: source, seo_title: null, seo_description: null, featured_image: source.image, published_at: null, publish_at: null }];
    const { getLiveTours } = await import("@/lib/live-content");
    const live = await getLiveTours();
    expect(live.find((tour) => tour.slug === source.slug)?.listingStatus).toBe("paused");
  });

  it("removes unlisted trips from public discovery", async () => {
    const source = tours[0];
    rows = [{ slug: source.slug, status: "published", listing_status: "unlisted", title: source.title, excerpt: source.description, body: source, seo_title: null, seo_description: null, featured_image: source.image, published_at: null, publish_at: null }];
    const { getLiveTours } = await import("@/lib/live-content");
    const live = await getLiveTours();
    expect(live.some((tour) => tour.slug === source.slug)).toBe(false);
  });
});
