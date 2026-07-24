# Backup and recovery

Daily Red Sea bookings and expenses use Supabase as the durable system of record. Vercel server memory is never a backup.

## Production policy

- Enable Supabase daily backups and point-in-time recovery when the project plan supports it.
- Run the independent database export at least weekly and before every schema migration.
- Store exports in an encrypted account outside Supabase and retain 4 weekly plus 6 monthly copies.
- Never commit `.dump` files or database credentials to Git.

## Create an independent backup

Install PostgreSQL client tools, set the direct Supabase database connection string in `SUPABASE_DB_URL`, then run:

```bash
npm run backup
```

Use `BACKUP_DIR` to write directly into an encrypted mounted backup location.

## Recovery drill

Quarterly, restore the newest dump into a separate non-production Supabase project with `pg_restore`. Confirm booking and expense counts, admin access policies, reports, and one read-only booking lookup. Never test restoration against production.
