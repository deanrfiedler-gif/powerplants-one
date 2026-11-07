#!/usr/bin/env bash
set -euo pipefail

# Bound apt as well as downloads. The download connection timeout alone does not
# cover a stalled package mirror. GNU timeout is supplied by Linux CI/images.
export PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT="${PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT:-120000}"

command -v timeout >/dev/null || { echo "Browser installation requires GNU timeout." >&2; exit 1; }

# Run the installation watchdog at the installer's privilege level: an unprivileged
# timeout cannot SIGKILL root apt children after sudo has created another session.
# Keep the browser/PDF guard under the original user, as in the test suite.
installer=()
if [[ "$(uname -s)" == Linux && "$(id -u)" != 0 ]]; then
  installer=(sudo -n -E)
fi

# Preserve the calling user's Linux cache even if sudo resets HOME. Chrome also
# installs cached FFmpeg, which later browser video capture must still find.
cache=()
if [[ "$(uname -s)" == Linux ]]; then
  cache=("PLAYWRIGHT_BROWSERS_PATH=${PLAYWRIGHT_BROWSERS_PATH:-${XDG_CACHE_HOME:-$HOME/.cache}/ms-playwright}")
fi

install_attempt() {
  local status=0
  # TERM plus --kill-after is insufficient: if npx exits on TERM, timeout exits
  # too, even when an apt descendant ignores TERM. Kill the entire group at the
  # deadline, then repair dpkg on the next attempt.
  "${installer[@]}" timeout --signal=KILL 120s env \
    PATH="$PATH" "${cache[@]}" \
    bash -c '
      set -euo pipefail
      if [[ "$1" != 1 && "$(uname -s)" == Linux ]]; then
        # Kernel apt/dpkg locks are released when the timed-out group dies.
        # Repair interrupted configuration; never unlink package-manager locks.
        dpkg --configure -a
      fi
      npx --no-install playwright install --with-deps chrome
    ' bash "$1" || status=$?
  if [[ "$status" == 124 || "$status" == 137 ]]; then
    echo "Playwright Chrome installation attempt $1 timed out (120 seconds)." >&2
  fi
  return "$status"
}

for attempt in 1 2 3; do
  if install_attempt "$attempt" && timeout --signal=KILL 30s npm run browser:check; then
    exit 0
  fi

  if [[ "$attempt" -lt 3 ]]; then
    echo "Playwright Chrome installation failed on attempt $attempt; retrying in 10 seconds..." >&2
    # Pinned Playwright expires __dirlock after 10s without its owner's heartbeat.
    # Let it reclaim its own stale lock; never delete a possibly live lock here.
    sleep 10
  fi
done

echo "Playwright Chrome installation failed after 3 attempts." >&2
exit 1
