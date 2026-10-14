FROM node:22-slim

ENV NODE_ENV=production \
    LEAD_WEBHOOK_HOST=0.0.0.0 \
    LEAD_WEBHOOK_PORT=8787 \
    LEAD_WEBHOOK_DB=/data/sofexpo.sqlite

WORKDIR /app

# The API uses only Node built-ins. Git is needed by the Telegram blog publisher.
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates git \
    && rm -rf /var/lib/apt/lists/*

# .git intentionally remains in the Docker context: Telegram sync commits/pushes
# generated content from this checkout. .dockerignore excludes local env files.
COPY . .

RUN chmod +x scripts/backend/fly-start.sh && mkdir -p /data

EXPOSE 8787

CMD ["/app/scripts/backend/fly-start.sh"]
