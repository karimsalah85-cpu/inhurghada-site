#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "SUPABASE_DB_URL is required."
  exit 1
fi

backup_dir="${BACKUP_DIR:-./backups}"
mkdir -p "$backup_dir"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
target="$backup_dir/daily-red-sea-$timestamp.dump"

pg_dump --format=custom --no-owner --no-privileges --file="$target" "$SUPABASE_DB_URL"
chmod 600 "$target"
echo "Backup created: $target"
