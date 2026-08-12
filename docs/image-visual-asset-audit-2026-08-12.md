# Daily Red Sea image and visual-asset audit — 2026-08-12

## Release-safe category artwork

The Cairo/Giza, horse riding, quad safari, Turkish bath/spa, El Gouna, Dolphin House and Senzo products now use separate non-photographic SVG category placeholders under `public/images/placeholders/`. These files are original Daily Red Sea artwork created for this repository, carry no third-party attribution requirement, and deliberately avoid representing a particular operator, venue, wildlife encounter or operating condition. Legacy gallery assignments for those products are suppressed at the shared tour-media boundary, including when legacy CMS or media-registry URLs are present.

This is an interim accuracy and rights-control measure, not a claim that photography is unnecessary. Each affected product still requires authentic operator photography with a recorded creator/source, commercial-use rights evidence, acquisition date, exact binary checksum and appropriate localized alternative text before photographic media can replace the artwork.

## Executive summary

The repository contains 47 raster/vector visual assets totaling about 19.8 MB; 35 are tourism/brand images under `public/images`. Next.js image optimization, AVIF/WebP negotiation, lazy loading for non-priority images, and homepage desktop/mobile art direction are generally sound. The primary risks are rights provenance, product accuracy, generic galleries, focal-point/crop control, and incomplete administration tooling.

No current tourism binary can be declared cleared solely from repository evidence. `docs/image-credits.md` says provenance is unrecorded, while the public credits page previously made a broader Wikimedia claim. Later replacements and additions are not tied to exact source revisions or license proof. The current Senzo binary is one example where the recorded credit cannot be safely assumed to match the deployed file.

The audit found that Cairo trips used Luxor/Karnak, quad tours used a camel portrait, horse tours used an island-family scene, and wellness/El Gouna used generic imagery. The release-safe category artwork above now prevents those inaccurate photos from being published for the affected products while authentic, rights-verified operator photography is obtained.

## Verified current state

- Next.js 16.2.11 with `next/image`; AVIF and WebP output formats enabled.
- Homepage uses separate desktop and mobile hero sources and gives the hero high fetch priority.
- Cards and most thumbnails provide responsive `sizes`; non-priority `next/image` instances lazy-load by default.
- Tour main images are priority-loaded above the fold; lightbox images mount only when opened.
- Public source search references all 35 files under `public/images`; none is safe to remove based on static analysis alone.
- No exact duplicate binaries were found by SHA-256. Duplication is semantic reuse.
- The admin has a media registry but previously supported URL registration only, not binary upload.

## Critical findings

| Priority | Finding | Evidence | Decision |
| --- | --- | --- | --- |
| P0 | Rights status cannot be proven per deployed binary | `docs/image-credits.md`; missing source/license fields | Mark unverified; reconcile source, creator, license and checksum before replacement/publication claims |
| P0 | Product images can be inaccurate | `data/tours.ts` Cairo, quad, horse, spa and El Gouna records | Replace with genuine operator photography; do not substitute generic stock without approval |
| P0 | Category fallbacks fabricate galleries | `components/tours/TourPageShell.tsx` | Removed; only product-curated galleries now render |
| P1 | Portrait assets crop differently across desktop/mobile | `components/tours/TourGallery.tsx` fixed 4:3/mobile and 420px desktop cover frames | Add per-asset focal points; admin crop preview implemented |
| P1 | Most gallery alt text is missing or generic | `Tour.imageAlt`, `galleryImageAlts` coverage | Localized alt table added in migration; population/UI remains next step |
| P1 | Admin deletion did not check usage | media DELETE route | Added explicit and legacy-reference checks; in-use deletion returns 409 |
| P1 | Public credits overstated certainty | `app/image-credits/page.tsx` | Corrected language to distinguish recorded source from verified binary provenance |
| P2 | Large source binaries increase repository/deploy weight | 3.0 MB speedboat PNG, 3.0 MB `hero.jpg`, 2.1 MB legacy logo | Optimize only after provenance/URL impact review; Next currently optimizes most rendered uses |

## Replacement queue

1. Cairo/Giza bus and flight: use genuine Cairo/Giza photography; current Luxor/Karnak images are geographically wrong.
2. Horse-riding products: use real operator horse/route photography; current family-island scene is wrong.
3. Turkish bath/spa: use verified venue or service photography; current generic beach hero is wrong.
4. El Gouna lagoon/city: use genuine El Gouna operational photography.
5. Morning and sunset quad tours: use quad imagery matching time/route; camel close-up is not representative.
6. Dolphin House: use authentic boat/reef photography and avoid implying guaranteed dolphin encounters.
7. Senzo transfer: use a properly licensed or owned Senzo/vehicle visual with a landscape-safe crop; current portrait composite produces divergent crops.

For every replacement, record exact source URL, creator, license type/version, license URL, attribution text, acquisition date/proof, checksum, authenticity, and affected usages. Shutterstock search results or watermarked previews are not license evidence.

## Structured replacement photography briefs

| Priority subject | Required subject and authenticity | Composition and minimum delivery | Prohibited misleading elements | Intended usage |
| --- | --- | --- | --- | --- |
| Cairo/Giza | Genuine operator or commissioned photography showing the Giza pyramids/Sphinx and, where relevant, the actual vehicle or flight-day experience. Location and service must be verifiable. | Landscape 3:2 or 16:9 master, minimum 2400×1600; keep the principal monument and people inside a central mobile-safe crop. | Luxor/Karnak, unrelated temples, fabricated crowds, implied private access, altered monuments, or a vehicle/service not supplied. | Cairo bus and Cairo flight primary images, curated galleries, cards and approved social crops. |
| Horse riding | A real Daily Red Sea or contracted operator horse ride on the actual advertised terrain, with correctly fitted tack and responsible animal handling. Obtain rider/model consent where identifiable. | Landscape master at least 2400×1600 plus one portrait-safe composition; horse, rider and route context must survive 16:9 and 4:3 crops. | Island-family scenes, racing, unsafe riding, distressed animals, unsupported beach/desert claims, or equipment not used by the operator. | Horse-tour primary images, cards and a tour-specific gallery. |
| Turkish bath / spa | Verified photography of the actual venue or treatment environment, accurately showing facilities included in the booked product. | Calm landscape/detail set, minimum 2400×1600, with uncluttered central focal area; obtain property and model releases. | Generic resort beaches, medical claims, nudity, identifiable guests without consent, luxury facilities not included, or another venue. | Spa primary image, treatment/facility gallery and cards. |
| El Gouna | Current, genuine El Gouna lagoon/marina/city-tour imagery captured on the advertised route, ideally including the actual transfer/boat context. | Wide landscape minimum 2400×1600; retain recognizable location cues in mobile crop and provide a human-scale operational image. | Generic Red Sea sunset, another marina, private-property access not offered, digitally invented landmarks, or services not included. | El Gouna primary image, destination/tour gallery, cards and approved social crop. |
| Quad tours | Actual operator quads, protective equipment and route, with separate daylight and sunset sessions if both products are sold. | Action-safe landscape master at least 2400×1600; leave room around riders and dust, with a central mobile focal point. | Camel-only imagery, unsafe/no-helmet operation, stunts, routes not used, exaggerated speed, or sunset imagery assigned to the morning tour. | Morning and sunset quad primary images and distinct curated galleries. |
| Dolphin House | Authentic boat, crew, reef and guest experience from the actual excursion. Wildlife may appear only when genuinely photographed and documented. | Landscape minimum 2400×1600, horizon level, safe-water context visible; deliver boat/activity and optional wildlife frames separately. | Guaranteed dolphin encounters, captive animals presented as wild, unsafe proximity/touching, composite wildlife, or a different dive site/boat. | Dolphin House primary image and factual gallery; social use only with non-guarantee wording. |
| Senzo transfer | Genuine current Senzo Mall arrival/transfer context or the actual vehicle fleet, with permission for visible branding and plates handled safely. | Landscape 16:9 master minimum 2400×1350 plus mobile-safe 4:3 crop; keep vehicle/entrance centered with usable edge space. | Unlicensed mall imagery, obsolete branding, unrelated airport/boat transfers, identifiable plates or passengers without consent, or vehicles not supplied. | Senzo transfer primary image, card and small curated transfer gallery. |

## Administration impact

Implemented locally:

- Rights status, source, creator, license, attribution, authenticity, verification, checksum and focal-point fields.
- Localized media alt/caption table.
- Media usage table for shared-use detection and deletion safety.
- Desktop 16:9 and mobile 4:3 crop previews in the media editor.
- In-use deletion guard covering the new usage table and legacy string/JSON references.

Still required:

- Authenticated binary upload and Supabase Storage bucket policy.
- Magic-byte validation, byte/pixel limits, metadata stripping, checksum/dimension derivation.
- Responsive AVIF/WebP/fallback rendition generation.
- Media picker, sortable gallery editor, localized alt editor, usage browser and pagination.
- Soft-delete/archive plus privileged purge after retention and backup verification.
- Storage-object backup/restore; the current database backup does not include future media objects.

## URL, SEO and cache impact

Existing public filenames were preserved. This avoids breaking database strings, galleries, structured data, indexed image URLs and cached social cards. When approved replacements are introduced, use versioned filenames or stable asset IDs and update public image, Open Graph, Twitter, JSON-LD, sitemap, translations and credits atomically.

The generic SVG Open Graph asset still uses legacy branding and should eventually receive a raster 1200×630 replacement. Blog metadata currently uses the generic social image even though Article JSON-LD names the article hero. These changes should follow rights verification.

## What was not verified

- Production `content_items` and `media_assets` records were not mutated or exhaustively exported.
- No external purchase invoices, photographer releases, supplier agreements or Shutterstock licenses were available.
- The installed in-app browser runtime was initialized and its bootstrap troubleshooting followed; browser discovery returned an empty list, so screenshots, console/network inspection and visual responsive checks could not be produced in this environment.
- Authentication-protected administration screens were not visually exercised in a browser.
- No isolated Supabase preview branch is currently present. The only connected project matches the application environment and was treated as production; the migration was not applied there.

## Rollback

Revert the application files listed in the implementation summary. The migration is additive; rollback should first stop writes to the new fields, then drop `media_usages` and `media_asset_localizations`, followed by the added columns and constraints only after confirming no governed metadata must be retained. Do not rename or delete existing public images during rollback.
