# Local database verification

This directory is configured for the isolated local project
`daily-red-sea-local`. It must never be pointed at the hosted project.

Prerequisites are a local Docker-compatible runtime and Supabase CLI. Before
running a reset, verify that `supabase/config.toml` still uses that project ID,
that ports `54320`–`54324` resolve on `127.0.0.1`, and that `DOCKER_HOST` points
to the intended local daemon. Unset `SUPABASE_ACCESS_TOKEN`,
`SUPABASE_DB_PASSWORD`, `DATABASE_URL`, and `DIRECT_URL`.

Run a clean replay and the synthetic integration suite:

```sh
supabase db reset --local --yes
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -v ON_ERROR_STOP=1 -f supabase/tests/database_integration.sql
```

The test runs in one transaction and rolls back every synthetic fixture. The
seed contains only a non-public synthetic marker, plus `seeds/finance_demo.sql`:
synthetic partners, bookings, expenses and manual exchange rates (references
`DEMO-…`) for trying the finance screens locally. `tests/finance-seed.test.ts`
replays it on every test run.

Financial records (bookings, expenses, partners, assignments, receipts, ledger
and finance lines) are never deleted; they are archived, voided, deactivated or
cancelled. The audit log is append-only. Do not put customer data,
hosted credentials, database dumps, or VM/container files in this directory.
