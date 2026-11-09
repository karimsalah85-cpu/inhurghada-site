# Discovered — currently not indexed: November 9, 2026

## Evidence

Source: user-supplied `dailyredsea.com-Coverage-Drilldown-2026-11-09.zip`. Its table contains 490 URLs; the chart ends November 6 at 490 affected pages. All table crawl dates are the export sentinel `1970-01-01`, not evidence that Google crawled these pages in 1970.

A read-only live GET crawl checked every exported URL on November 9:

- 490/490 returned HTTP 200, allowed indexing, and exposed self-referencing canonicals.
- 490/490 appeared in the live sitemap. The live sitemap contained 628 unique URLs.
- Public robots.txt allows these paths.
- The table includes 260 blog URLs, 127 tour URLs, 103 other pages. None of these figures establishes the site's indexed-page count.
- 259 of the 260 blog articles linked to no other article. Language-switch links to the same article were excluded from this measurement.
- An additional live check of `/ar/blog/how-much-does-a-snorkeling-trip-cost-in-hurghada-in` returned English main content and an Arabic self-canonical. This duplicate is outside the supplied exclusion table.

[Per-URL live audit](../../output/seo/2026-11-09-indexing/affected-url-audit.csv).

These results do not reveal Google's internal reason for deferring crawling. They identify correctable site defects; they do not prove that any one defect caused all 490 exclusions. Search Console's signed-in browser was unavailable, so URL Inspection, Crawl Stats, host-load findings and Googlebot logs were not examined. Ordinary HTTP requests also do not establish access from Google's verified crawler IP addresses.

## Changes prepared locally

1. **Restore article links.** Both Markdown conversion and the nightly hosted migration stripped hyperlinks to plain text. Preserve inline links and render actual escaped anchor elements, rejecting executable URL schemes. Initial regeneration restored 224 internal blog anchors across 102 articles, with no unknown article targets. Existing external references and homepage links also remain clickable. Plain-text FAQ answers stay suitable for structured data.
2. **Connect older articles.** Articles without existing guide links get up to three related published guides. Selection excludes the current article and separates Jeddah/Marsa Alam topics from other Egyptian content. Translated pages only suggest translated guides.
3. **Consolidate untranslated blog copies.** English-only articles use their English canonical even when an old localized URL is visited. Blog indexes and language controls link directly to the available version. Only actual translations appear in article hreflang sets. All four genuinely translated articles retain five non-English versions, localized metadata, reciprocal English alternates and self-canonicals.
4. **Complete blog discovery signals.** Add localized blog indexes and the 20 genuine translated article URLs to the sitemap, with reciprocal alternates. Article structured-data URLs follow the canonical version. Existing article content, URLs and publication dates are preserved.

## Validation and release state

- 116 test files / 1,020 tests passed; ESLint passed; TypeScript passed; optimized production build passed.
- The locally served production build returned 200 for English articles, an untranslated Arabic copy, a real Arabic translation, the Arabic blog index and the sitemap.
- HTML assertions confirmed restored contextual anchors, older-archive related links, English canonicals for fallback copies, translated self-canonicals, correct Arabic-index link destinations and absence of untranslated localized URLs from the sitemap.
- [Local HTML verification](../../output/seo/2026-11-09-indexing/local-verification.json).
- React review: content renders on the server; no added client data fetches, raw HTML rendering or translation payload in the language-switch bundle.
- Browser visual inspection was unavailable. No Search Console submissions were made.
- No database/schema changes. This audit was prepared before release; the live checks above describe the site before these changes.
- November 9 release preparation: applied only these fixes to current production source `4deef1e0` in an isolated worktree. Kept the three newer articles and all other intervening production changes. Regeneration on that source restores 234 internal blog anchors across 105 articles. All 244 imported articles were checked for unchanged text and metadata after stripping the restored link markup. The release checkout passed 123 test files / 1,095 tests and ESLint. Production deployment and live verification are recorded separately when complete.

## After publication

Verify the production canonical, article links and sitemap; inspect a small set of commercially important affected URLs in Search Console, such as the full-day snorkeling tour and representative Hurghada, Marsa Alam and localized landing pages. Request indexing for that bounded set only after the live test succeeds. Monitor subsequent crawl dates and important-page indexing; the exclusion total need not reach zero. Some generic guides also warrant later editorial review for useful first-hand information and concrete answers, but the export cannot establish a site-wide quality diagnosis.

Google explains that [crawlable links need anchor elements with href attributes](https://developers.google.com/search/docs/crawling-indexing/links-crawlable), that [untranslated main content produces duplicate localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions), and that [technical eligibility does not guarantee indexing](https://developers.google.com/search/docs/essentials/technical).
