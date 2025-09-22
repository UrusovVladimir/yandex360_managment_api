FROM node:22.19-alpine

WORKDIR /app

RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    postgresql-client \
    nano

COPY package*.json ./

RUN npm ci --only=production

COPY . .
COPY .env.production .env
COPY migrations /app/migrations

RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs

RUN chown -R appuser:nodejs /app

USER appuser

EXPOSE 5050

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5050/api/health || exit 1

CMD ["node", "server.js"]