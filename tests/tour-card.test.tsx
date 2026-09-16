import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import TourCard from "@/components/cards/TourCard";
import { cardInclusions, cardPriceUnit } from "@/lib/tour-card-details";
import { locales, type Locale } from "@/lib/i18n";

let language: Locale = "en";
vi.mock("@/components/settings/SiteSettingsContext", () => ({ useSiteSettings: () => ({ language, formatPrice: (price: string) => `$${Number(price).toFixed(2)}` }) }));
vi.mock("@/components/favourites/FavouriteButton", () => ({ default: () => <button aria-label="Save tour">Save</button> }));
vi.mock("next/image", () => ({ default: () => <span data-image /> }));
vi.mock("next/link", () => ({ default: ({ children, ...props }: React.ComponentProps<"a">) => <a {...props}>{children}</a> }));
vi.mock("@/components/media/ImageWatermark", () => ({ default: () => null }));
const props = { image: "/tour.jpg", title: "Test tour", price: "25", rating: "4.8", link: "/tours/test", location: "Hurghada", duration: "8 Hours", tourSlug: "test" };
const render = (extra = {}) => renderToStaticMarkup(<TourCard {...props} {...extra} />);

describe("compact tour cards", () => {
  it("keeps from, currency, amount and person unit in one price paragraph", () => {
    language = "en";
    expect(render()).toMatch(/<p[^>]*><span>From<\/span> <strong[^>]*><bdi>\$25.00<\/bdi><\/strong> <span>per person<\/span><\/p>/);
    expect(render({ price: "15", priceUnit: "per vehicle" })).toContain("per vehicle");
  });
  it("shows new status for absent or zero reviews without inventing a badge", () => {
    language = "en";
    for (const reviews of [undefined, "0", "invalid"]) expect(render({ reviews })).toContain("New tour");
    expect(render()).not.toContain("Best Seller");
    expect(render({ reviews: "12" })).toContain("4.8 · 12 reviews");
  });
  it("renders absent descriptions without empty description space", () => {
    expect(render()).not.toContain("leading-5");
    expect(render({ description: "   " })).not.toContain("leading-5");
    expect(render({ description: "Long description ".repeat(20) })).toContain('line-clamp-2 text-sm leading-5');
  });
  it("shows sale pricing only for a real reduction without a second badge", () => {
    expect(render({ originalPrice: "30", badge: "Premium" })).toContain("line-through");
    expect(render({ originalPrice: "20" })).not.toContain("line-through");
    expect(render({ originalPrice: "30", badge: "Premium" })).not.toContain("%</span>");
  });
  it.each(locales)("supports long text and localized units/CTA in %s", (locale) => {
    language = locale;
    const html = render({ title: "Langer übersetzter Titel ".repeat(8), priceUnit: "per vehicle" });
    expect(html).toContain(cardPriceUnit("per vehicle", locale));
    expect(html).not.toContain("View &amp; book");
    expect(html).toContain("min-h-11");
  });
  it("keeps favorite outside the sole navigation link", () => {
    const html = render();
    expect(html.match(/<a /g)).toHaveLength(1);
    expect(html).toMatch(/<button[^>]*>Save<\/button><\/div><a /);
    expect(html.slice(html.indexOf("<a "))).not.toContain("<button");
  });
  it("uses supplied inclusions and never mistakes start time for pickup", () => {
    expect(cardInclusions()).toEqual({ pickup: undefined, inclusion: undefined });
    expect(cardInclusions(["Boat cruise", "Hotel pickup and drop-off"])).toEqual({ pickup: "Hotel pickup and drop-off", inclusion: "Boat cruise" });
    expect(render({ availableTime: "08:00" })).not.toContain("08:00");
  });
});
