#!/usr/bin/env bash
set -euo pipefail

# Playwright browser downloads can fail transiently with HTTP/2 CDN errors.
# Keep the install idempotent and retry the complete operation before failing CI.
export PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT="${PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT:-120000}"

for attempt in 1 2 3; do
  if npx --no-install playwright install --with-deps chrome && npm run browser:check; then
    exit 0
  fi

  if [[ "$attempt" -lt 3 ]]; then
    echo "Playwright Chrome installation failed on attempt $attempt; retrying in 10 seconds..." >&2
    sleep 10
  fi
done

echo "Playwright Chrome installation failed after 3 attempts." >&2
exit 1
