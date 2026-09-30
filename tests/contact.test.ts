import { afterEach, describe, expect, it, vi } from "vitest";
import { formatDisplayPhoneNumber, resolveWhatsappNumber } from "@/lib/contact";

async function loadContact(value?: string) {
  vi.resetModules();
  if (value === undefined) vi.stubEnv("NEXT_PUBLIC_WHATSAPP_NUMBER", undefined as unknown as string);
  else vi.stubEnv("NEXT_PUBLIC_WHATSAPP_NUMBER", value);
  return import("@/lib/contact");
}

afterEach(() => { vi.unstubAllEnvs(); });

describe("contact WhatsApp number", () => {
  it("keeps the existing number and display format when the env var is unset", async () => {
    const contact = await loadContact(undefined);
    expect(contact.whatsappNumber).toBe("201154516040");
    expect(contact.displayPhoneNumber).toBe("+20 115 451 6040");
    expect(contact.whatsappUrl()).toBe("https://wa.me/201154516040");
    expect(contact.whatsappUrl("Hi there")).toBe("https://wa.me/201154516040?text=Hi%20there");
  });

  it("uses a valid digits-only override and derives the display number from it", async () => {
    const contact = await loadContact(" 201001234567 ");
    expect(contact.whatsappNumber).toBe("201001234567");
    expect(contact.displayPhoneNumber).toBe("+20 100 123 4567");
    expect(contact.whatsappUrl()).toBe("https://wa.me/201001234567");
  });

  it("falls back to the default for malformed values", () => {
    for (const value of ["", "+201001234567", "20 100 123 4567", "0100123456", "12345", "1234567890123456", "abc"]) {
      expect(resolveWhatsappNumber(value)).toBe("201154516040");
    }
  });

  it("shows non-Egyptian numbers with a plus prefix", () => {
    expect(formatDisplayPhoneNumber("966501234567")).toBe("+966501234567");
  });
});
