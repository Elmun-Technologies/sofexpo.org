#!/bin/sh
set -eu

: "${GITHUB_TOKEN:?GITHUB_TOKEN must be set as a Fly secret for Telegram blog publishing}"

git -C /app remote set-url origin \
  "https://x-access-token:${GITHUB_TOKEN}@github.com/Elmun-Technologies/sofexpo.org.git"

exec node /app/scripts/lead-webhook.mjs
