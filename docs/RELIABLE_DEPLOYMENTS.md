# Reliable deployment runbook

## Release policy

1. Make changes on a feature branch. Only `main` may be assigned as Vercel's Production Branch.
2. Open a pull request and wait for the `Quality gates` workflow and Vercel preview deployment to pass.
3. Test the preview URL with `npm run test:smoke -- https://<preview-url>`.
4. Merge only after the checks pass.
5. Promote the verified preview artifact to production. Do not rebuild an unverified commit directly in production.
6. Confirm `https://dailyredsea.com/api/health` returns HTTP 200 and `status: healthy`.

## Required deployment configuration

Configure every variable listed in `.env.example` in Vercel. The public Supabase URL and publishable key are required for both Preview and Production. The build intentionally fails before deployment when they are missing or the Supabase URL is malformed. The server-only service-role key is additionally required for privileged admin APIs, automation and database-managed live content.

Never put `SUPABASE_SERVICE_ROLE_KEY` in a `NEXT_PUBLIC_` variable. It is server-only.

## Vercel project settings

- Set the Production Branch to `main`.
- Require the GitHub `Quality gates` check before merging into `main`.
- Keep preview deployments enabled for pull requests.
- Configure a Vercel or external uptime monitor for `/api/health` and alert on any non-200 response.
- Enable notifications for failed production deployments and runtime 5xx errors.

## Incident response

1. Check `/api/health` to distinguish configuration/Supabase failure from a page-specific error.
2. Check Vercel Runtime Logs and the failed deployment's Build Logs.
3. Roll back the production alias to the most recent verified deployment if customers are affected.
4. Fix the issue on a branch, validate its preview, then promote that exact artifact.

Failed deployments do not replace the active production deployment. Avoid repeated redeploy attempts: fix the reported build failure first.
