# Remaining SEO audit — 2026-08-10

Branch: `seo/remaining-multilingual-fixes`  
Production property: `sc-domain:dailyredsea.com`

## Implemented URL decisions

| Discovered URL pattern | Decision | Canonical destination |
| --- | --- | --- |
| `/hurghada-tours` | Permanent redirect | `/hurghada/excursions` |
| `/tours/orange-bay-boat-trip-hurghada` | Permanent redirect | `/tours/orange-bay` |
| `/tours/snorkeling-trip-hurghada` | Permanent redirect | `/tours/full-day-snorkeling` |
| `/tours/scuba-diving-hurghada` | Permanent redirect | `/tours/full-day-diving` |
| `/tours/desert-safari-hurghada` | Permanent redirect | `/tours/safari` |
| `/tours/luxor-day-trip-from-hurghada` | Permanent redirect | `/tours/luxor-private-day-trip` |
| `/tours/mahmya-island-boat-trip` | Permanent redirect | `/tours/mahmya-island` |
| `/transfers/hurghada-airport-transfer` | Permanent redirect | `/tours/hurghada-airport-transfer` |
| Four `/transfers/hurghada-to-{resort}` aliases | Permanent redirect | `/transfers` |
| Any other nested `/transfers/*` URL | Genuine 404 + `X-Robots-Tag: noindex` | None |

Redirects preserve Arabic, German, Russian, Polish and Chinese prefixes. `/en/` aliases resolve directly to the unprefixed English canonical.

The four resort aliases are not being replaced with thin landing pages. The repository only verifies general resort coverage at `/transfers`; distinct pages require owner-confirmed fares, vehicle/passenger/luggage capacity, meeting and waiting policy, flight-delay handling, child-seat availability, cancellation terms and original media.

## Verified route inventory summary

| Page group | Languages | Indexability/canonical | Sitemap/hreflang status |
| --- | --- | --- | --- |
| Homepage | en, ar, de, ru, pl, zh | Indexable, self-canonical | Six-language group + x-default |
| Tour products | en, ar, de, ru, pl, zh | Indexable, self-canonical | Present, but translation parity requires native review |
| Category hubs | en, ar, de, ru, pl, zh | Indexable, self-canonical | Six-language group + x-default |
| Transfers hub | en, ar, de, ru, pl, zh | Indexable, self-canonical | HTML and sitemap alternates aligned by this change |
| Destination | English only | Indexable only when active and substantive | en + x-default only after this change |
| Blog/articles | English only | Indexable, self-canonical | No false multilingual alternates |
| Booking/cart/checkout | en and localized app routes | noindex | Excluded from sitemap |
| Unknown nested transfer | all locale forms | Hard 404, no canonical | Excluded |

## Reproduced live baseline

- The five reported transfer URLs returned HTTP 200 while displaying a not-found page.
- Six obsolete tour aliases also returned a 200 fallback; `/hurghada-tours` returned 404.
- The sitemap contained 293 `<url>` entries: 271 with seven alternates, 21 without alternates and one with two.
- Search Console summary exposed by the connected integration: two sitemaps, 232 submitted URLs, one error and one pending sitemap. The connector does not expose the individual sitemap records needed to safely delete or replace one.

## Content and owner-data blockers

No facts or translations were invented. Arabic, German, Russian and Chinese overrides cover 18 of 31 static tours; Polish covers 20. Missing fields can silently fall back to English, and transactional UI still contains untranslated strings. Native review is required before claiming complete equivalents. Priority owner inputs are exact pickup zones/times/surcharges, age rules, accessibility and safety limitations, cancellation/weather policy, equipment, capacity and itinerary.

Two visible product rating claims (Orange Bay 5.0/30 and underwater photographer 5.0/12) have no stored provenance. Supply the source URL/export/date and confirm that these are product-specific before they are retained or expanded. Google Business reviews are separately fetched and must not be represented as product reviews.

## Verification

- Unit test: canonical alias resolution and hard-transfer-route guard pass.
- ESLint passes.
- Next.js production build passes.
- Local production HTTP verification: aliases return single-hop 301; unknown nested transfer returns 404 with `X-Robots-Tag: noindex`; destination sitemap alternate set contains en only plus x-default.
- In-app browser visual/console and mobile RTL testing remain blocked because no browser session is connected.
- No production deployment, sitemap resubmission or indexing request was made.
