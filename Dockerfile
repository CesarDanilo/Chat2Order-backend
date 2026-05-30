# =========================
# STAGE 1 — BUILDER
# =========================

FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

ENV DATABASE_URL="postgresql://admin:admin@localhost:5432/chat2order"

RUN npx prisma generate

RUN npm run build

# =========================
# STAGE 2 — PRODUCTION
# =========================

FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

CMD sh -c "npx prisma migrate deploy && node dist/server.js"
EXPOSE 3000