#!/bin/sh
set -eu

# Entrypoint for the root Dockerfile image, running on Hetzner via Coolify (docs/25).
# GITHUB_TOKEN is required only when the Telegram blog publisher is allowed to push
# (BLOG_SYNC_GIT_PUSH=1); it is a Coolify environment variable, never baked into the image.
if [ "${BLOG_SYNC_GIT_PUSH:-0}" = "1" ]; then
  : "${GITHUB_TOKEN:?GITHUB_TOKEN must be set (as a host secret) when BLOG_SYNC_GIT_PUSH=1}"
  git -C /app remote set-url origin \
    "https://x-access-token:${GITHUB_TOKEN}@github.com/Elmun-Technologies/sofexpo.org.git"
fi

exec node /app/scripts/lead-webhook.mjs
