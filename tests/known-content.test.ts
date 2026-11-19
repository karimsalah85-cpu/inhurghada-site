import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { tours } from "@/data/tours";
import { blogPosts } from "@/data/blog-posts";
import { canonicalAliasTarget } from "@/lib/public-routes";
import { clearKnownContentCache, contentPathSlug, isPublishedContentPath, publicContentSlugs } from "@/lib/known-content";

const listed = tours.find((tour) => tour.listingStatus !== "unlisted")!.slug;
const unlisted = tours.find((tour) => tour.listingStatus === "unlisted")!.slug;
const post = blogPosts[0].slug;
const rows = [
  { slug: "cms-only-trip", content_type: "tour" as const, status: "published", listing_status: "active" },
  { slug: "cms-paused-trip", content_type: "tour" as const, status: "published", listing_status: "paused" },
  { slug: "cms-draft-trip", content_type: "tour" as const, status: "draft", listing_status: "active" },
  { slug: "cms-unlisted-trip", content_type: "tour" as const, status: "published", listing_status: "unlisted" },
  { slug: unlisted, content_type: "tour" as const, status: "published", listing_status: "active" },
  { slug: post, content_type: "blog" as const, status: "draft", listing_status: null },
  { slug: "cms-article", content_type: "blog" as const, status: "published", listing_status: null },
];

describe("which tour and blog slugs exist", () => {
  it("matches the page rules: code catalog plus published admin content, never code-unlisted trips", () => {
    const known = publicContentSlugs(rows);
    expect(known.tours.has(listed)).toBe(true);
    expect(known.tours.has("cms-only-trip")).toBe(true);
    expect(known.tours.has("cms-paused-trip")).toBe(true);
    expect(known.tours.has("cms-draft-trip")).toBe(false);
    expect(known.tours.has("cms-unlisted-trip")).toBe(false);
    expect(known.tours.has(unlisted)).toBe(false);
    expect(known.blogs.has("cms-article")).toBe(true);
    expect(known.blogs.has(post)).toBe(false); // an admin draft hides the coded article
    expect(publicContentSlugs([]).blogs.has(post)).toBe(true);
  });

  it("recognises tour and article paths in every language", () => {
    expect(contentPathSlug("/tours/orange-bay")).toEqual({ kind: "tours", slug: "orange-bay" });
    expect(contentPathSlug("/de/tours/orange-bay")).toEqual({ kind: "tours", slug: "orange-bay" });
    expect(contentPathSlug("/blog/some-post")).toEqual({ kind: "blogs", slug: "some-post" });
    expect(contentPathSlug("/tours")).toBeNull();
    expect(contentPathSlug("/hurghada/excursions")).toBeNull();
  });
});

describe("the proxy's existence check", () => {
  const respond = (body: unknown, ok = true) => vi.fn(async () => ({ ok, json: async () => body }) as Response);
  beforeEach(() => {
    clearKnownContentCache();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://db.example");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service");
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it("answers 'missing' for unknown and retired trips and articles", async () => {
    vi.stubGlobal("fetch", respond(rows));
    expect(await isPublishedContentPath(`/tours/${listed}`)).toBe(true);
    expect(await isPublishedContentPath("/it/tours/cms-only-trip")).toBe(true);
    expect(await isPublishedContentPath("/tours/no-such-trip")).toBe(false);
    expect(await isPublishedContentPath(`/de/tours/${unlisted}`)).toBe(false);
    expect(await isPublishedContentPath("/blog/no-such-post")).toBe(false);
    expect(await isPublishedContentPath("/tours/transfer-to-and-from-senzo-mall")).toBe(true);
    expect(await isPublishedContentPath("/about")).toBe(true);
  });

  it("reads the database once per minute, not per request", async () => {
    const fetch = respond(rows);
    vi.stubGlobal("fetch", fetch);
    await isPublishedContentPath("/tours/a");
    await isPublishedContentPath("/tours/b");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("never hides pages when the database cannot be read", async () => {
    vi.stubGlobal("fetch", respond(null, false));
    expect(await isPublishedContentPath("/tours/no-such-trip")).toBe(true);
    clearKnownContentCache();
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    expect(await isPublishedContentPath("/tours/no-such-trip")).toBe(true);
  });

  it("answers from the code catalog when no database is configured, as the pages do", async () => {
    vi.unstubAllEnvs();
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    expect(await isPublishedContentPath(`/tours/${listed}`)).toBe(true);
    expect(await isPublishedContentPath("/tours/no-such-trip")).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("retired private speedboat trips", () => {
  it("redirect to the speedboat trip still on sale, keeping the language", () => {
    for (const slug of ["orange-bay-full-day-speedboat", "magawish-speedboat"]) {
      expect(tours.find((tour) => tour.slug === slug)?.listingStatus).toBe("unlisted");
      expect(canonicalAliasTarget(`/tours/${slug}`)).toBe("/tours/orange-bay-half-day-speedboat");
      expect(canonicalAliasTarget(`/de/tours/${slug}`)).toBe("/de/tours/orange-bay-half-day-speedboat");
    }
    expect(tours.find((tour) => tour.slug === "orange-bay-half-day-speedboat")?.listingStatus).not.toBe("unlisted");
  });
});
