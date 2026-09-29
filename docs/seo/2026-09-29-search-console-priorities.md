# Daily Red Sea: verified Search Console baseline and priorities

Checked September 29, 2026 through authenticated Google Search Console for `sc-domain:dailyredsea.com`. Figures manually transcribed from visible reports, not a full export.

## Performance

Web search; selected period: 3 months; chart's available dates: July 22–September 26, 2026. UI reported last update 6 hours ago.

- 43 clicks, 624 impressions, 6.9% CTR, 27.4 average position.
- Homepage: 39 clicks, 273 impressions, 14.3% CTR, position 5.8.
- Page-level impressions should not be summed to reproduce property totals.

| Page | Clicks | Impressions | CTR | Average position |
|---|---:|---:|---:|---:|
| /hurghada/diving-snorkeling | 1 | 172 | 0.6% | 21.0 |
| /hurghada/island-trips | 1 | 104 | 1% | 31.5 |
| /destinations/hurghada | 1 | 25 | 4% | 10.0 |
| /ar/destinations/hurghada | 1 | 2 | 50% | 3.0 |
| /destinations/jeddah | 0 | 59 | 0% | 51.5 |
| http://www.dailyredsea.com/ | 0 | 52 | 0% | 12.8 |
| /transfers | 0 | 48 | 0% | 14.4 |
| /jeddah/boat-cruises | 0 | 46 | 0% | 47.7 |
| /tours/full-day-snorkeling | 0 | 44 | 0% | 12.2 |

Selected visible queries (all zero clicks): snorkeling in the red sea hurghada: 26 impressions, position 59.7; orange bay snorkeling trip hurghada: 20, position 52.5; scuba diving jeddah: 18, position 61.9; red sea excursions: 13, position 40.5; boat ride jeddah: 10, position 57.3. Query table contains 93 rows, page table 21; only first 10 of each inspected. Query-to-page attribution was not inspected. These are average positions, not fixed current ranks.

## Indexing

Report last updated September 21, 2026 (not September 29):

- Indexed: 19.
- Not indexed: 549; 546 discovered/currently not indexed, 1 crawled/currently not indexed, 2 redirects.
- Former 403 category: 0 pages, validation passed.
- Discovered examples include /about, /ar, /ar/about, /ar/contact, /ar/destinations/marsa-alam, /ar/faq and Arabic Hurghada category pages. Last crawled N/A.
- Discovery exclusion validation shows started August 10, 2026.
- This report does not establish a technical defect or a quality/authority diagnosis. Not all excluded URLs need indexing.

Sitemap report checked September 29: `https://dailyredsea.com/sitemap.xml`, Success, 610 discovered pages, submitted September 29, last read September 27. Dates transcribed as displayed; differing report dates/populations mean 610 should not be compared directly with the indexing total.

Individual URL Inspection on September 29: `https://dailyredsea.com/tours/orange-bay` says URL is on Google / Page is indexed, HTTPS, one valid breadcrumb item. No live test or indexing request performed.

## Recommended order of work

1. Inspect a bounded list of important unindexed tour/destination URLs. Check live accessibility, canonical, language content and internal links before deciding corrections or indexing requests. Do not blindly resubmit all 546 URLs.
2. Improve /tours/full-day-snorkeling and /transfers: inspect each page's queries and current content, clarify search intent in titles/headings, provide verified pickup/inclusion/pricing details and useful internal links. Their page-level average positions are relatively close to the first ten results, with small samples.
3. Improve /hurghada/diving-snorkeling: highest visible non-homepage impressions. Build useful snorkeling versus beginner/certified diving guidance and descriptive links to matching trips, based on verified inventory.
4. Follow with /hurghada/island-trips and an accurate island comparison. Jeddah content has exposure but weaker average positions; treat it as a longer-term opportunity.
5. Compare the same pages over the next 28-day period, allowing for reporting delay. Track non-homepage organic clicks, relevant query impressions and important URLs indexed. Do not interpret low-volume changes as proof of causality.

No site changes, publication, paid services or Search Console submissions were made in this audit.

Sources: authenticated [Performance](https://search.google.com/u/1/search-console/performance/search-analytics?resource_id=sc-domain%3Adailyredsea.com), [Page indexing](https://search.google.com/u/1/search-console/index?resource_id=sc-domain%3Adailyredsea.com), [Sitemaps](https://search.google.com/u/1/search-console/sitemaps?resource_id=sc-domain%3Adailyredsea.com); [Google indexing guidance](https://support.google.com/webmasters/answer/7440203), [Google SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide).

## Implementation completed locally September 29

- Destination-neutral short-title branding prevents unrelated pages acquiring Hurghada keywords.
- Clearer transfer/category descriptions, localized destination links, live linked comparison cards, corrected duration/beach-time guidance, and English/Arabic snorkeling comparison guidance.
- Arabic and Polish category headings use their own language for the location phrase.
- Sitemap handles empty/invalid blog dates and absolute external tour-image URLs.
- Fixed a shared phone-country selector hydration mismatch caused by different Node/browser region names. Initial SSR/hydration uses stable country codes; browser-localized names follow hydration.
- Validation: 74 test files / 661 tests passed, ESLint passed, TypeScript passed, final production build passed. Browser inspected English category, island, snorkeling and transfer pages plus Arabic category RTL. No horizontal overflow at the browser's current viewport. Final production transfer check rendered 261 country options without a new hydration error. Dev-only CSP diagnostic remains separate from production behavior.
- No deployment or Google indexing requests performed. Ranking gains and indexing changes cannot be established from local validation.
