# Referral hardening and customer PDFs — 22 September 2026

## Existing implementation and findings

The previous referral flow did not reliably enforce completed-and-paid qualification, combined identity checks, same-party/circular abuse protection, private verified balance access, or authoritative lifecycle reward posting. Dotted email addresses also broke the old signed token format. Claude reviewed the existing implementation; findings were reconciled against the repository and database tests rather than used as a separate redesign.

## Changes and files

The referral implementation is recorded in commit `a93bb98` (42 files). Key areas: `lib/referral-server.ts`, `lib/referral.ts`, `lib/referral-messages.ts`, `lib/referral-notification-copy.ts`, referral API routes, `components/booking/ReferralRewardsField.tsx`, all four checkout forms, referral dashboard, My Trips access, `components/admin/ReferralReviewPanel.tsx`, admin booking lifecycle handlers, and `lib/admin-automation.ts`.

The current follow-up changes cover `lib/post-trip-pdf.ts`, `lib/invoice-service.ts`, `lib/pdf/components.ts`, `lib/pdf/hero-image.ts`, `lib/booking-status-notification.ts`, `lib/referral-notifications.ts`, `next.config.ts`, PDF/database tests, and the operational analytics migration. Existing shared PDF work in commits `279f85d` and `d2ab961` was retained.

## Database and anti-abuse protections

`20260921070742_referral_acquisition_hardening.sql` adds qualification, immutable identity contacts, reward lifecycle triggers, transaction locking, review evidence/audit, verified OTP consumption and a retryable notification outbox. Referral qualification requires an authoritative completed, paid, positive-value, non-excluded booking. Existing customer detection matches email OR phone. Self-referral, known shared-party participants and historical cycles are rejected; uncertain same-hotel/tour/date evidence goes to review. Popular tour/date alone does not reject a customer.

Rewards are ledger entries, earned once and reversed/restored idempotently. Maximum redemption is three 5% units; unused units remain. Better promotions win without stacking or consuming unnecessary rewards. Invalid client redemption proofs fail closed. Unverified booking contacts cannot rewrite wallet identity. Customer balances require email OTP; public roles cannot access private account/OTP/admin analytics operations.

`20260921205256_referral_operational_analytics.sql` adds a service-only view over persisted creation, qualification, earning, redemption and rejected/review events, without exporting customer contact details to analytics vendors. Creation records remain visible after referral status changes.

## Customer communication and PDFs

Booking confirmation follows the supplied visual direction: owned hero photography, navy/ivory perforated ticket, booking reference/QR/payment stub, guest/support cards, and a separate policy page. Multi-trip confirmations preserve the full itinerary on additional flow-managed pages. Existing policy wording and authoritative pricing were retained.

Completion queues a thank-you email with a separate one-page PDF: review link/QR, GIVE 5% — EARN 5% invitation, referral link/QR and WhatsApp sharing. Neither the message nor its thank-you PDF repeats the booking price. Available referral sharing remains subject to completed-and-paid qualification. Six languages are supported. Simultaneous activation is folded into completion; later activation and reward earning have separate notifications. Stale/refunded/excluded events are suppressed; provider failure does not roll back earned rewards.

Only owned photos are loaded. Build traces include fonts, both brand wordmarks and the selected photos for booking, admin and cron PDF routes.

## Admin functionality

Authorized booking staff can inspect referral state and relevant evidence. Finance permission is required for ledger/review decisions. Review reasons and actors are recorded. Known passenger evidence and exclusion controls support manual fraud decisions without treating every shared destination as fraud.

## Validation

- Full suite: 456 tests across 56 files passed; lint, TypeScript and production build passed.
- 23 database invariant tests exercise the real migration in PGlite, including a restricted analytics view. Tests cover qualification, self/existing-customer/circular/shared-party rejection, uncertain review, ordinary unrelated customers, payment reversal, idempotency, maximum redemption, remaining balances, competing spends, cancellation restoration, promo precedence, identity protection, private access, OTP reuse/attempt caps and notification uniqueness.
- Pricing database integration passed: authoritative snapshots, promotions, replay immutability, rollback, capacity and role restrictions.
- Isolated mobile browser at 390px passed email verification, private balance, explicit reward opt-in, 20% balance with 15% redemption/5% remainder, identity switch and overflow checks, with no page errors. Booking and email requests were mocked; no customer messages or bookings were created.
- Six-language thank-you PDFs generated and rendered; review and sharing links verified, and extracted text checked for absence of sample payment amount/currency. Booking confirmation and policy pages visually inspected. Samples use synthetic customer information.
- Serverless trace manifests verified for booking, admin booking and cron routes.

## Release instructions and environment

The user explicitly authorized deployment on 22 September. Live inspection confirmed the main hardening migration was already applied and there were zero referral ledger entries, referrals or pending notifications. The sole pending analytics-view migration was applied with the CLI after its dry run. The production application release is being verified separately. Newer published blog commits were preserved by fast-forwarding the local checkout before release.

Before release: inspect the production migration history and historical reward ledger, back up the database, validate both pending migrations on staging, then apply only missing migrations in timestamp order. Deploy the reviewed application version after schema validation. Verify scheduled automation authorization, sender configuration and a controlled test recipient through completion, review link and referral activation. Check the affected routes and production deployment health.

No new environment variable is introduced. Existing `REFERRAL_TOKEN_SECRET`, database service credentials, email provider configuration and `CRON_SECRET` remain required. Do not expose or rotate them as part of this change without operational planning.

## Remaining limits

PGlite is a single connection: competing-spend tests do not replace a multi-connection PostgreSQL contention/load test. Historical ledger awards are preserved and require review before release; they are not silently erased. SMTP delivery is at least once: a crash after sending but before recording success can duplicate an email. Retry exhaustion needs operational monitoring. Actual provider receipt and live customer delivery have not been tested. Same-party detection can only use available evidence; uncertain cases require human review. Browser coverage is the English mobile checkout; all language PDFs are checked, but full multilingual browser checkout coverage is not claimed.
