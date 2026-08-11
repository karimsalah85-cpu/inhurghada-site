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

const health = await get("/api/health");
assert.equal(health.response.status, 200, "Health endpoint must return 200");
const healthPayload = JSON.parse(health.body);
assert.equal(healthPayload.status, "healthy", "Runtime dependencies must be healthy");

const adminLogin = await get("/admin/login");
assert.equal(adminLogin.response.status, 200, "Admin login page must return 200");
assert.match(adminLogin.body, /Admin sign in/, "Admin login page must render its sign-in form");

for (const locale of ["ar", "de", "ru", "pl", "zh"]) {
  const localizedHome = await get(`/${locale}`);
  assert.equal(localizedHome.response.status, 200, `/${locale} homepage must return 200`);
  assert.match(localizedHome.body, new RegExp(`<html[^>]+lang="${locale}"`), `/${locale} must declare html lang=${locale}`);
  assert.match(localizedHome.body, /rel="canonical"/, `/${locale} must have a canonical URL`);
}

const englishAlias = await get("/en", { redirect: "manual" });
assert.ok([307, 308].includes(englishAlias.response.status), `/en must redirect, received ${englishAlias.response.status}`);

const invalidTransfer = await get("/transfers/not-a-real-transfer", { redirect: "manual" });
assert.equal(invalidTransfer.response.status, 404, "Unknown nested transfer must return 404");
assert.equal(invalidTransfer.response.headers.get("x-robots-tag"), "noindex", "Unknown nested transfer must be noindex");

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
  ["/api/admin/google-ads?from=2026-08-01&to=2026-08-02", 401],
  ["/api/admin/google-analytics?from=2026-08-01&to=2026-08-02", 401],
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
const marketingAdmin = await get("/admin/marketing");
if (!marketingAdmin.body.includes("NEXT_REDIRECT") || !marketingAdmin.body.includes("/admin/login")) failures.push("/admin/marketing: anonymous users are not redirected to login");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Smoke test passed: ${urls.length} sitemap pages, health, security headers, APIs, currencies, and admin protection.`);
