import { describe, expect, it, vi } from "vitest";
import { tours } from "@/data/tours";
import { locales } from "@/lib/i18n";
import { absoluteUrl, defaultSocialImage } from "@/lib/seo";
import { getDestination } from "@/lib/destinations";
import { getTourCategory } from "@/lib/tour-categories";
import { generateMetadata as englishMetadata } from "@/app/tours/[slug]/page";
import { generateMetadata as localizedMetadata } from "@/app/[locale]/[[...path]]/page";
import { generateMetadata as categoryMetadata } from "@/app/hurghada/[category]/page";
import OrganizationSchema from "@/components/seo/OrganizationSchema";

vi.mock("@/lib/live-content", () => ({ getLiveTours: vi.fn(async () => tours), getLiveBlogPosts: vi.fn(async () => []) }));

describe("tour-specific social images", () => {
  it.each(locales)("uses absolute tour images throughout the %s catalogue", async (locale) => {
    for (const tour of tours.filter((tour) => tour.listingStatus !== "unlisted")) {
      const metadata = locale === "en"
        ? await englishMetadata({ params: Promise.resolve({ slug: tour.slug }) })
        : await localizedMetadata({ params: Promise.resolve({ locale, path: ["tours", tour.slug] }) });
      expect(metadata.openGraph?.images, `${locale}/${tour.slug}`).toEqual([expect.objectContaining({ url: absoluteUrl(tour.image) })]);
      expect(metadata.twitter?.images, `${locale}/${tour.slug}`).toEqual([absoluteUrl(tour.image)]);
      expect(tour.image).not.toBe(defaultSocialImage);
    }
  });

  it("gives Hurghada categories a destination image", async () => {
    const category = getTourCategory("diving-snorkeling")!;
    const metadata = await categoryMetadata({ params: Promise.resolve({ category: category.slug }) });
    expect(metadata.openGraph?.images).toEqual([{ url: absoluteUrl(getDestination("hurghada")?.seo.ogImage || defaultSocialImage), alt: `${category.title} in Hurghada` }]);
  });

  it("uses the default raster image for the organization", () => {
    const schema = JSON.parse(OrganizationSchema().props.dangerouslySetInnerHTML.__html);
    expect(schema["@graph"][0].image).toBe(absoluteUrl(defaultSocialImage));
  });
});

