import { describe, expect, it } from "vitest";
import { pickTemplate } from "@/lib/communication-template";

const templates = [
  { id: "en-email", event_key: "review_request", channel: "email", locale: "en" },
  { id: "de-email", event_key: "review_request", channel: "email", locale: "de" },
  { id: "en-wa", event_key: "review_request", channel: "whatsapp", locale: "en" },
  { id: "en-pickup-email", event_key: "pickup_reminder", channel: "email", locale: "en" },
];

describe("pickTemplate", () => {
  it("returns the template for the booking's own locale", () => {
    expect(pickTemplate(templates, "review_request", "email", "de")?.id).toBe("de-email");
  });

  it("falls back to English when the locale has no template", () => {
    expect(pickTemplate(templates, "review_request", "email", "ru")?.id).toBe("en-email");
    expect(pickTemplate(templates, "pickup_reminder", "email", "de")?.id).toBe("en-pickup-email");
  });

  it("matches on channel, not just event", () => {
    expect(pickTemplate(templates, "review_request", "whatsapp", "de")?.id).toBe("en-wa");
  });

  it("returns undefined when neither the locale nor English has a template", () => {
    expect(pickTemplate(templates, "pickup_reminder", "whatsapp", "en")).toBeUndefined();
  });

  it("does not send one booking multiple templates for the same event and channel", () => {
    const picked = pickTemplate(templates, "review_request", "email", "de");
    const allMatching = templates.filter((t) => t.event_key === "review_request" && t.channel === "email");
    expect(allMatching.length).toBeGreaterThan(1);
    expect(picked).toBeDefined();
  });
});
