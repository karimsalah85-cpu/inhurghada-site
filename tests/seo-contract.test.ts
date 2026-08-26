import { describe, expect, it, vi } from "vitest";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import nextConfig from "@/next.config";
import { generateMetadata as generateCategoryMetadata } from "@/app/hurghada/[category]/page";
import { generateMetadata as generateTourMetadata } from "@/app/tours/[slug]/page";
import { tours } from "@/data/tours";

vi.mock("@/lib/live-content", () => ({
  getLiveTours: vi.fn(async () => tours),
  getLiveBlogPosts: vi.fn(async () => []),
}));

describe("SEO build contract", () => {
  it("publishes one canonical sitemap without www URLs", async () => {
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);
    expect(urls).toContain("https://dailyredsea.com/hurghada/diving-snorkeling");
    expect(urls).toContain("https://dailyredsea.com/tours/orange-bay");
    expect(urls.some((url) => url.startsWith("https://www.dailyredsea.com"))).toBe(false);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("advertises only the canonical sitemap in robots.txt", () => {
    const result = robots();
    expect(result.sitemap).toBe("https://dailyredsea.com/sitemap.xml");
    expect(result.host).toBe("https://dailyredsea.com");
  });

  it("keeps the priority pages self-canonical", async () => {
    const category = await generateCategoryMetadata({ params: Promise.resolve({ category: "diving-snorkeling" }) });
    const tour = await generateTourMetadata({ params: Promise.resolve({ slug: "orange-bay" }) });
    expect(category.alternates?.canonical).toBe("/hurghada/diving-snorkeling");
    expect(tour.alternates?.canonical).toBe("/tours/orange-bay");
  });

  it("permanently redirects every www path to the matching canonical path", async () => {
    const redirects = await nextConfig.redirects?.();
    expect(redirects).toEqual(expect.arrayContaining([expect.objectContaining({
      source: "/:path*",
      destination: "https://dailyredsea.com/:path*",
      permanent: true,
      has: [{ type: "host", value: "www.dailyredsea.com" }],
    })]));
  });
});
