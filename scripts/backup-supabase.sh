#!/usr/bin/env bash
set -euo pipefail

if [[ -f .env.backup ]]; then
  # Dedicated local backup credentials. This file is ignored by Git.
  set -a
  # shellcheck disable=SC1091
  source .env.backup
  set +a
fi

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "SUPABASE_DB_URL is required."
  echo "Set it to the Supabase database connection string (postgresql://...)."
  exit 1
fi

case "$SUPABASE_DB_URL" in
  postgres://*|postgresql://*) ;;
  *)
    echo "SUPABASE_DB_URL must be a PostgreSQL connection URL starting with postgres:// or postgresql://."
    echo "A database name alone makes pg_dump look for a local PostgreSQL server."
    exit 1
    ;;
esac

pg_dump_bin="${PG_DUMP_BIN:-}"
if [[ -z "$pg_dump_bin" ]]; then
  if command -v pg_dump >/dev/null 2>&1; then
    pg_dump_bin="$(command -v pg_dump)"
  elif [[ -x "./.tools/postgres/bin/pg_dump" ]]; then
    pg_dump_bin="./.tools/postgres/bin/pg_dump"
  elif [[ -x "$HOME/Applications/Postgres.app/Contents/Versions/latest/bin/pg_dump" ]]; then
    pg_dump_bin="$HOME/Applications/Postgres.app/Contents/Versions/latest/bin/pg_dump"
  elif [[ -x "/Applications/Postgres.app/Contents/Versions/latest/bin/pg_dump" ]]; then
    pg_dump_bin="/Applications/Postgres.app/Contents/Versions/latest/bin/pg_dump"
  else
    echo "pg_dump was not found. Install PostgreSQL client tools or set PG_DUMP_BIN."
    exit 1
  fi
fi

if [[ ! -x "$pg_dump_bin" ]]; then
  echo "PG_DUMP_BIN is not executable: $pg_dump_bin"
  exit 1
fi

backup_dir="${BACKUP_DIR:-./backups}"
mkdir -p "$backup_dir"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
target="$backup_dir/daily-red-sea-$timestamp.dump"

"$pg_dump_bin" --format=custom --no-owner --no-privileges --file="$target" "$SUPABASE_DB_URL"
chmod 600 "$target"
echo "Backup created: $target"
