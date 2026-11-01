# --- Stage 1: Install dependencies ---
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# --- Stage 2: Build the application ---
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* vars must be available at build time.
# Pass them via --build-arg or a .env file mounted at build time.
ARG NEXT_PUBLIC_BASE_PATH=""
ARG NEXT_PUBLIC_SITE_TITLE="geo-spatial.org Explorer"
ARG NEXT_PUBLIC_SITE_URL="https://explorer.geo-spatial.org"
ARG NEXT_PUBLIC_TITILER_URL="http://localhost:8000"
ARG NEXT_PUBLIC_GEOSERVER_URL="https://services.geo-spatial.org/geoserver"
ARG NEXT_PUBLIC_GA_MEASUREMENT_ID=""

ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH
ENV NEXT_PUBLIC_SITE_TITLE=$NEXT_PUBLIC_SITE_TITLE
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_TITILER_URL=$NEXT_PUBLIC_TITILER_URL
ENV NEXT_PUBLIC_GEOSERVER_URL=$NEXT_PUBLIC_GEOSERVER_URL
ENV NEXT_PUBLIC_GA_MEASUREMENT_ID=$NEXT_PUBLIC_GA_MEASUREMENT_ID

RUN npm run build

# --- Stage 3: Production runner ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
