# Daily Red Sea master-prompt compliance matrix — 2026-08-12

## Evidence boundary

This report distinguishes code/test evidence from runtime evidence. Repository inspection, Vitest, ESLint, TypeScript and a production build were available. A Git-triggered Vercel Preview was built successfully. No local database runtime or browser backend was available, so database execution, visual responsiveness, console/network inspection and authenticated administration journeys are not marked verified. No production mutation, paid resource, software installation, real booking, charge or customer message was performed.

Classification vocabulary follows the requested list: **Verified before this session**, **Verified now**, **Implemented and tested**, **Implemented but not runtime-tested**, **Partially implemented**, **Missing**, **Intentionally postponed**, **Blocked by tooling, credentials or a business decision**, **Not applicable**.

## 1. Existing-system and working-approach requirements

| Requirement | Classification | Evidence |
| --- | --- | --- |
| Read repository and relevant skill instructions | Verified now | `AGENTS.md`; Next.js local docs; Supabase, Browser, Vercel and Git publishing skill instructions were inspected before related work. |
| Inspect repository architecture and configuration | Verified now | Repository map covers `app/`, `components/`, `data/`, `lib/`, `supabase/`, `tests/`, `.github/workflows`, `next.config.ts`, `vercel.json`, `.env.example`. |
| Identify framework/package manager/hosting/database/auth | Verified now | Next.js 16.2.11/React 19/npm in `package.json`; Vercel link in `.vercel/project.json`; Supabase SSR/client utilities and SQL migrations; Supabase Auth-backed admin layout/API. |
| Identify tour, booking, cart, pricing, localization and images | Verified now | `data/tours.ts`, `lib/live-content.ts`, `lib/booking-*`, `components/cart/CartProvider.tsx`, `lib/i18n.ts`, `next.config.ts`, image audit. |
| Identify analytics, consent, notifications, tests and monitoring | Verified now | `components/analytics/AnalyticsProvider.tsx`, `lib/analytics.ts`, email/Twilio code in `lib/booking-service.ts`, 23+ Vitest files, GitHub workflows, `/api/health`, Vercel runtime-error query. |
| Inspect environment-variable names without secrets | Verified now | `.env.example` reviewed; only names reported. No secret values committed or printed. |
| Parallel independent audit | Verified before this session | Three audit agents returned public-image, licensing/SEO and admin/data findings, reconciled into the image audit. |
| Run application and inspect public/admin in browser | Blocked by tooling, credentials or a business decision | Browser runtime initialized and prescribed troubleshooting followed; `agent.browsers.list()` returned `[]`. Admin also requires test authentication and isolated DB. |
| Desktop/mobile visual testing and screenshots | Blocked by tooling, credentials or a business decision | No browser backend; no screenshots claimed. |
| Trace complete booking through administration | Blocked by tooling, credentials or a business decision | Requires browser, synthetic authenticated admin and isolated DB; none available. |

## 2. Recommendation re-evaluation

| Recommendation | Classification | Evidence and quality assessment |
| --- | --- | --- |
| Dedicated searchable/filterable `/tours` catalogue | Missing | No `app/tours/page.tsx`; homepage search and category explorers exist, but there is no standalone complete catalogue route. |
| Homepage limited to featured experiences | Partially implemented | Homepage renders/searches the live catalogue client-side (`app/page.tsx`); badges exist but no authoritative featured collection limits payload/rendering. |
| Destination pages | Partially implemented | Generic `/destinations/[destination]` exists with Hurghada and coming-soon Marsa Alam, but destinations are code-defined in `lib/destinations.ts`. |
| Activity and traveler-intent categories | Partially implemented | Eight activity categories in `lib/tour-categories.ts`; no traveler-intent collections/admin model. |
| Date availability, capacity and blackouts | Implemented but not runtime-tested | `tour_availability`, API, admin fields, row-locked reservation functions and release trigger in migrations; no local DB execution. |
| Pickup zones and supplements | Partially implemented | Transfer and marina areas are hard-coded in `lib/booking-pricing.ts`; no destination/pickup-zone entities or structured supplement administration. |
| Instant versus manual confirmation | Partially implemented | `bookingMode` distinguishes direct/inquiry and copy promises later WhatsApp confirmation, but a structured confirmation-mode workflow is absent. |
| Central tour data model | Partially implemented | Static typed catalogue plus DB JSON overrides (`data/tours.ts`, `content_items`, `lib/live-content.ts`) creates two compatible layers, not one fully relational authority. |
| Tour variants and optional extras | Partially implemented | Boat options, fixed extras and quantity extras exist; admin edits raw tour JSON rather than structured variants/extras. |
| Explicit pricing units | Implemented and tested | `pricingMode`, `priceUnit`, boat options and server pricing; tests cover per-person, per-booking/private-boat, per-day display and fixed transfer fares. Coverage is not universal across all 31 products. |
| Currency conversion and rounding | Implemented and tested | Currency context/rates plus server USD amounts; pricing rounds to cents; tests cover authoritative totals. Booked exchange-rate snapshot is not stored. |
| Cart and booking persistence | Partially implemented | Cart uses versioned `localStorage`; DB bookings persist when configured. `lib/booking-service.ts` retains an in-memory fallback, which is not durable across server instances. |
| Server-side price validation | Implemented and tested | Client totals are discarded by validation and recalculated from catalogue in `lib/booking-pricing.ts`; unit tests pass. |
| Duplicate-booking protection/idempotency | Missing | Rate limiting, honeypot and random references exist, but no client idempotency key or durable unique request token prevents repeated valid submissions. |
| Booking status workflow | Partially implemented | Status/payment fields, admin booking APIs and notification helpers exist; complete runtime workflow unverified. |
| Operator and supplier management | Partially implemented | Supplier tables/pages, staff and booking assignments exist; explicit operator entity and end-to-end operation unverified. |
| Tour-specific reviews | Missing | Tour ratings are static strings; Google reviews are site-wide. No verified tour-review relation/moderation workflow. |
| Safety, qualification and cancellation information | Partially implemented | Tour notes, suitability, what-to-bring, diving licence and quad-age validation exist; `.env.example` still contains a cancellation-policy placeholder. |
| Product/Offer/FAQ/Breadcrumb/rating structured data | Partially implemented | Tour shell emits several schemas; repository search confirms schema code, but ratings/provenance and all page variants need rendered validation. Organization logo still points to legacy PNG. |
| Canonical and hreflang | Implemented and tested | Metadata helpers, localized routes and sitemap alternates; routing/i18n/tour-discovery tests pass. Destination localization remains English-only. |
| Multilingual content management | Partially implemented | Six locales and DB `locale` field; many translations are code-defined, public live loader is English-focused, media localization UI absent. |
| Search-friendly destination/activity pages | Partially implemented | Category pages and sitemap entries exist; destination hierarchy and localized destination content are incomplete. |
| Analytics and funnel measurement | Implemented but not runtime-tested | Consent-gated GA/GTM/Meta event layer and event documentation exist; provider credentials and live dashboards not tested. |
| Error monitoring and operational alerts | Partially implemented | Error boundaries, health endpoint, Vercel logs and admin health tables exist; no dedicated Sentry-style error aggregation/alert proof. |
| Unit/integration/browser tests | Partially implemented | Unit/regression suite and deployment smoke script exist. No database integration harness or browser E2E suite. |
| Accessible navigation/booking controls | Partially implemented | Semantic labels, ARIA, focusable consent dialog and keyboard buttons are present; no automated axe or browser keyboard audit. |
| Mobile performance | Partially implemented | Responsive Next Images and source formats are configured; build succeeds, but no Lighthouse/browser layout evidence. |

## 3. Multi-destination architecture

| Requirement | Classification | Evidence |
| --- | --- | --- |
| Avoid Hurghada-only hard-coding | Partially implemented | `destinationSlug` and generic destination page exist, but 0 static tour objects explicitly declare `destinationSlug`; fallback is Hurghada and category URLs are hard-coded under `/hurghada/`. |
| Country/region/destination/pickup/meeting hierarchy | Missing | Only a small `Destination` TypeScript object exists; no normalized country, region, pickup-zone or meeting-point schema. |
| Destination localized names/slugs/status/content/coordinates/media/categories/FAQ/SEO/order/publication | Missing | `lib/destinations.ts` contains slug, name, country, tagline, active/comingSoon/image only. |
| Destination management in administration | Missing | `content_items` types exclude destination; no destination admin tab or API resource. |
| Create/publish ordinary destination without code | Missing | Adding a destination requires editing `lib/destinations.ts`; categories/routes also assume Hurghada. |
| Stable destination URLs | Partially implemented | `/destinations/[destination]` exists; nested `/destinations/[destination]/diving` and `/tours` routes do not. Existing `/hurghada/[category]` remains indexed. |
| Redirect plan before URL changes | Verified now | No route migration was performed; existing Senzo and hostname redirects remain in `next.config.ts`; report recommends avoiding premature URL changes. |

## 4. Administration operability

| Requirement | Classification | Evidence |
| --- | --- | --- |
| Server authorization and permissions | Implemented and tested | Admin auth helpers and role tests; API permission checks and RLS migrations. Runtime DB policy execution unverified. |
| Audit history | Implemented but not runtime-tested | Admin mutations call `record_admin_audit`; audit-log table/page exists. |
| Tours, SEO, translations and publication | Partially implemented | Control center edits content rows and raw JSON, locale/status/listing fields and SEO metadata; not a structured tour editor. |
| Availability/capacity/blackouts | Implemented but not runtime-tested | Admin availability resource and DB schema/functions exist. |
| Suppliers/staff/assignments/bookings/statuses | Partially implemented | Dedicated pages/APIs/tables exist; authenticated journey unverified. |
| Prices, units, extras, pickup supplements | Partially implemented | Pricing fields in tour form, but units/extras/supplements are mainly raw JSON or hard-coded. |
| Images and alt text | Partially implemented | URL registry, English fallback alt, governance metadata and crop previews; no upload pipeline or localized-alt UI. |
| Reviews/moderation and refunds | Missing | No review moderation entity/screen; cancellation status exists but structured refund management is not demonstrated. |
| Featured/popular collections | Partially implemented | Static badges exist; no structured admin collection management. |
| Media provenance fields | Implemented but not runtime-tested | Migration/API/UI include source, creator, license, rights, attribution, authenticity and focal points. Migration not executed. |
| Localized media metadata | Implemented but not runtime-tested | `media_asset_localizations` table exists; API/UI CRUD for it is missing. |
| Media usage and safe deletion | Implemented but not runtime-tested | `media_usages` FK `RESTRICT`; API checks explicit and legacy references and fails closed on errors. No DB runtime. |
| Desktop/mobile crop preview | Implemented but not runtime-tested | 16:9 and 4:3 previews in `AdminControlCenter.tsx`; no browser evidence. |
| Upload/replace/validation/renditions | Missing | No storage upload, MIME sniffing, size/pixel caps, EXIF stripping or rendition generation. |
| Gallery assignment/reordering | Missing | Tours retain JSON gallery arrays; no picker/sortable editor. |
| Preview mutation isolation | Implemented and tested | POST/PATCH/DELETE return 503 when `VERCEL_ENV=preview`; regression test covers the guard. |

## 5. Image and visual-asset audit

| Requirement | Classification | Evidence |
| --- | --- | --- |
| Inventory quality/relevance/dimensions/size/format/usage | Verified before this session | Audit identified 47 visual assets (~19.8 MB), 35 tourism/brand images, largest files and all static references. |
| Desktop/mobile cropping | Partially implemented | Code review identified forced cover crops and Senzo portrait divergence; no browser visual proof. |
| Responsive sizing/lazy loading | Verified before this session | `next/image` usage, `sizes`, priority choices and homepage art direction inspected. |
| Alternative text | Partially implemented | Detailed alt is sparse; fallbacks often title/generic gallery text; localization incomplete. |
| Credits/source/licensing | Verified before this session | Repository provenance conflict documented; all existing tourism binaries remain unverified absent exact source/binary proof. |
| Duplicate/overused images | Verified before this session | No exact SHA duplicates; semantic reuse and misleading fallback galleries documented. |
| Destination/activity accuracy | Verified before this session | Cairo/Luxor, horse/island, quad/camel, spa/generic, El Gouna/generic, Dolphin House reuse and Senzo mismatch identified. |
| Remove misleading fallback galleries | Implemented and tested | `TourPageShell` now uses only `tour.galleryImages`; no-gallery rendering is guarded; build/tests pass. |
| Replace unverified images | Intentionally postponed | No image was sourced or published without verified rights; seven structured photography briefs are documented. |
| Shutterstock licence verification | Not applicable | No Shutterstock image was selected or downloaded. Search results were not treated as licences. |
| Preserve URLs/CDN/indexing/schema references | Implemented and tested | No existing tourism filename changed; build/sitemap tests pass. |
| Image-credit claims corrected | Implemented and tested | Public page now states recorded sources do not prove exact deployed binaries; preview returned updated metadata/content. |
| Modern formats/fallbacks | Partially implemented | Next negotiates AVIF/WebP for `next/image`; originals/background/direct URLs remain unconverted. |
| OG/social image improvements | Intentionally postponed | Generic SVG/legacy branding and crawler compatibility are documented; changing requires licensed/approved raster art. |

## 6. Correctness, security and booking integrity

| Requirement | Classification | Evidence |
| --- | --- | --- |
| Strict TypeScript/server rendering discipline | Implemented and tested | TypeScript check and production build pass; client components are used for interaction. |
| Validate booking input server-side | Implemented and tested | `validateBookingInput`; malformed contacts/dates/counts/safety confirmations tested. |
| Recalculate prices server-side | Implemented and tested | Client amount/currency ignored; catalogue-derived totals tested. |
| Transactional capacity conflict handling | Implemented but not runtime-tested | PL/pgSQL row locking and atomic functions exist; cannot execute without local DB. |
| Prevent duplicate submissions | Missing | No durable idempotency key/constraint. |
| Store currency, exchange rate and final amount | Partially implemented | Final amount/currency stored; booked exchange-rate snapshot absent. |
| Protect admin mutations server-side | Implemented and tested | Auth/permission checks, request-origin checks on sensitive APIs, RLS definitions and preview mutation guard. |
| Minimize personal data and preserve consent | Partially implemented | Consent gating and limited booking fields exist; formal retention/deletion audit not found. |
| Loading/empty/success/error states | Partially implemented | Global loading/error pages and component notices exist; exhaustive browser-state testing unavailable. |
| No false availability/urgency/ratings | Partially implemented | No artificial urgency found; static ratings/review counts lack per-review provenance and should not feed misleading aggregate schema. |
| Payment safety | Verified now | Current booking API returns cash-on-arrival and does not create Stripe sessions; payment helpers/webhook exist but no charge was invoked. |
| Notification safety | Verified now | Email/Twilio helpers were inspected but not called; no real message was sent. Failed-notification results are returned rather than making booking persistence contingent on delivery. |

## 7. SEO, localization, accessibility and performance

| Requirement | Classification | Evidence |
| --- | --- | --- |
| Canonical, hreflang, sitemap and robots | Implemented and tested | i18n/public-route/tour-discovery tests; sitemap includes localized routes and image URLs; invalid paths are noindex. |
| Arabic RTL | Implemented but not runtime-tested | Localized route sets `direction = locale === "ar" ? "rtl" : "ltr"`; Arabic content exists. Visual/bidi/form behavior unverified. |
| Missing-translation fallback | Partially implemented | Localization functions fall back to English; this can hide incomplete translation rather than expose editorial status. |
| Structured-data accuracy | Partially implemented | Schemas exist, but Organization logo uses `/images/logo.png`; tour rating provenance and live rendered validation remain concerns. |
| Blog/destination social images | Missing | Blog metadata omits post hero; destination OG has no image; generic SVG is inherited. |
| Consent mode and analytics privacy | Implemented but not runtime-tested | Default denied consent and conditional tags in `AnalyticsProvider`; browser/network verification unavailable. |
| Security headers | Implemented and tested | CSP, referrer, nosniff, frame and permissions policies in `next.config.ts`; smoke script checks headers. |
| Accessibility | Partially implemented | Semantic/ARIA patterns exist; no axe, screen-reader or keyboard browser audit. Cookie dialog lacks a demonstrated focus trap. |
| Image/performance optimization | Partially implemented | AVIF/WebP negotiation and responsive images; oversized repository originals and generic homepage catalogue payload remain. |
| Build/deployment health | Implemented and tested | Local build generated 431 pages; Vercel preview build ready; no runtime errors in queried interval. |

## 8. Required customer and operational journeys

All browser journeys below are **Blocked by tooling, credentials or a business decision** unless otherwise stated. The browser runtime exposed no backend, the hosted preview is protected, and DB-dependent preview mutations are intentionally disabled.

| Journey/case | Classification | Non-browser evidence |
| --- | --- | --- |
| Browse destination/category/open tour | Implemented but not runtime-tested | Routes/components build; sitemap/category tests pass. |
| Filter/search tours | Implemented but not runtime-tested | Homepage and category client search code; search unit tests pass. No `/tours` catalogue. |
| Change currency | Implemented but not runtime-tested | Currency selector/context and pricing display code. |
| Select date/travelers/extras/add to cart/refresh | Implemented but not runtime-tested | Booking components, cart `localStorage`, pricing/validation tests. |
| Submit booking/customer confirmation/admin visibility/status | Blocked by tooling, credentials or a business decision | Would require isolated DB, synthetic delivery stubs and admin auth. No real submission performed. |
| Prevent duplicate submission | Missing | Durable idempotency absent. |
| Sold-out/blackout/capacity race | Implemented but not runtime-tested | SQL function logic exists; DB execution blocked. |
| Invalid travelers/private boat/per-vehicle/pickup supplement | Implemented and tested | Booking pricing/validation unit tests. |
| Expired/unavailable price | Partially implemented | Listing availability is checked; no explicit price-version/expiry model. |
| Draft destination/archived tour | Partially implemented | Destination `active/comingSoon`; content draft/archive/listing status. Cross-system runtime behavior unverified. |
| Failed notification | Partially implemented | Helpers return failures; booking response exposes delivery state. No stubbed route-level integration test. |
| Mobile booking/RTL/direct search visit/console/network | Blocked by tooling, credentials or a business decision | Requires browser. |
| Invalid/old URL | Implemented and tested | Proxy route tests and redirects; Senzo legacy redirect configured. |

## 9. Database and migration status

- The governance migration is statically verified as additive: no destructive DML/DDL, existing URL columns untouched, safe defaults, constrained values, RLS, indexes and foreign keys.
- `media_usages.asset_id` uses `ON DELETE RESTRICT`; localizations use `ON DELETE CASCADE`.
- Application deletion checks authoritative and legacy references and returns 503 when checks fail.
- Clean migration execution and synthetic CRUD are **blocked**: the repo lacks `supabase/config.toml`, `seed.sql`, DB tests and a Docker-compatible runtime. Cached CLI state is linked to the hosted project and was not used.
- Production and hosted Supabase were not modified.

## 10. Manual acceptance checklist

Use a local Supabase stack or explicitly isolated free test project only. Seed synthetic admin, media, content, tour, availability and booking records; stub email, WhatsApp and payments.

1. Confirm DB URL host is `127.0.0.1` before reset; apply every migration and seed from clean state.
2. Create/edit/reload all media governance fields; add Arabic/German alt rows; set focal points; verify constraints reject invalid values.
3. Create referenced/unreferenced media; delete unused; confirm explicit FK and API block referenced deletion; simulate unavailable usage query and expect 503.
4. Open admin media list/form at 1440×900 and 390×844; verify crop previews, keyboard order, loading/empty/error/success states.
5. Verify curated and no-gallery tours; then Cairo, horse, quad, Dolphin House, spa, El Gouna and Senzo on desktop/mobile without unrelated galleries.
6. Exercise destination/category/tour/search/currency/date/travelers/extras/cart/refresh/booking/admin/status journey using only synthetic data and delivery stubs.
7. Submit the same idempotency key twice after that feature exists; assert one booking/capacity reservation.
8. Test sold-out, blackout, capacity race, invalid counts, price version mismatch, private boat, fixed transfer, pickup supplement and missing translation.
9. Test Arabic RTL visually and by keyboard; run axe/Lighthouse; inspect layout shifts, console and failed network requests.
10. Inspect rendered canonical/hreflang/OG/Twitter/JSON-LD/sitemap and image URLs; confirm no preview URL is indexable.

## 11. Prioritized remaining work

1. **Correctness:** add durable booking idempotency and price-version/exchange-rate snapshots; eliminate non-durable production fallback behavior.
2. **Local verification:** authorize a Docker-compatible runtime and commit a pinned CLI/config/synthetic seed/test harness; run migrations from clean state.
3. **Destination scalability:** add relational destination/region/pickup/category models and structured admin workflows before Marsa Alam publication.
4. **Media operations:** implement localized metadata API/UI, usage browser, safe upload pipeline, renditions, gallery picker/order and archival deletion.
5. **Catalogue/conversion:** add a real `/tours` catalogue and explicit featured collections without loading the full catalogue on the homepage.
6. **Licensing/trust:** reconcile every deployed binary to source/rights proof; replace misleading images with approved authentic photography.
7. **SEO:** correct Organization logo, create licensed raster OG crops, align blog/destination metadata, and validate rendered schemas.
8. **Accessibility/performance:** browser-based RTL, keyboard, axe, Lighthouse and responsive-image verification.

## 12. Rollback and safety

- Revert commits `5cedd64` and `86c98f1` to remove this branch's implementation.
- If the additive migration is ever applied, stop application writes, export governed metadata, drop usage/localization tables, then remove added constraints/columns only after retention approval.
- Do not rename/remove existing image URLs during rollback.
- Preview control-center mutations remain disabled until an isolated database is configured.
