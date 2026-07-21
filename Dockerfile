# syntax=docker/dockerfile:1

# Multi-stage build for the Genome Variant Explorer.
#
# Stages:
#   base    - shared Node image with OpenSSL (required by the Prisma engine)
#   deps    - install ALL dependencies (dev included: prisma CLI, tsx, next)
#   builder - generate the Prisma client and build the Next.js app
#   runner  - final image; runs migrations then starts the server
#
# The runner keeps the full dependency set so the Prisma CLI (`migrate deploy`)
# and the tsx-based seed script are available at container start.

FROM node:20-bookworm-slim AS base
WORKDIR /app
# OpenSSL is needed by Prisma's query engine at runtime.
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# ---- dependencies ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- build ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# `npm run build` runs `prisma generate && next build`.
RUN npm run build

# ---- runtime ----
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# App build output, dependencies and the files needed for migrate + seed.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/server ./server
COPY --from=builder /app/samples ./samples
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
