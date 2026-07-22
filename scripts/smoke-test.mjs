import assert from "node:assert/strict";

const base = (process.argv[2] || "https://dailyredsea.com").replace(/\/$/, "");
const requiredHeaders = ["content-security-policy", "referrer-policy", "x-content-type-options", "x-frame-options", "permissions-policy"];

async function get(path, options) {
  const response = await fetch(`${base}${path}`, options);
  const body = await response.text();
  return { response, body };
}

const home = await get("/");
assert.equal(home.response.status, 200, "Home page must return 200");
for (const header of requiredHeaders) assert.ok(home.response.headers.get(header), `Missing security header: ${header}`);
assert.match(home.body, /<title>[^<]+<\/title>/, "Home page must have a title");
assert.match(home.body, /rel="canonical"/, "Home page must have a canonical URL");

const sitemap = await get("/sitemap.xml");
assert.equal(sitemap.response.status, 200, "Sitemap must return 200");
const urls = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
assert.ok(urls.length >= 80, `Expected at least 80 sitemap URLs, received ${urls.length}`);

const failures = [];
for (let offset = 0; offset < urls.length; offset += 10) {
  const batch = urls.slice(offset, offset + 10);
  await Promise.all(batch.map(async (url) => {
    try {
      const response = await fetch(url);
      const body = await response.text();
      const pathname = new URL(response.url).pathname;
      const first = pathname.split("/").filter(Boolean)[0];
      const expectedLanguage = ["ar", "de", "ru", "pl", "zh"].includes(first) ? first : "en";
      if (response.status !== 200) failures.push(`${url}: HTTP ${response.status}`);
      if (!/<title>[^<]+<\/title>/.test(body)) failures.push(`${url}: missing title`);
      if (!/rel="canonical"/.test(body)) failures.push(`${url}: missing canonical`);
      if (!new RegExp(`<html[^>]+lang="${expectedLanguage}"`).test(body)) failures.push(`${url}: expected html lang=${expectedLanguage}`);
      if (/noindex/i.test(body)) failures.push(`${url}: noindex URL must not be in sitemap`);
    } catch (error) {
      failures.push(`${url}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }));
}

const apiChecks = [
  ["/api/bookings", 400],
  ["/api/admin/reports?format=pdf", 401],
  ["/api/invoices/DRS-INVALID", 400],
];
for (const [path, status] of apiChecks) {
  const result = await get(path);
  if (result.response.status !== status) failures.push(`${path}: expected ${status}, received ${result.response.status}`);
}

const rates = await fetch(`${base}/api/exchange-rates`).then((response) => response.json());
for (const currency of ["USD", "EUR", "GBP", "EGP"]) {
  if (!(Number(rates.rates?.[currency]) > 0)) failures.push(`/api/exchange-rates: invalid ${currency} rate`);
}

const admin = await get("/admin");
if (!admin.body.includes("NEXT_REDIRECT") || !admin.body.includes("/admin/login")) failures.push("/admin: anonymous users are not redirected to login");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Smoke test passed: ${urls.length} sitemap pages, security headers, APIs, currencies, and admin protection.`);
