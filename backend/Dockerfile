# Stage 1: Build TypeScript
FROM node:22-alpine AS builder
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Stage 2: Production
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN apk add --no-cache --virtual .build-deps python3 make g++ && \
    npm ci --omit=dev && \
    apk del .build-deps
COPY --from=builder /app/dist ./dist
EXPOSE 3010
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3010/health || exit 1
CMD ["node", "dist/server.js"]
