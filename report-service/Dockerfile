FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Runtime ───────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/swagger.yaml ./swagger.yaml

ENV NODE_ENV=production
EXPOSE 3005

CMD ["node", "dist/server.js"]
