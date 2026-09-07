import { describe, expect, it } from "vitest";
import { canonicalAliasTarget, isKnownApplicationPath, isStaticAssetPath } from "@/lib/public-routes";

describe("public route guard", () => {
  it("allows known public and localized route roots", () => {
    expect(isKnownApplicationPath("/tours/orange-bay")).toBe(true);
    expect(isKnownApplicationPath("/de/tours/orange-bay")).toBe(true);
    expect(isKnownApplicationPath("/sitemap.xml")).toBe(true);
    for (const locale of ["en", "ar", "de", "ru", "pl", "zh"]) {
      expect(isKnownApplicationPath(`/${locale}`)).toBe(true);
      expect(isKnownApplicationPath(`/${locale}/`)).toBe(true);
    }
  });

  it("keeps the localized route contract intact for every supported locale", () => {
    const locales = ["en", "ar", "de", "ru", "pl", "zh"];
    const validPaths = ["", "/about", "/contact", "/faq", "/transfers", "/hurghada/excursions", "/tours/orange-bay"];
    for (const locale of locales) {
      for (const path of validPaths) {
        expect(isKnownApplicationPath(`/${locale}${path}`), `/${locale}${path}`).toBe(true);
      }
      expect(isKnownApplicationPath(`/${locale}/transfers/not-real`)).toBe(false);
      expect(isKnownApplicationPath(`/${locale}/not-a-route`)).toBe(false);
    }
  });

  it("rejects unknown root and localized catch-all paths", () => {
    expect(isKnownApplicationPath("/definitely-not-a-real-page")).toBe(false);
    expect(isKnownApplicationPath("/de/definitely-not-real")).toBe(false);
    expect(isKnownApplicationPath("/transfers/not-real")).toBe(false);
    expect(isKnownApplicationPath("/de/transfers/not-real")).toBe(false);
  });

  it("passes real /public assets and metadata routes straight through", () => {
    for (const asset of [
      "/favicon.ico", "/icon-192.png", "/icon-512.png", "/icon.svg",
      "/favicon-16x16.png", "/favicon-32x32.png", "/apple-touch-icon.png",
      "/og-image.svg", "/llms.txt", "/robots.txt", "/sitemap.xml", "/manifest.webmanifest",
      "/images/owned/hurghada-airport-flight.png", "/brand/dailyredsea-wordmark-white.png",
      "/vendor/pdfjs/pdf.mjs", "/.well-known/security.txt",
    ]) {
      expect(isStaticAssetPath(asset), asset).toBe(true);
    }
  });

  it("treats unknown extensioned paths as missing resources, never static assets", () => {
    for (const missing of ["/apple-icon.png", "/apple-touch-icon-precomposed.png", "/nonexistent.png", "/random.json", "/foo.txt", "/wp-login.php"]) {
      expect(isStaticAssetPath(missing), missing).toBe(false);
      expect(isKnownApplicationPath(missing), missing).toBe(false);
    }
  });

  it("resolves canonical aliases without losing the locale", () => {
    expect(canonicalAliasTarget("/transfers/hurghada-airport-transfer")).toBe("/tours/hurghada-airport-transfer");
    expect(canonicalAliasTarget("/de/transfers/hurghada-to-el-gouna")).toBe("/de/transfers");
    expect(canonicalAliasTarget("/en/tours/orange-bay-boat-trip-hurghada")).toBe("/tours/orange-bay");
    expect(canonicalAliasTarget("/transfers/not-real")).toBeNull();
  });
});
