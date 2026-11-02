#!/usr/bin/env bash
# Prepare a disposable cloud workspace (Codex Cloud, Claude Code cloud) for Powerplants One.
# Synthetic and loopback only: it creates the same disposable role, password and database
# that CI uses. Never run it against a hosted, shared or operational database.
#
# Usage, from anywhere inside the checkout:  bash scripts/cloud-setup.sh
# A branch that predates this script can run main's copy from the checkout root:
#   git fetch origin main && git show origin/main:scripts/cloud-setup.sh | bash
# Then, in every new shell:  source "$(dirname "$(git rev-parse --show-toplevel)")/.ppo-tools/env.sh"
set -euo pipefail

repo="$(git rev-parse --show-toplevel)"
cd "$repo"

node_version="$(tr -d '[:space:]' < .nvmrc)"
npm_version="$(sed -nE 's/.*"packageManager": *"npm@([0-9.]+)".*/\1/p' package.json)"
[[ -n "$node_version" && -n "$npm_version" ]] || { echo "Cannot read the pinned Node or npm version." >&2; exit 1; }

tools="${PPO_TOOLS_DIR:-$(dirname "$repo")/.ppo-tools}"
node_dir="$tools/node-v$node_version"
cache="$tools/npm-cache"
mkdir -p "$tools" "$cache"

# 1. Node and npm at the pinned versions, without root. The Node binary comes from the npm
#    registry's official node-linux-<arch> package, which npm checks against its published
#    integrity hash; cloud sandboxes usually reach the registry but not nodejs.org.
case "$(uname -m)" in
  x86_64) node_arch=x64 ;;
  aarch64 | arm64) node_arch=arm64 ;;
  *) echo "Unsupported machine: $(uname -m)" >&2; exit 1 ;;
esac
export npm_config_cache="$cache"
if [[ ! -x "$node_dir/bin/node" ]]; then
  command -v npm > /dev/null || { echo "An existing npm is needed to fetch the pinned Node." >&2; exit 1; }
  npm install --global --prefix "$node_dir" --no-audit --no-fund "node-linux-$node_arch@$node_version"
  [[ -x "$node_dir/bin/node" ]] || ln -sf "$node_dir/lib/node_modules/node-linux-$node_arch/bin/node" "$node_dir/bin/node"
fi
export PATH="$node_dir/bin:$PATH"
hash -r
[[ "$(node --version)" == "v$node_version" ]] || { echo "Node is $(node --version), expected v$node_version." >&2; exit 1; }
if [[ "$(npm --version)" != "$npm_version" ]]; then
  npm install --global --prefix "$node_dir" "npm@$npm_version"
  hash -r
fi
[[ "$(npm --version)" == "$npm_version" ]] || { echo "npm is $(npm --version), expected $npm_version." >&2; exit 1; }

cat > "$tools/env.sh" <<EOF
# Source this in every new shell before running node or npm for Powerplants One.
export PATH="$node_dir/bin:\$PATH"
export npm_config_cache="$cache"
EOF

# 2. Locked dependencies and the disposable local settings file.
npm ci
if [[ ! -f .env.local ]]; then
  cp .env.example .env.local
  sed -i -e 's/<local-password>/ppo_disposable_ci_only/' -e 's#/ppo_synthetic$#/ppo_synthetic_test#' .env.local
fi

# 3. PostgreSQL 16 with the disposable test database: the system package with root, otherwise a
#    Docker container, otherwise one already listening on 127.0.0.1:5432.
database=unavailable
if [[ "$(id -u)" == 0 ]]; then
  if ! command -v pg_ctlcluster > /dev/null || [[ ! -d /usr/lib/postgresql/16 ]]; then
    apt-get update
    DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql-16
  fi
  pg_ctlcluster 16 main start 2> /dev/null || true
  for _ in $(seq 1 30); do pg_isready -q -h 127.0.0.1 && break; sleep 1; done
  runuser -u postgres -- psql -X -q -v ON_ERROR_STOP=1 <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'ppo_local') THEN
    CREATE ROLE ppo_local LOGIN SUPERUSER PASSWORD 'ppo_disposable_ci_only';
  ELSE
    ALTER ROLE ppo_local LOGIN SUPERUSER PASSWORD 'ppo_disposable_ci_only';
  END IF;
END
$$;
SELECT 'CREATE DATABASE ppo_synthetic_test OWNER ppo_local'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ppo_synthetic_test') \gexec
SQL
  if [[ "$(runuser -u postgres -- psql -X -At -c 'SHOW max_locks_per_transaction')" != 256 ]]; then
    runuser -u postgres -- psql -X -q -c 'ALTER SYSTEM SET max_locks_per_transaction = 256'
    pg_ctlcluster 16 main restart
    for _ in $(seq 1 30); do pg_isready -q -h 127.0.0.1 && break; sleep 1; done
  fi
fi

port_open() { (exec 3<> /dev/tcp/127.0.0.1/5432) 2> /dev/null; }

# Without root, a reachable Docker daemon can run the same postgres:16.15 image CI uses.
# Codex Cloud has needed the socket named explicitly, with inherited Docker settings cleared.
if ! port_open && [[ "$(id -u)" != 0 ]]; then
  docker_cmd=()
  if command -v docker > /dev/null && docker info > /dev/null 2>&1; then
    docker_cmd=(docker)
  elif command -v docker > /dev/null && [[ -S /var/run/docker.sock ]]; then
    docker_cmd=(env -u DOCKER_HOST -u DOCKER_CONTEXT -u DOCKER_TLS_VERIFY -u DOCKER_CERT_PATH docker --host=unix:///var/run/docker.sock)
    "${docker_cmd[@]}" info > /dev/null 2>&1 || docker_cmd=()
  fi
  if (( ${#docker_cmd[@]} )); then
    "${docker_cmd[@]}" rm -f ppo-postgres > /dev/null 2>&1 || true
    "${docker_cmd[@]}" run -d --name ppo-postgres -p 127.0.0.1:5432:5432 \
      -e POSTGRES_USER=ppo_local -e POSTGRES_PASSWORD=ppo_disposable_ci_only -e POSTGRES_DB=ppo_synthetic_test \
      postgres:16.15 -c max_locks_per_transaction=256 > /dev/null
    for _ in $(seq 1 60); do
      "${docker_cmd[@]}" exec ppo-postgres pg_isready -q -U ppo_local -d ppo_synthetic_test && port_open && break
      sleep 1
    done
  fi
fi

if port_open; then
  npm run db:migrate
  npm run db:seed
  npm run db:health
  database=ready
fi

# 4. The pinned Chrome for Playwright and the PDF renderer. Its system dependencies need root,
#    and the download needs dl.google.com; without either, browser suites are left to CI.
browser=unavailable
if [[ "$(id -u)" == 0 ]] && npm run browser:install; then
  browser=ready
fi

echo
echo "Powerplants One cloud setup"
echo "  node $(node --version), npm $(npm --version)"
echo "  database: $database"
echo "  browser:  $browser"
echo "  In every new shell: source \"$tools/env.sh\""
if [[ "$database" != ready || "$browser" != ready ]]; then
  echo "  Suites that need an unavailable service are left to GitHub CI; report them as not run."
fi
