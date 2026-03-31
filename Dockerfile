# syntax=docker/dockerfile:1

# ── Stage 1: Build ──────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Install dependencies first (cache layer)
COPY package.json package-lock.json ./
COPY prisma/ ./prisma/
COPY prisma.config.ts ./
RUN npm ci

# Generate Prisma client (no DB needed here)
RUN npx prisma generate

# Copy full source & build Nuxt
COPY . .
RUN npm run build

# ── Stage 2: Production ────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
EXPOSE 3000

# Copy only the self-contained Nuxt output
COPY --from=builder /app/.output ./.output

# Copy Prisma migration files for runtime db push
COPY --from=builder /app/prisma/ ./prisma/
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/package.json ./package.json

USER node
CMD ["node", ".output/server/index.mjs"]
