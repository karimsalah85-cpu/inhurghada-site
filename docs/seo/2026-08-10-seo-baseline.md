# Daily Red Sea SEO baseline — 2026-08-10

## Scope and evidence

This audit combines the production site, repository inspection, Google Search Console and GA4 through the connected RYZE workspace, and public search research. Anonymous search results are directional only; they are not a location/device-controlled rank tracker.

## Search Console baseline (2026-05-12 to 2026-08-09)

- Property: `sc-domain:dailyredsea.com` (owner access).
- Sitemap summary: 2 sitemaps, 232 submitted URLs, 1 error, 0 warnings, 1 pending.
- Homepage: 10 clicks, 84 impressions, 11.9% CTR, average position 3.48.
- `/hurghada/island-trips`: 1 click, 25 impressions, 4% CTR, average position 8.
- `/hurghada/diving-snorkeling`: 0 clicks, 23 impressions, average position 12.87.
- `/tours/full-day-snorkeling`: 0 clicks, 6 impressions, average position 12.
- `/transfers`: 0 clicks, 5 impressions, average position 13.
- A legacy `http://www.dailyredsea.com/` row still had 28 impressions and average position 10.21; HTTPS www now redirects to the canonical host.
- Non-brand query evidence is early and sparse: `hurghada egypt snorkeling` (1 impression, position 8), `snorkeling hurghada egypt` (1, position 12), `red sea egypt snorkeling` (1, position 11), `red sea excursions` (2, position 41.5), `hurghada red sea tour` (1, position 77).
- Most measured clicks came from Egypt. UK and US visibility exists but is too sparse for reliable conclusions.

## GA4 baseline (previous 90 days)

Only four sessions were returned: two US desktop sessions to `/blog`, one Saudi mobile session to `/`, and one mobile session to `/?gtm_latency=1`. No key events were recorded in this report. This is insufficient for market or conversion decisions and indicates either very low traffic or incomplete measurement coverage.

## Production technical baseline

### Working

- `https://www.dailyredsea.com/` redirects to `https://dailyredsea.com/` with HTTP 308.
- Homepage, robots, sitemap, priority tour pages and localized tour pages return HTTP 200.
- Canonical host is `https://dailyredsea.com`.
- Core tour pages include self canonicals, hreflang, TouristTrip, BreadcrumbList and visible FAQ content.
- Checkout, cart, booking and admin pages are `noindex`.
- Robots permits public crawling and disallows admin, API and checkout paths.

### Defects found and addressed in this change

- Unknown root and localized paths returned HTTP 200 soft-404 responses. Route validation now happens before live data fetching and unsupported routes call `notFound()`.
- The legacy Senzo URL returned a streamed HTML redirect. It is now configured as a pre-render HTTP 308 redirect.
- The inactive Marsa Alam placeholder was in the sitemap and indexable. Inactive/coming-soon destinations are now excluded, and the page is explicitly `noindex,follow` while it exists.
- Localized category schema used English canonical URLs. It now emits locale-specific URLs, names and `inLanguage`.
- Tour schema breadcrumbs used English labels in every language. Labels and breadcrumb URLs are now localized.
- Localized metadata ignored a tour's full localized title. It now uses localized `seoTitle` or `title`.
- Language switching routed English through `/en` and lost cart parity. Canonical language-switch routing now preserves supported pages and links English directly to unprefixed URLs.
- The navigation now exposes crawlable HTML links for every available language in addition to the selector.

## Known blockers and owner/native-review inputs

- RYZE web rank-tracking/crawl screens were unavailable because no browser session was connected. The RYZE GSC and GA4 connectors were available and used read-only.
- Google Business Profile was not available through a connector or browser session.
- Several localized tour variants contain English fallback fields. They must not be described as fully optimized until native review and operational fact verification are complete.
- Dedicated Makadi Bay, El Gouna, Soma Bay and Sahl Hasheesh transfer pages require verified prices, pickup rules, vehicle/luggage capacity, meeting process and availability before publication.
- HTTP-to-HTTPS could not be independently verified from this network because the local ISP intercepted plain HTTP requests. Verify externally or in Vercel domain settings.
- Do not add opening hours, street address, ratings, licenses, guide credentials, child seats, fleet claims, wildlife guarantees or safety guarantees without owner evidence.

## Search Console actions

After commit `6850d42` reached READY on both Vercel production projects, `https://dailyredsea.com/sitemap.xml` was resubmitted exactly once through the connected Search Console property and returned success. No individual indexing request was sent. Read-only URL Inspection was attempted for the eight priority URLs below, but the connector returned expired-token (401) and temporary service-unavailable (503) responses; no inspection result is claimed. After reconnecting Search Console:

1. Confirm `/sitemap.xml` returns 200 and contains no placeholder or `noindex` URLs.
2. Inspect the homepage, `/hurghada/island-trips`, `/hurghada/diving-snorkeling`, `/tours/orange-bay`, `/tours/full-day-snorkeling`, `/tours/hurghada-airport-transfer`, `/transfers`, and `/tours/luxor-private-day-trip`.
3. Request indexing only for corrected priority URLs that are not already indexed.

## Immediate legitimate authority opportunities

- Keep business identity consistent on the genuine Google Business Profile and reputable local tourism directories.
- Seek editorial partnerships with hotels, dive centres and tour suppliers only where a real commercial relationship exists.
- Publish original operational photographs and verified pickup/itinerary information suppliers can reference.
- Do not buy links, automate directory submissions, manufacture reviews or create duplicate location pages.

## Primary guidance sources

- Google AI search guidance: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- Google multilingual guidance: https://developers.google.com/search/docs/specialty/international/localized-versions
- Google structured data policies: https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- Google FAQ visibility update: https://developers.google.com/search/blog/2023/08/howto-faq-changes
- Supabase/Next.js/Vercel implementation evidence is recorded in repository history and build output.
