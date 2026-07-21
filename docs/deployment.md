# Deployment

_Internal engineering documentation — Genome Variant Explorer._

This document covers running the application in production. The app is a
standard Next.js 15 server; the only external dependency is a PostgreSQL
database.

## 1. Requirements

- Node.js 18.18+ runtime (20/22/24 recommended).
- A reachable PostgreSQL 14+ instance.
- One environment variable: `DATABASE_URL` (plus optional `DIRECT_URL`).

## 2. Environment variables

| Variable       | Required | Description                                                  |
| -------------- | -------- | ------------------------------------------------------------ |
| `DATABASE_URL` | Yes      | PostgreSQL connection string (app + migrations).             |
| `DIRECT_URL`   | No       | Direct connection for migrations when the app uses a pooler. |

Example:

```
DATABASE_URL="postgresql://user:pass@db-host:5432/gve?schema=public&connection_limit=10"
```

When using a serverless/pooled Postgres (Neon, Supabase, PgBouncer), point
`DATABASE_URL` at the **pooled** endpoint and `DIRECT_URL` at the **direct**
endpoint so migrations bypass the pooler.

## 3. Build & run

```bash
npm ci                 # reproducible install
npm run build          # prisma generate + next build
npm run prisma:deploy  # apply migrations to the target DB
npm run start          # start the production server (default :3000)
```

`npm run build` runs `prisma generate` first (see the `build` script) so the
Prisma client is always in sync with the schema in the built artifact.

## 4. Deployment flow

```mermaid
flowchart LR
    A[Git push / CI] --> B[npm ci]
    B --> C[npm run build<br/>prisma generate + next build]
    C --> D[Run DB migrations<br/>prisma migrate deploy]
    D --> E[Start / release<br/>next start]
    E --> F[(PostgreSQL)]
```

Ordering matters: **migrate before releasing** the new server so the running
code never sees an older schema.

## 5. Platform notes

### Vercel

- Add `DATABASE_URL` (and `DIRECT_URL`) as project environment variables.
- The default build command (`next build`) works; ensure Prisma generates by
  keeping the `build` script (`prisma generate && next build`) or adding a
  `postinstall: prisma generate`.
- Run `prisma migrate deploy` from CI or a one-off job — Vercel builds should
  not run migrations against production implicitly.
- The upload route declares `maxDuration = 300`; confirm the plan allows the
  required function duration for large files. For very large uploads prefer a
  long-running Node host (below) or background ingestion.

### Node host / container (Docker, Fly, Render, ECS)

- Standard long-running Node server; no special configuration.
- Run `prisma migrate deploy` as a release/pre-start step.
- Health check: `GET /api/dashboard` returns 200 once the DB is reachable.

## 6. Configuration already in the codebase

- **Prisma singleton** (`lib/prisma.ts`) prevents connection exhaustion in dev
  and under serverless reuse.
- **`next.config.mjs`** raises the server action body size limit for large
  uploads.
- **Upload route** pins the Node runtime and a 300s `maxDuration`.

## 7. Post-deploy checklist

- [ ] `DATABASE_URL` set and reachable from the runtime.
- [ ] `prisma migrate deploy` applied (tables + indexes present).
- [ ] `GET /api/dashboard` returns 200.
- [ ] Upload the bundled `samples/sample.vcf` and confirm redirect to the
      dataset page with 15 variants.
- [ ] (Optional) `npm run db:seed` for demo data in non-production.

## 8. Scaling considerations

- **Database connections:** set `connection_limit` in `DATABASE_URL` or use a
  pooler; each server instance holds a pool.
- **Large files:** the current pipeline ingests within the request. For
  multi-hundred-MB files, move ingestion to a background worker/queue with a
  job record and poll status from the client.
- **Read scaling:** all hot query columns are indexed; add read replicas and
  point read-only queries at them if needed.
- **Observability:** Prisma logs errors/warnings; forward stdout/stderr to your
  log aggregator and add request tracing at the route-handler boundary.
```
