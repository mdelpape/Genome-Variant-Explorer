#!/bin/sh
set -e

# Container entrypoint: bring the database schema up to date, optionally seed
# sample data, then hand off to the main process (CMD).

echo "→ Preparing database schema..."
if ls prisma/migrations/*/migration.sql >/dev/null 2>&1; then
  # Committed migrations exist — apply them.
  npx prisma migrate deploy
else
  # No migration files present — push the schema directly so the app still runs.
  echo "  No migrations found; syncing schema with 'prisma db push'."
  npx prisma db push --skip-generate
fi

if [ "${SEED_ON_START}" = "true" ]; then
  echo "→ Seeding sample data (idempotent)..."
  npx prisma db seed || echo "  Seed skipped/failed; continuing."
fi

echo "→ Starting application..."
exec "$@"
