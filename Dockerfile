FROM node:22-slim

ENV NODE_ENV=production \
    LEAD_WEBHOOK_HOST=0.0.0.0 \
    LEAD_WEBHOOK_PORT=8787 \
    LEAD_WEBHOOK_DB=/data/sofexpo.sqlite

WORKDIR /app

# Git is needed by the Telegram blog publisher.
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates git \
    && rm -rf /var/lib/apt/lists/*

# The Telegram blog parser needs parse5. Install its isolated, locked runtime
# dependencies only; do not install the Astro website dependency tree in this image.
COPY scripts/backend/package.json scripts/backend/package-lock.json ./scripts/backend/
RUN npm ci --prefix scripts/backend --omit=dev --ignore-scripts --no-audit --no-fund

# .git intentionally remains in the Docker context so Telegram sync can commit/push
# generated content from this checkout. .dockerignore excludes local env/node_modules.
COPY . .

RUN chmod +x scripts/backend/fly-start.sh && mkdir -p /data

EXPOSE 8787

CMD ["/app/scripts/backend/fly-start.sh"]
