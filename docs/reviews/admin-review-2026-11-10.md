# Admin review — 10 November 2026

Implemented locally on `admin/review-navigation-statistics-20261110`, based on the existing `seo/search-landing-pages` checkout. Production deployment is not part of this result.

## Changes

- The overview now groups workspace links using the same permission-filtered navigation model as the sidebar. Finance and listing activity appear before the workspace directory. All 35 navigation destinations have matching page files.
- Searching a subpage name, such as VAT or Pickup manifest, targets that subpage rather than its section's first page. Direct page matches take priority over keyword matches; Enter uses the same destination. Active-page styling follows the actual searched destination.
- Users & roles visibility follows the settings permission required by the page. Operators retain access to the existing supplier cost workspace through operations permission; this does not grant finance access or modify stored permissions.
- Shared workspace pages redirect unauthorized users to the overview instead of rendering empty workspace content.
- Reports-only users can inspect booking search results in a read-only view with month/reference search and pagination. Their overview queues link to this view rather than an editing-only detail endpoint. Global search can reach undated bookings alongside the selected month.
- Today's workload and the seven-day forecast count each multi-trip leg on its own date and use each leg's traveler counts. Financial balances and confirmation requests count the reservation once. Missing traveler counts and undated trip legs are explicitly identified.
- An oldest-first past-date list opens bookings not marked paid. Copy distinguishes booking payment status from accounting payment records, with a separate finance link.
- Dispatch setup shows future dates with configured seat limits and pickup-zone counts, with direct management links. Failed checks display Unavailable rather than zero.
- Booking and expense loading now pages through PostgREST's response cap, with deterministic ordering and exact-count checks. Supplier and sales-person lists use the same loader. The application still bounds bookings/expenses at 5,000 rows and partner lists at 2,000; a partial-data warning appears when records are excluded. These are loaded-record statistics, not unlimited historical aggregates.
- Rescheduling merges the returned booking fields into current state, including multi-trip snapshot changes. Overview and open booking panels use that state; refreshed server bookings replace stale copies.

## Verification

- Final full suite: **118 files, 1,039 tests passed** (`npx vitest run --maxWorkers=2`).
- ESLint passed.
- Final production build (`npx next build --webpack`) passed, including TypeScript and 1,110 generated pages.
- `git diff --check` passed.
- Browser tests used a temporary sample-data page mounting the actual AdminShell, AdminOverview and ReadOnlyBookings components. Checked VAT search destination; owner/operator/finance/content-editor visibility; pending-request action; dispatch setup prompts; no horizontal overflow at 320, 390 and 1,440 pixels in LTR and RTL. This was a layout-direction check, not Arabic translation verification.
- The temporary sample page was removed before the final build. No authentication bypass or sample route is included.
- An unauthenticated local admin visit reached the sign-in page. The test browser did not hold an authenticated local account, so real booking edits, rescheduling, finance writes and customer delivery were not exercised end to end.
- Claude supplied an independent read-only review in the existing Admin page review and reorganization conversation. Findings were checked against local code; Claude did not implement or deploy this change.
- Development browser logs included the existing React development-mode CSP/eval warning. No production security policy was weakened.

## Live database observations

Read-only checks against the configured Supabase project on 10 November 2026 found:

| Item | Count |
| --- | ---: |
| Non-archived bookings | 10 |
| Availability date rows | 0 |
| Pickup zones | 0 |
| Suppliers | 4 |
| Booking assignments | 6 |

Booking, waiver, assignment and pickup-zone tables were present. Counts do not establish complete workflow health. No database records, schema, seat limits, hotels or pickup times were changed.

Real capacities and hotel/pickup-zone timings are still required from operations before relying on those features. The admin links now expose that setup work.

## Production boundary

The existing signed-in Chrome tab initially displayed the live booking-profit report. Subsequent native-browser navigation reached the overview/bookings/report URLs but displayed a blank content area, including after retry. The browser extension access host was unavailable, preventing DOM-based diagnosis in that signed-in session. This is an unresolved observation, not evidence that the local changes are deployed or that all live workflows work.

No push, merge, deployment, customer messages, booking mutations or stored permission changes were performed. Authenticated production smoke checks are still required after an authorized release.
