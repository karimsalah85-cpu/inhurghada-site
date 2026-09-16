// Run against a local dev/production server. Requires Playwright with Chromium.
// PLAYWRIGHT_MODULE may point to an existing Playwright installation.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.CARD_TEST_URL || "http://127.0.0.1:3003";
const output = resolve(process.env.CARD_TEST_OUTPUT || "/tmp/drs-card-qa");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.addInitScript(() => localStorage.setItem("daily-red-sea-cookie-consent", JSON.stringify({ analytics: false, marketing: false })));
const errors = [];
page.on("pageerror", error => errors.push(error.message));
page.on("console", message => { if (/hydration|hydrating|did not match|cannot be a descendant/i.test(message.text())) errors.push(message.text()); });
const results = [];
try {
  for (const locale of ["en", "ar", "de", "ru", "pl", "zh"]) {
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`${base}/${locale === "en" ? "" : locale}`, { waitUntil: "domcontentloaded" });
      await page.waitForFunction(locale => localStorage.getItem("daily-red-sea-language") === locale, locale);
      const card = page.locator("article").first();
      await card.waitFor();
      await page.evaluate(() => document.fonts.ready);
      await card.scrollIntoViewIfNeeded();
      const result = await page.evaluate(({ locale, width }) => ({
        locale, width,
        overflow: document.documentElement.scrollWidth > innerWidth,
        nested: document.querySelectorAll("article a a,article a button,article button a,article button button").length,
        cards: [...document.querySelectorAll("article:has(button[aria-pressed])")].map(element => {
          const rect = element.getBoundingClientRect();
          const button = element.querySelector("button");
          const description = element.querySelector(".leading-5");
          return { top: rect.top, bottom: rect.bottom, height: rect.height, saveWidth: button.offsetWidth, saveHeight: button.offsetHeight, clamp: description ? getComputedStyle(description).webkitLineClamp : null };
        }),
      }), { locale, width });
      assert.equal(result.overflow, false, `${locale}/${width}: page overflow`);
      assert.equal(result.nested, 0, `${locale}/${width}: nested controls`);
      for (const item of result.cards) {
        assert.ok(item.saveWidth >= 44 && item.saveHeight >= 44, JSON.stringify({ locale, width, item }));
        assert.ok(item.clamp === null || item.clamp === "2");
        for (const peer of result.cards.filter(peer => Math.abs(peer.top - item.top) < 1)) assert.ok(Math.abs(peer.bottom - item.bottom) < 1, "row bottoms must align");
      }
      await page.screenshot({ caret: "initial", path: `${output}/${locale}-${width}.png` });
      results.push(result);
    }
  }
  await writeFile(`${output}/visual-results.json`, JSON.stringify({ results, errors }, null, 2));
  assert.equal(errors.length, 0, `Hydration/runtime errors: see ${output}/visual-results.json`);
  console.log(`PASS: ${results.length} locale/viewport combinations; aligned cards, two-line descriptions, 44px saves, no overflow, nested controls or hydration errors. Screenshots: ${output}`);
} finally { await browser.close(); }
