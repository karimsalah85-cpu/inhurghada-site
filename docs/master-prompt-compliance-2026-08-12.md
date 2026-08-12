# Daily Red Sea master-prompt compliance matrix — 2026-08-12

## Evidence boundary

This report distinguishes code/test evidence from runtime evidence. Repository inspection, Vitest, ESLint, TypeScript and a production build were available. A Git-triggered Vercel Preview was built successfully. No local database runtime or browser backend was available, so database execution, visual responsiveness, console/network inspection and authenticated administration journeys are not marked verified. No production mutation, paid resource, software installation, real booking, charge or customer message was performed.

Classification vocabulary follows the requested list: **Verified and complete**, **Implemented but unverified**, **Partial**, **Missing**, **Postponed**, **Blocked**, **Not applicable**.

## 1. Existing-system and working-approach requirements

| Requirement | Classification | Evidence |
| --- | --- | --- |
| Read repository and relevant skill instructions | Verified and complete | `AGENTS.md`; Next.js local docs; Supabase, Browser, Vercel and Git publishing skill instructions were inspected before related work. |
| Inspect repository architecture and configuration | Verified and complete | Repository map covers `app/`, `components/`, `data/`, `lib/`, `supabase/`, `tests/`, `.github/workflows`, `next.config.ts`, `vercel.json`, `.env.example`. |
| Identify framework/package manager/hosting/database/auth | Verified and complete | Next.js 16.2.11/React 19/npm in `package.json`; Vercel link in `.vercel/project.json`; Supabase SSR/client utilities and SQL migrations; Supabase Auth-backed admin layout/API. |
| Identify tour, booking, cart, pricing, localization and images | Verified and complete | `data/tours.ts`, `lib/live-content.ts`, `lib/booking-*`, `components/cart/CartProvider.tsx`, `lib/i18n.ts`, `next.config.ts`, image audit. |
| Identify analytics, consent, notifications, tests and monitoring | Verified and complete | `components/analytics/AnalyticsProvider.tsx`, `lib/analytics.ts`, email/Twilio code in `lib/booking-service.ts`, 23+ Vitest files, GitHub workflows, `/api/health`, Vercel runtime-error query. |
| Inspect environment-variable names without secrets | Verified and complete | `.env.example` reviewed; only names reported. No secret values committed or printed. |
| Parallel independent audit | Verified and complete | Three audit agents returned public-image, licensing/SEO and admin/data findings, reconciled into the image audit. |
| Run application and inspect public/admin in browser | Blocked | Browser runtime initialized and prescribed troubleshooting followed; `agent.browsers.list()` returned `[]`. Admin also requires test authentication and isolated DB. |
| Desktop/mobile visual testing and screenshots | Blocked | No browser backend; no screenshots claimed. |
| Trace complete booking through administration | Blocked | Requires browser, synthetic authenticated admin and isolated DB; none available. |

## 2. Recommendation re-evaluation

| Recommendation | Classification | Evidence and quality assessment |
| --- | --- | --- |
| Dedicated searchable/filterable `/tours` catalogue | Missing | No `app/tours/page.tsx`; homepage search and category explorers exist, but there is no standalone complete catalogue route. |
| Homepage limited to featured experiences | Partial | Homepage renders/searches the live catalogue client-side (`app/page.tsx`); badges exist but no authoritative featured collection limits payload/rendering. |
| Destination pages | Partial | Generic `/destinations/[destination]` exists with Hurghada and coming-soon Marsa Alam, but destinations are code-defined in `lib/destinations.ts`. |
| Activity and traveler-intent categories | Partial | Eight activity categories in `lib/tour-categories.ts`; no traveler-intent collections/admin model. |
| Date availability, capacity and blackouts | Implemented but unverified | `tour_availability`, API, admin fields, row-locked reservation functions and release trigger in migrations; no local DB execution. |
| Pickup zones and supplements | Partial | Transfer and marina areas are hard-coded in `lib/booking-pricing.ts`; no destination/pickup-zone entities or structured supplement administration. |
| Instant versus manual confirmation | Partial | `bookingMode` distinguishes direct/inquiry and copy promises later WhatsApp confirmation, but a structured confirmation-mode workflow is absent. |
| Central tour data model | Partial | Static typed catalogue plus DB JSON overrides (`data/tours.ts`, `content_items`, `lib/live-content.ts`) creates two compatible layers, not one fully relational authority. |
| Tour variants and optional extras | Partial | Boat options, fixed extras and quantity extras exist; admin edits raw tour JSON rather than structured variants/extras. |
| Explicit pricing units | Verified and complete | `pricingMode`, `priceUnit`, boat options and server pricing; tests cover per-person, per-booking/private-boat, per-day display and fixed transfer fares. Coverage is not universal across all 31 products. |
| Currency conversion and rounding | Verified and complete | Currency context/rates plus server USD amounts; pricing rounds to cents; tests cover authoritative totals. Booked exchange-rate snapshot is not stored. |
| Cart and booking persistence | Partial | Cart uses versioned `localStorage`; DB bookings persist when configured. `lib/booking-service.ts` retains an in-memory fallback, which is not durable across server instances. |
| Server-side price validation | Verified and complete | Client totals are discarded by validation and recalculated from catalogue in `lib/booking-pricing.ts`; unit tests pass. |
| Duplicate-booking protection/idempotency | Missing | Rate limiting, honeypot and random references exist, but no client idempotency key or durable unique request token prevents repeated valid submissions. |
| Booking status workflow | Partial | Status/payment fields, admin booking APIs and notification helpers exist; complete runtime workflow unverified. |
| Operator and supplier management | Partial | Supplier tables/pages, staff and booking assignments exist; explicit operator entity and end-to-end operation unverified. |
| Tour-specific reviews | Missing | Tour ratings are static strings; Google reviews are site-wide. No verified tour-review relation/moderation workflow. |
| Safety, qualification and cancellation information | Partial | Tour notes, suitability, what-to-bring, diving licence and quad-age validation exist; `.env.example` still contains a cancellation-policy placeholder. |
| Product/Offer/FAQ/Breadcrumb/rating structured data | Partial | Tour shell emits several schemas; repository search confirms schema code, but ratings/provenance and all page variants need rendered validation. Organization logo still points to legacy PNG. |
| Canonical and hreflang | Verified and complete | Metadata helpers, localized routes and sitemap alternates; routing/i18n/tour-discovery tests pass. Destination localization remains English-only. |
| Multilingual content management | Partial | Six locales and DB `locale` field; many translations remain code-defined. Curated public media now requests the route locale with English/legacy fallback, and the media editor exposes localized alt/caption rows. |
| Search-friendly destination/activity pages | Partial | Category pages and sitemap entries exist; destination hierarchy and localized destination content are incomplete. |
| Analytics and funnel measurement | Implemented but unverified | Consent-gated GA/GTM/Meta event layer and event documentation exist; provider credentials and live dashboards not tested. |
| Error monitoring and operational alerts | Partial | Error boundaries, health endpoint, Vercel logs and admin health tables exist; no dedicated Sentry-style error aggregation/alert proof. |
| Unit/integration/browser tests | Partial | Unit/regression suite and deployment smoke script exist. No database integration harness or browser E2E suite. |
| Accessible navigation/booking controls | Partial | Semantic labels, ARIA, focusable consent dialog and keyboard buttons are present; no automated axe or browser keyboard audit. |
| Mobile performance | Partial | Responsive Next Images and source formats are configured; build succeeds, but no Lighthouse/browser layout evidence. |

## 3. Multi-destination architecture

| Requirement | Classification | Evidence |
| --- | --- | --- |
| Avoid Hurghada-only hard-coding | Partial | `destinationSlug` and generic destination page exist, but 0 static tour objects explicitly declare `destinationSlug`; fallback is Hurghada and category URLs are hard-coded under `/hurghada/`. |
| Country/region/destination/pickup/meeting hierarchy | Missing | Only a small `Destination` TypeScript object exists; no normalized country, region, pickup-zone or meeting-point schema. |
| Destination localized names/slugs/status/content/coordinates/media/categories/FAQ/SEO/order/publication | Missing | `lib/destinations.ts` contains slug, name, country, tagline, active/comingSoon/image only. |
| Destination management in administration | Missing | `content_items` types exclude destination; no destination admin tab or API resource. |
| Create/publish ordinary destination without code | Missing | Adding a destination requires editing `lib/destinations.ts`; categories/routes also assume Hurghada. |
| Stable destination URLs | Partial | `/destinations/[destination]` exists; nested `/destinations/[destination]/diving` and `/tours` routes do not. Existing `/hurghada/[category]` remains indexed. |
| Redirect plan before URL changes | Verified and complete | No route migration was performed; existing Senzo and hostname redirects remain in `next.config.ts`; report recommends avoiding premature URL changes. |

## 4. Administration operability

| Requirement | Classification | Evidence |
| --- | --- | --- |
| Server authorization and permissions | Verified and complete | Admin auth helpers and role tests; API permission checks and RLS migrations. Runtime DB policy execution unverified. |
| Audit history | Implemented but unverified | Admin mutations call `record_admin_audit`; audit-log table/page exists. |
| Tours, SEO, translations and publication | Partial | Control center edits content rows and raw JSON, locale/status/listing fields and SEO metadata; not a structured tour editor. |
| Availability/capacity/blackouts | Implemented but unverified | Admin availability resource and DB schema/functions exist. |
| Suppliers/staff/assignments/bookings/statuses | Partial | Dedicated pages/APIs/tables exist; authenticated journey unverified. |
| Prices, units, extras, pickup supplements | Partial | Pricing fields in tour form, but units/extras/supplements are mainly raw JSON or hard-coded. |
| Images and alt text | Partial | URL registry, structured localized-alt editor, provenance metadata, focal previews and public focal rendering exist; binary upload/renditions remain missing. |
| Reviews/moderation and refunds | Missing | No review moderation entity/screen; cancellation status exists but structured refund management is not demonstrated. |
| Featured/popular collections | Partial | Static badges exist; no structured admin collection management. |
| Media provenance fields | Implemented but unverified | Migration/API/UI include source, creator, license, rights, attribution, authenticity and focal points. Migration not executed. |
| Localized media metadata | Implemented but unverified | `media_asset_localizations`, structured admin rows, API reads and transactional replacement exist; pure merge fallback is unit-tested, but DB execution is blocked. |
| Media usage and safe deletion | Implemented but unverified | Generic usages, structured owner/role/order editor, FK `RESTRICT`, API explicit/legacy checks and fail-closed errors exist. DB execution remains blocked. |
| Desktop/mobile crop preview | Implemented but unverified | 16:9 and 4:3 previews in `AdminControlCenter.tsx`; no browser evidence. |
| Upload/replace/validation/renditions | Missing | No storage upload, MIME sniffing, size/pixel caps, EXIF stripping or rendition generation. |
| Gallery assignment/reordering | Implemented but unverified | The media editor assigns tour featured/gallery roles and reorders/removes usages; public tours consume authoritative order. This is asset-centric, not a full thumbnail picker. |
| Preview mutation isolation | Verified and complete | POST/PATCH/DELETE return 503 when `VERCEL_ENV=preview`; regression test covers the guard. |

## 5. Image and visual-asset audit

| Requirement | Classification | Evidence |
| --- | --- | --- |
| Inventory quality/relevance/dimensions/size/format/usage | Verified and complete | Audit identified 47 visual assets (~19.8 MB), 35 tourism/brand images, largest files and all static references. |
| Desktop/mobile cropping | Partial | Saved focal points now drive public `object-position` with safe 0.5 defaults and unit coverage; browser visual proof remains blocked. |
| Responsive sizing/lazy loading | Verified and complete | `next/image` usage, `sizes`, priority choices and homepage art direction inspected. |
| Alternative text | Partial | Detailed alt is sparse; fallbacks often title/generic gallery text; localization incomplete. |
| Credits/source/licensing | Verified and complete | Repository provenance conflict documented; all existing tourism binaries remain unverified absent exact source/binary proof. |
| Duplicate/overused images | Verified and complete | No exact SHA duplicates; semantic reuse and misleading fallback galleries documented. |
| Destination/activity accuracy | Verified and complete | Cairo/Luxor, horse/island, quad/camel, spa/generic, El Gouna/generic, Dolphin House reuse and Senzo mismatch identified. |
| Remove misleading fallback galleries | Verified and complete | `TourPageShell` now uses only `tour.galleryImages`; no-gallery rendering is guarded; build/tests pass. |
| Replace unverified images | Postponed | No image was sourced or published without verified rights; seven structured photography briefs are documented. |
| Shutterstock licence verification | Not applicable | No Shutterstock image was selected or downloaded. Search results were not treated as licences. |
| Preserve URLs/CDN/indexing/schema references | Verified and complete | No existing tourism filename changed; build/sitemap tests pass. |
| Image-credit claims corrected | Verified and complete | Public page now states recorded sources do not prove exact deployed binaries; preview returned updated metadata/content. |
| Modern formats/fallbacks | Partial | Next negotiates AVIF/WebP for `next/image`; originals/background/direct URLs remain unconverted. |
| OG/social image improvements | Postponed | Generic SVG/legacy branding and crawler compatibility are documented; changing requires licensed/approved raster art. |

## 6. Correctness, security and booking integrity

| Requirement | Classification | Evidence |
| --- | --- | --- |
| Strict TypeScript/server rendering discipline | Verified and complete | TypeScript check and production build pass; client components are used for interaction. |
| Validate booking input server-side | Verified and complete | `validateBookingInput`; malformed contacts/dates/counts/safety confirmations tested. |
| Recalculate prices server-side | Verified and complete | Client amount/currency ignored; catalogue-derived totals tested. |
| Transactional capacity conflict handling | Implemented but unverified | PL/pgSQL row locking and atomic functions exist; cannot execute without local DB. |
| Prevent duplicate submissions | Missing | No durable idempotency key/constraint. |
| Store currency, exchange rate and final amount | Partial | Final amount/currency stored; booked exchange-rate snapshot absent. |
| Protect admin mutations server-side | Verified and complete | Auth/permission checks, request-origin checks on sensitive APIs, RLS definitions and preview mutation guard. |
| Minimize personal data and preserve consent | Partial | Consent gating and limited booking fields exist; formal retention/deletion audit not found. |
| Loading/empty/success/error states | Partial | Global loading/error pages and component notices exist; exhaustive browser-state testing unavailable. |
| No false availability/urgency/ratings | Partial | No artificial urgency found; static ratings/review counts lack per-review provenance and should not feed misleading aggregate schema. |
| Payment safety | Verified and complete | Current booking API returns cash-on-arrival and does not create Stripe sessions; payment helpers/webhook exist but no charge was invoked. |
| Notification safety | Verified and complete | Email/Twilio helpers were inspected but not called; no real message was sent. Failed-notification results are returned rather than making booking persistence contingent on delivery. |

## 7. SEO, localization, accessibility and performance

| Requirement | Classification | Evidence |
| --- | --- | --- |
| Canonical, hreflang, sitemap and robots | Verified and complete | i18n/public-route/tour-discovery tests; sitemap includes localized routes and image URLs; invalid paths are noindex. |
| Arabic RTL | Implemented but unverified | Localized route sets `direction = locale === "ar" ? "rtl" : "ltr"`; Arabic content exists. Visual/bidi/form behavior unverified. |
| Missing-translation fallback | Partial | Localization functions fall back to English; this can hide incomplete translation rather than expose editorial status. |
| Structured-data accuracy | Partial | Schemas exist, but Organization logo uses `/images/logo.png`; tour rating provenance and live rendered validation remain concerns. |
| Blog/destination social images | Missing | Blog metadata omits post hero; destination OG has no image; generic SVG is inherited. |
| Consent mode and analytics privacy | Implemented but unverified | Default denied consent and conditional tags in `AnalyticsProvider`; browser/network verification unavailable. |
| Security headers | Verified and complete | CSP, referrer, nosniff, frame and permissions policies in `next.config.ts`; smoke script checks headers. |
| Accessibility | Partial | Semantic/ARIA patterns exist; no axe, screen-reader or keyboard browser audit. Cookie dialog lacks a demonstrated focus trap. |
| Image/performance optimization | Partial | AVIF/WebP negotiation and responsive images; oversized repository originals and generic homepage catalogue payload remain. |
| Build/deployment health | Verified and complete | Local build generated 431 pages; Vercel preview build ready; no runtime errors in queried interval. |

## 8. Required customer and operational journeys

All browser journeys below are **Blocked** unless otherwise stated. The browser runtime exposed no backend, the hosted preview is protected, and DB-dependent preview mutations are intentionally disabled.

| Journey/case | Classification | Non-browser evidence |
| --- | --- | --- |
| Browse destination/category/open tour | Implemented but unverified | Routes/components build; sitemap/category tests pass. |
| Filter/search tours | Implemented but unverified | Homepage and category client search code; search unit tests pass. No `/tours` catalogue. |
| Change currency | Implemented but unverified | Currency selector/context and pricing display code. |
| Select date/travelers/extras/add to cart/refresh | Implemented but unverified | Booking components, cart `localStorage`, pricing/validation tests. |
| Submit booking/customer confirmation/admin visibility/status | Blocked | Would require isolated DB, synthetic delivery stubs and admin auth. No real submission performed. |
| Prevent duplicate submission | Missing | Durable idempotency absent. |
| Sold-out/blackout/capacity race | Implemented but unverified | SQL function logic exists; DB execution blocked. |
| Invalid travelers/private boat/per-vehicle/pickup supplement | Verified and complete | Booking pricing/validation unit tests. |
| Expired/unavailable price | Partial | Listing availability is checked; no explicit price-version/expiry model. |
| Draft destination/archived tour | Partial | Destination `active/comingSoon`; content draft/archive/listing status. Cross-system runtime behavior unverified. |
| Failed notification | Partial | Helpers return failures; booking response exposes delivery state. No stubbed route-level integration test. |
| Mobile booking/RTL/direct search visit/console/network | Blocked | Requires browser. |
| Invalid/old URL | Verified and complete | Proxy route tests and redirects; Senzo legacy redirect configured. |

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
