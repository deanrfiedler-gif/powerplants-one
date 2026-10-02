#!/usr/bin/env bash
# Only the disposable GitHub Actions service. Full-schema DROP/upgrade proofs
# need more lock slots as the retained migration registry grows. This changes
# no application timeout, assertion, migration, hosted database or deployment.
set -euo pipefail
[[ "${GITHUB_ACTIONS:-}" == "true" ]]
[[ "${PPO_POSTGRES_CONTAINER:-}" =~ ^[a-f0-9]{64}$ ]]
container="$PPO_POSTGRES_CONTAINER"
[[ "$(docker exec "$container" psql -X -At -U ppo_local -d ppo_synthetic_test -c 'SELECT current_database()')" == "ppo_synthetic_test" ]]
docker exec "$container" psql -X -v ON_ERROR_STOP=1 -U ppo_local -d ppo_synthetic_test -c 'ALTER SYSTEM SET max_locks_per_transaction = 256'
docker restart "$container" >/dev/null
for attempt in {1..30}; do
  if docker exec "$container" pg_isready -U ppo_local -d ppo_synthetic_test >/dev/null; then
    break
  fi
  sleep 1
done
[[ "$(docker exec "$container" psql -X -At -U ppo_local -d ppo_synthetic_test -c 'SHOW max_locks_per_transaction')" == "256" ]]
printf '%s\n' 'Disposable ppo_synthetic_test lock capacity: 256'
