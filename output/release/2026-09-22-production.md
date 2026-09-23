# Production release — 22 September 2026

- Commit: e9df72e333676b5a8dd5ceed64cddcce4195d6b7; pushed to origin/main, preserving ccbd2fa blog updates.
- Vercel deployment: dpl_CAYXzFpyGn3e5YXRht9fWNoYup14, production READY at 02:12:42 UTC. Build/deploy duration approximately 2 minutes 25 seconds.
- URL: https://dailyredsea.com
- Deployment: https://inhurghada-site-ncy9-a4ney83w9-daily-red-sea.vercel.app
- Migration 20260921205256_referral_operational_analytics applied; analytics view verified security_invoker=true, anon/authenticated access denied, service access granted. Main referral hardening migration was already live.
- Local release validation: 456 tests in 56 files, lint, TypeScript and production build passed after incorporating latest remote changes.
- Live mobile 390px checks: /referrals, /ar/referrals, /reviews, /ar/reviews all HTTP 200; expected en/ltr or ar/rtl, no horizontal overflow, no page errors.
- Protected cron and admin booking-PDF routes returned 401 without authentication. Owned yacht photograph returned HTTP 200 image/jpeg.
- Vercel runtime error scan since readiness: no errors found at verification time. This is an immediate release check, not sustained monitoring; drains were not inspected.
- No test bookings were created and no customer messages were sent. Actual email-provider receipt and completed-trip attachment delivery remain untested in production.
- Database security advisors reported existing server-only RLS tables with no public policies, authenticated admin helper functions, and disabled leaked-password protection. The new view passed explicit access verification. Unrelated security settings were not changed. Reference: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable and https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection .
