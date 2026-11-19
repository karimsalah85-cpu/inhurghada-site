import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import TourPriceTables from "@/components/admin/TourPriceTables";

const render = (slug: string, form: Record<string, unknown> = {}) => renderToStaticMarkup(<TourPriceTables slug={slug} form={form} set={() => undefined} />);

describe("boat and group price fields in the trip editor", () => {
  it("shows one row per boat with the coded price as a hint, and saved prices as values", () => {
    const html = render("orange-bay-half-day-speedboat", { adminBoatPrices: { "boat-1": { price: 150 } } });
    expect(html).toContain("Private boat prices (USD)");
    expect(html).toContain("Boat 1 - up to 4 passengers");
    expect(html).toContain('value="150"');
    expect(html).toContain("Extra hour");
    expect((html.match(/type="number"/g) || []).length).toBe(16);
  });

  it("shows one field per group size", () => {
    const html = render("luxor-private-day-trip");
    expect(html).toContain("Group-size prices (EUR)");
    expect(html).toMatch(/travelers, per person/);
  });

  it("shows nothing for single-price trips and transfers", () => {
    expect(render("orange-bay")).toBe("");
    expect(render("senzo-transfer")).toBe("");
    expect(render("")).toBe("");
  });
});
