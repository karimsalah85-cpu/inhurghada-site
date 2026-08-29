const site = (process.env.SITE_URL || "https://dailyredsea.com").replace(/\/$/, "");
const minimumExpected = Number(process.env.MINIMUM_BLOG_POSTS || 149);

const sitemapResponse = await fetch(`${site}/sitemap.xml?verify=${Date.now()}`, { cache: "no-store" });
if (!sitemapResponse.ok) throw new Error(`Sitemap returned ${sitemapResponse.status}`);
const sitemap = await sitemapResponse.text();
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((match) => match[1])
  .filter((url) => new URL(url).pathname.startsWith("/blog/"));

if (urls.length < minimumExpected) {
  throw new Error(`Sitemap contains ${urls.length} blog posts; expected at least ${minimumExpected}`);
}

const failures = [];
let cursor = 0;
async function worker() {
  while (cursor < urls.length) {
    const url = urls[cursor++];
    try {
      const response = await fetch(`${url}?verify=${Date.now()}`, { cache: "no-store", redirect: "follow" });
      const html = await response.text();
      if (!response.ok || /This page is not available/i.test(html) || !/<h1\b/i.test(html)) {
        failures.push(`${url} (${response.status})`);
      }
    } catch (error) {
      failures.push(`${url} (${error.message})`);
    }
  }
}

await Promise.all(Array.from({ length: 10 }, worker));
if (failures.length) {
  throw new Error(`${failures.length} blog page(s) failed: ${failures.join(", ")}`);
}
console.log(`Verified ${urls.length} live blog posts with no soft-error pages.`);
