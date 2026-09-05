# Acceptance and evidence

[acceptance-scenarios.csv](acceptance-scenarios.csv) contains AT-01–AT-38 from the master blueprint. Every full scenario remains planned and unexecuted. P01 now has runnable component tests; these do not establish the full catalogue's business acceptance.

Each future case needs requirement links, fixture/version, actor, preconditions, action, expected observable result, failure/recovery path, environment, actual result, evidence, defect links and reviewer disposition. Financial and calculation fixtures need independently accepted expected values rather than expectations copied from the implementation.

## Repository checks

`python3 scripts/check_foundation.py` validates source hashes, the derived register IDs/wording, initial backlog references, local Markdown links and selected hygiene. It makes no network calls and does not open or modify business accounts.

The GitHub documentation workflow uses `actions/checkout` pinned to the exact v7.0.1 commit verified from its official release/tag, with persisted credentials disabled and contents-read permission only. There are no deployment steps or application secrets.

Record execution status in [the foundation handover](../delivery/foundation-handover.md). Running the repository check cannot mark AT business scenarios passed. Branch protection and required checks must be assessed separately against actual account capabilities.

## Prototype procedures

[PP-01 acceptance](prototype-acceptance.md) provides 30 detailed synthetic procedures with a [structured catalogue](prototype-scenarios.json). All remain Not run. Parent scope coverage is bounded by the [disposition register](../prototype/traceability.csv); selected tests do not establish full-enterprise acceptance.

## P01 component evidence

The [P01 handover](../delivery/p01-handover.md) records exact runtime/database/browser commands, executed results, CI source commits and limitations. Application assurance runs against real PostgreSQL with separate competing connections and a database-process restart. Browser screenshots are viewport evidence, not real-device or offline readiness. The [dependency inventory](p01-dependencies.json) records pinned direct versions and transitive licence declarations.

## P02 component evidence

The [P02 handover](../delivery/p02-handover.md) records upgrade/fresh setup, permissions/projections, references, effective relationships/hierarchy/history, command rollback/replay and restart/browser evidence. Final PR checks and review govern completion; full PT-01/02/03 and AT acceptance remain Not run. The [P02 decision](../decisions/ADR-0007-p02-shared-foundation.md) records the material deferrals.
