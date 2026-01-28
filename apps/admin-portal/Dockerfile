# Multi-stage build for Next.js Admin Portal
FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
COPY nx.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npx nx build admin-portal --prod

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/admin-portal/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/dist/apps/admin-portal/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/dist/apps/admin-portal/.next/static ./dist/apps/admin-portal/.next/static

USER nextjs

EXPOSE 3001

ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/ || exit 1

CMD ["node", "apps/admin-portal/server.js"]
