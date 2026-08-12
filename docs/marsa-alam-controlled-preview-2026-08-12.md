# Marsa Alam controlled-preview release note

The three new Marsa Alam products use the shared tour catalog, localization,
media-safety, pricing, booking validation, live-content import, SEO, and admin
control-center architecture. No Marsa Alam-only database table or migration was
introduced.

## Activation decision

Marsa Alam remains `comingSoon`, and all three products remain `paused`. Their
direct pages are reviewable but `noindex` and excluded from the production
sitemap until the following business facts are confirmed:

- Adult/child age boundary for every product; no infant price was invented.
- Included hotel zones and any remote supplements, including Port Ghalib,
  Coraya Bay, El Quseir, and southern Marsa Alam coverage.
- Marsa Mubarak booking cutoff.
- Whether Abu Dabbab's 13:00 milestone is departure from the beach.
- The assumed 18:00 Africa/Cairo previous-day cutoff for Dolphin House and Abu
  Dabbab.

## Administration impact

Authorized content administrators can manage publication status, destination,
EUR prices, schedules, cutoff, marina, itinerary, inclusions/exclusions,
localized content, SEO, related-tour data, and media through the existing
content record and its Advanced JSON editor. Existing availability overrides
continue to manage date blackouts and capacity. These fields are not yet
presented as dedicated structured form controls; that is an editor-experience
limitation, not a second source of truth.

## Media and safety

Only original Daily Red Sea category placeholder SVGs are used. No Hurghada or
unverified tourism photograph is assigned. Wildlife wording never guarantees
dolphins, turtles, dugongs, water entry, or interaction.

## Production order

Confirm the five business items above, update catalog/localized content, test
the active booking flow and capacity rules locally, then activate the products
and destination in one reviewed deployment. No production database migration
is required for this catalog-only change.
