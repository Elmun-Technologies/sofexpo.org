#!/bin/sh
set -eu

# Shared entrypoint for every host that runs the root Dockerfile image (Fly.io, and the
# Hetzner/Coolify target, docs/25). GITHUB_TOKEN is required only when the Telegram blog
# publisher is allowed to push (BLOG_SYNC_GIT_PUSH=1); the token is a host secret (Fly
# secret or a Coolify environment variable), never baked into the image.
if [ "${BLOG_SYNC_GIT_PUSH:-0}" = "1" ]; then
  : "${GITHUB_TOKEN:?GITHUB_TOKEN must be set (as a host secret) when BLOG_SYNC_GIT_PUSH=1}"
  git -C /app remote set-url origin \
    "https://x-access-token:${GITHUB_TOKEN}@github.com/Elmun-Technologies/sofexpo.org.git"
fi

exec node /app/scripts/lead-webhook.mjs
